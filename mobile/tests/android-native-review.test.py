#!/usr/bin/env python3
"""Provenance and UI-targeting guards for the native Android review workflow."""
import importlib.util
from pathlib import Path
import unittest
from unittest.mock import patch
from types import SimpleNamespace
import xml.etree.ElementTree as ET

SCRIPT = Path(__file__).parents[1] / "qa" / "android-smoke.py"
spec = importlib.util.spec_from_file_location("android_native_review", SCRIPT)
review = importlib.util.module_from_spec(spec)
spec.loader.exec_module(review)

SHA = "ab" * 20
RUN = {"status": "completed", "conclusion": "success", "event": "push", "head_branch": "main",
       "head_sha": SHA, "path": ".github/workflows/mobile.yml",
       "head_repository": {"full_name": review.REPOSITORY}}
ARTIFACT = {"id": 123, "size_in_bytes": 400, "name": review.ARTIFACT_NAME,
            "expired": False, "workflow_run": {"head_sha": SHA}}


class NativeReviewTests(unittest.TestCase):
    def test_actual_apk_brand_and_package_are_verified(self):
        good = "package: name='com.indiagully.app' versionCode='3'\napplication-label:'India Gully'\nlaunchable-activity: name='com.indiagully.app.MainActivity' label='India Gully' icon=''\n"
        self.assertEqual(review.apk_label(good), {"application": "India Gully", "launcher": "India Gully"})
        for bad in (good.replace("India Gully", "com.indiagully.app"), good.replace("com.indiagully.app", "other.app"), ""):
            with self.assertRaises(review.ReviewError):
                review.apk_label(bad)

    def test_chrome_and_unverified_foreground_are_rejected(self):
        review.assert_app_foreground("mResumedActivity: ActivityRecord{1 u0 com.indiagully.app/.MainActivity t1}")
        for value in ("mResumedActivity: ActivityRecord{1 u0 com.android.chrome/.Main t1}", "", "mResumedActivity: ActivityRecord{1 u0 com.indiagully.app/.BrowserProxyActivity t1}"):
            with self.assertRaises(review.ReviewError):
                review.assert_app_foreground(value)

    def test_login_must_be_actual_webview_content_with_live_form_fields(self):
        xml = '<hierarchy><node class="android.webkit.WebView" package="com.indiagully.app" bounds="[0,100][1080,1800]"><node text="Welcome back." package="com.indiagully.app" bounds="[10,120][1000,160]"/><node text="Email address" package="com.indiagully.app" bounds="[10,200][1000,240]"/><node class="android.widget.EditText" enabled="true" password="false" package="com.indiagully.app" bounds="[10,250][1000,300]"/><node class="android.widget.EditText" enabled="true" password="true" package="com.indiagully.app" bounds="[10,350][1000,400]"/></node></hierarchy>'
        self.assertTrue(review.staff_login_heading(xml))
        self.assertTrue(review.staff_login_fields(xml))
        self.assertFalse(review.staff_login_heading(xml.replace('android.webkit.WebView', 'android.view.View')))
        self.assertFalse(review.staff_login_fields(xml.replace('password="true"', 'password="false"')))
        self.assertFalse(review.staff_login_heading(xml.replace('com.indiagully.app', 'com.android.chrome')))

    def test_successful_main_source_is_accepted(self):
        review.verify_run(RUN, SHA)
        self.assertEqual(review.select_artifact([ARTIFACT], SHA)["id"], 123)

    def test_fork_pr_unfinished_and_wrong_commit_are_rejected(self):
        for key, value in (("event", "pull_request"), ("head_branch", "other"),
                           ("head_sha", "cd" * 20), ("conclusion", "failure"),
                           ("status", "in_progress"), ("path", ".github/workflows/other.yml"),
                           ("head_repository", {"full_name": "other/repo"})):
            with self.subTest(key=key), self.assertRaises(review.ReviewError):
                review.verify_run({**RUN, key: value}, SHA)

    def test_short_or_command_like_commit_is_not_accepted(self):
        for value in ("ab1234", "$(echo unsafe)", "ab" * 19 + ";x", "AB" * 20):
            with self.assertRaises(review.ReviewError):
                review.verify_run(RUN, value)

    def test_expired_ambiguous_and_wrong_commit_artifacts_are_rejected(self):
        for artifacts in ([], [ARTIFACT, ARTIFACT], [{**ARTIFACT, "expired": True}],
                          [{**ARTIFACT, "workflow_run": {"head_sha": "cd" * 20}}],
                          [{**ARTIFACT, "size_in_bytes": 0}], [{**ARTIFACT, "name": "unrelated"}]):
            with self.assertRaises(review.ReviewError):
                review.select_artifact(artifacts, SHA)

    def test_only_current_visible_app_nodes_can_be_clicked(self):
        xml = f'''<hierarchy>
          <node package="{review.PACKAGE}" content-desc="Explore" bounds="[0,1720][210,1850]"/>
          <node package="com.android.settings" content-desc="Explore" bounds="[0,0][200,200]"/>
          <node package="{review.PACKAGE}" content-desc="Hidden" bounds="[0,0][0,0]"/>
        </hierarchy>'''
        nodes = review.nodes_from_xml(xml)
        self.assertEqual(len(nodes), 1)
        self.assertEqual(review.text_of(nodes[0]), "Explore")

    def test_card_selector_does_not_match_tab_or_non_clickable_text(self):
        card = ET.fromstring('<node content-desc="Explore A public property" clickable="true"/>')
        tab = ET.fromstring('<node content-desc="Explore" clickable="true"/>')
        text = ET.fromstring('<node content-desc="Explore A public property" clickable="false"/>')
        self.assertTrue(review.explore_card(card))
        self.assertFalse(review.explore_card(tab))
        self.assertFalse(review.explore_card(text))

    def test_bounds_are_clipped_to_real_screen(self):
        self.assertEqual(review.bounds(ET.fromstring('<node bounds="[10,1800][1200,2100]"/>')), (10, 1800, 1080, 1920))
        self.assertIsNone(review.bounds(ET.fromstring('<node bounds="[10,2000][500,2100]"/>')))

    def test_physical_device_is_rejected_before_any_install_or_clear(self):
        with patch.object(review.subprocess, "run", return_value=SimpleNamespace(stdout="List of devices attached\nphysical-device\tdevice\n")) as run:
            with self.assertRaises(review.ReviewError):
                review.Device(Path("unused"))
            self.assertEqual(run.call_count, 1)

    def test_multiple_devices_are_not_implicitly_selected(self):
        with patch.object(review.subprocess, "run", return_value=SimpleNamespace(stdout="List of devices attached\nemulator-5554\tdevice\nemulator-5556\tdevice\n")):
            with self.assertRaises(review.ReviewError):
                review.Device(Path("unused"))


if __name__ == "__main__":
    unittest.main()

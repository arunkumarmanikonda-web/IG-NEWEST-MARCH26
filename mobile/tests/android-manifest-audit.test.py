#!/usr/bin/env python3
"""Release security regressions; no credentials, network, or Android build needed."""
import importlib.util
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch
from types import SimpleNamespace
from zipfile import ZipFile

SCRIPT = Path(__file__).parents[1] / "scripts" / "audit-android-bundle.py"
spec = importlib.util.spec_from_file_location("android_manifest_audit", SCRIPT)
audit = importlib.util.module_from_spec(spec)
spec.loader.exec_module(audit)

CONFIG = {"version": "1.0.0", "android": {"package": "com.indiagully.app", "versionCode": 2,
          "blockedPermissions": ["android.permission.CAMERA", "android.permission.VIBRATE"]}}
BASELINE = {"minSdk": 24, "targetSdk": 36, "source": "installed-react-native-fixture"}
MANIFEST = '''<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.indiagully.app" android:versionCode="2" android:versionName="1.0.0">
  <uses-sdk android:minSdkVersion="24" android:targetSdkVersion="36"/>
  <uses-permission android:name="android.permission.INTERNET"/>
  <permission android:name="com.indiagully.app.DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION" android:protectionLevel="signature"/>
  <uses-permission android:name="com.indiagully.app.DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION"/>
  <application android:allowBackup="false">
    <activity android:name=".MainActivity" android:exported="true">
      <intent-filter><action android:name="android.intent.action.MAIN"/><category android:name="android.intent.category.LAUNCHER"/></intent-filter>
      <intent-filter><action android:name="android.intent.action.VIEW"/><category android:name="android.intent.category.BROWSABLE"/><data android:scheme="indiagully"/></intent-filter>
    </activity>
    <activity android:name="expo.modules.webbrowser.BrowserProxyActivity" android:exported="false"/>
    <provider android:name="androidx.startup.InitializationProvider" android:authorities="com.indiagully.app.androidx-startup" android:exported="false"/>
    <receiver android:name="androidx.profileinstaller.ProfileInstallReceiver" android:exported="true" android:permission="android.permission.DUMP"/>
  </application>
</manifest>'''


class ManifestAuditTests(unittest.TestCase):
    def check_manifest(self, xml=MANIFEST):
        return audit.audit_manifest(xml, CONFIG, BASELINE)

    def test_release_with_launcher_and_protected_androidx_receiver(self):
        report = self.check_manifest()
        self.assertEqual(report["errors"], [])
        self.assertEqual((report["package"], report["versionCode"], report["minSdk"], report["targetSdk"]),
                         ("com.indiagully.app", 2, 24, 36))
        self.assertFalse(report["application"]["usesCleartextTraffic"])
        self.assertTrue(report["components"][-1]["exported"])
        self.assertEqual(report["components"][0]["intentFilters"][1]["data"], [{"scheme": "indiagully"}])

    def test_actual_binary_identity_must_match_config(self):
        for before, after in [('package="com.indiagully.app"', 'package="com.other.app"'),
                              ('versionCode="2"', 'versionCode="3"'), ('versionName="1.0.0"', 'versionName="1.1.0"')]:
            with self.subTest(after=after):
                self.assertEqual(self.check_manifest(MANIFEST.replace(before, after))["status"], "failed")

    def test_debug_test_backup_and_cleartext_are_rejected(self):
        for name in ("debuggable", "testOnly", "usesCleartextTraffic"):
            xml = MANIFEST.replace('<application ', f'<application android:{name}="true" ')
            with self.subTest(flag=name):
                self.assertIn(f"Unsafe release flag: {name}=true.", self.check_manifest(xml)["errors"])
        self.assertEqual(self.check_manifest(MANIFEST.replace('android:allowBackup="false"', ''))["status"], "failed")

    def test_resource_flags_and_network_config_are_not_assumed_safe(self):
        xml = MANIFEST.replace('<application ', '<application android:debuggable="@bool/debug_mode" ')
        with self.assertRaises(audit.AuditError):
            self.check_manifest(xml)
        xml = MANIFEST.replace('<application ', '<application android:networkSecurityConfig="@xml/network_security_config" ')
        self.assertEqual(self.check_manifest(xml)["status"], "failed")

    def test_camera_and_alternative_permission_elements_cannot_bypass_guard(self):
        for element in ("uses-permission", "uses-permission-sdk-23", "uses-permission-sdk-m"):
            xml = MANIFEST.replace('<application ', f'<{element} android:name="android.permission.CAMERA" android:maxSdkVersion="32"/><application ')
            with self.subTest(element=element):
                self.assertEqual(self.check_manifest(xml)["status"], "failed")
        for permission in ("android.permission.READ_CONTACTS", "android.permission.MANAGE_EXTERNAL_STORAGE",
                           "android.permission.QUERY_ALL_PACKAGES", "com.google.android.gms.permission.AD_ID"):
            xml = MANIFEST.replace("android.permission.INTERNET", permission)
            self.assertEqual(self.check_manifest(xml)["status"], "failed")

    def test_custom_permission_must_be_signature_not_normal(self):
        for protection in ("normal", "dangerous", "signatureOrSystem", "3"):
            self.assertEqual(self.check_manifest(MANIFEST.replace('protectionLevel="signature"', f'protectionLevel="{protection}"'))["status"], "failed")
        self.assertEqual(self.check_manifest(MANIFEST.replace('protectionLevel="signature"', 'protectionLevel="0x00000002"'))["status"], "passed")
        duplicate = '<permission android:name="com.indiagully.app.DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION" android:protectionLevel="normal"/>'
        self.assertEqual(self.check_manifest(MANIFEST.replace('<application ', duplicate + '<application '))["status"], "failed")

    def test_unprotected_exports_fail_and_profile_permission_cannot_be_removed(self):
        xml = MANIFEST.replace(' android:permission="android.permission.DUMP"', '')
        self.assertEqual(self.check_manifest(xml)["status"], "failed")
        for component in ("activity", "service", "receiver", "provider"):
            xml = MANIFEST.replace('</application>', f'<{component} android:name=".Unexpected" android:exported="true"/></application>')
            with self.subTest(component=component):
                self.assertEqual(self.check_manifest(xml)["status"], "failed")

    def test_signature_protected_component_is_not_a_false_positive(self):
        node = '<service android:name=".PrivateService" android:exported="true" android:permission="com.indiagully.app.DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION"/>'
        self.assertEqual(self.check_manifest(MANIFEST.replace('</application>', node + '</application>'))["status"], "passed")

    def test_provider_read_write_overrides_are_evaluated(self):
        node = '<provider android:name=".PrivateProvider" android:exported="true" android:permission="com.indiagully.app.DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION"/>'
        self.assertEqual(self.check_manifest(MANIFEST.replace('</application>', node + '</application>'))["status"], "passed")
        node = node.replace('/>', ' android:readPermission=""/>')
        self.assertEqual(self.check_manifest(MANIFEST.replace('</application>', node + '</application>'))["status"], "failed")

    def test_intent_filter_requires_explicit_exported_on_current_sdk(self):
        xml = MANIFEST.replace('android:name=".MainActivity" android:exported="true"', 'android:name=".MainActivity"')
        self.assertTrue(any("Missing explicit exported" in x for x in self.check_manifest(xml)["errors"]))

    def test_provider_default_is_private_on_current_sdk(self):
        xml = MANIFEST.replace('android:authorities="com.indiagully.app.androidx-startup" android:exported="false"', 'android:authorities="com.indiagully.app.androidx-startup"')
        self.assertEqual(self.check_manifest(xml)["status"], "passed")

    def test_sdk_floor_comes_from_installed_dependency(self):
        with tempfile.TemporaryDirectory() as directory:
            source = Path(directory) / "manifest.xml"
            source.write_text(MANIFEST.replace('minSdkVersion="24"', 'minSdkVersion="25"'))
            baseline = audit.read_sdk_baseline(source)
        self.assertEqual(baseline["minSdk"], 25)
        self.assertEqual(audit.audit_manifest(MANIFEST, CONFIG, baseline)["status"], "failed")
        self.assertEqual(self.check_manifest(MANIFEST.replace('targetSdkVersion="36"', 'targetSdkVersion="35"'))["status"], "failed")

    def test_shared_identity_and_manifest_entities_rejected(self):
        xml = MANIFEST.replace('package="com.indiagully.app"', 'package="com.indiagully.app" android:sharedUserId="android.uid.system"')
        self.assertEqual(self.check_manifest(xml)["status"], "failed")
        with self.assertRaises(audit.AuditError):
            self.check_manifest('<!DOCTYPE manifest [<!ENTITY sample "text">]>' + MANIFEST)


class BundleToolBoundaryTests(unittest.TestCase):
    def test_wrong_tool_is_never_executed(self):
        with patch.object(audit, "sha256", return_value="wrong"), patch.object(audit.subprocess, "run") as run:
            with self.assertRaises(audit.AuditError):
                audit.inspect_bundle(Path("release.aab"), Path("tool.jar"))
            run.assert_not_called()

    def test_actual_bundle_is_validated_and_dumped_with_same_path(self):
        with tempfile.TemporaryDirectory() as directory:
            bundle = Path(directory) / "release.aab"
            with ZipFile(bundle, "w") as archive:
                archive.writestr("base/manifest/AndroidManifest.xml", "protobuf-fixture-not-parsed-directly")
            with patch.object(audit, "sha256", return_value=audit.BUNDLETOOL_SHA256), patch.object(audit.subprocess, "run") as run:
                run.side_effect = [SimpleNamespace(returncode=0, stdout=""), SimpleNamespace(returncode=0, stdout=MANIFEST)]
                self.assertEqual(audit.inspect_bundle(bundle, Path("tool.jar")), MANIFEST)
                self.assertEqual(run.call_count, 2)
                for call in run.call_args_list:
                    self.assertIn(f"--bundle={bundle}", call.args[0])
                self.assertIn("--module=base", run.call_args_list[-1].args[0])

    def test_extra_modules_are_not_silently_ignored(self):
        with tempfile.TemporaryDirectory() as directory:
            bundle = Path(directory) / "release.aab"
            with ZipFile(bundle, "w") as archive:
                archive.writestr("base/manifest/AndroidManifest.xml", "fixture")
                archive.writestr("extra/manifest/AndroidManifest.xml", "fixture")
            with patch.object(audit, "sha256", return_value=audit.BUNDLETOOL_SHA256), patch.object(audit.subprocess, "run") as run:
                with self.assertRaises(audit.AuditError):
                    audit.inspect_bundle(bundle, Path("tool.jar"))
                run.assert_not_called()


if __name__ == "__main__":
    unittest.main()

#!/usr/bin/env python3
"""Native Android smoke/capture against a proven main-branch test APK.

Uses a disposable Android SDK emulator and its current accessibility tree, never
Expo Web, invented UI, private client accounts, or production write operations.
"""
import argparse
from datetime import datetime, timezone
import hashlib
import json
import os
from pathlib import Path
import re
import struct
import subprocess
import sys
import time
from urllib.request import Request, urlopen
import xml.etree.ElementTree as ET

REPOSITORY = "arunkumarmanikonda-web/IG-NEWEST-MARCH26"
PACKAGE = "com.indiagully.app"
ARTIFACT_NAME = "india-gully-android-test-debug-signed-apk"
WIDTH, HEIGHT = 1080, 1920


class ReviewError(RuntimeError):
    pass


def now():
    return datetime.now(timezone.utc).isoformat()


def verify_run(run, expected_commit):
    if not re.fullmatch(r"[0-9a-f]{40}", expected_commit):
        raise ReviewError("Supply the complete lowercase 40-character APK source commit.")
    expected = {"status": "completed", "conclusion": "success", "event": "push",
                "head_branch": "main", "head_sha": expected_commit,
                "path": ".github/workflows/mobile.yml"}
    if any(run.get(key) != value for key, value in expected.items()):
        raise ReviewError("APK must come from the specified successful main-branch Mobile app builds push run.")
    if run.get("head_repository", {}).get("full_name") != REPOSITORY:
        raise ReviewError("APK run belongs to an unexpected source repository.")


def select_artifact(artifacts, expected_commit):
    matches = [a for a in artifacts if a.get("name") == ARTIFACT_NAME and not a.get("expired")]
    if len(matches) != 1:
        raise ReviewError("Expected exactly one unexpired native Android test APK artifact.")
    artifact = matches[0]
    if artifact.get("workflow_run", {}).get("head_sha") != expected_commit:
        raise ReviewError("Artifact source commit does not match the approved build run.")
    if not isinstance(artifact.get("id"), int) or artifact.get("size_in_bytes", 0) <= 0:
        raise ReviewError("Artifact has no valid identity or payload.")
    return artifact


def verify_source(args):
    if not re.fullmatch(r"[1-9][0-9]*", args.run_id):
        raise ReviewError("Source run ID must be a positive number.")
    token = os.environ.get("GH_TOKEN")
    if not token:
        raise ReviewError("Read-only GitHub workflow token is required to verify the source artifact.")

    def get(suffix):
        request = Request(f"https://api.github.com/repos/{REPOSITORY}/{suffix}",
                          headers={"Authorization": f"Bearer {token}", "Accept": "application/vnd.github+json",
                                   "X-GitHub-Api-Version": "2022-11-28"})
        with urlopen(request, timeout=30) as response:
            return json.load(response)

    run = get(f"actions/runs/{args.run_id}")
    verify_run(run, args.expected_commit)
    listing = get(f"actions/runs/{args.run_id}/artifacts?name={ARTIFACT_NAME}&per_page=100")
    if listing.get("total_count", 0) > len(listing.get("artifacts", [])):
        raise ReviewError("Artifact results were incomplete; refusing to guess which build to run.")
    artifact = select_artifact(listing.get("artifacts", []), args.expected_commit)
    record = {"repository": REPOSITORY, "runId": int(args.run_id), "commit": args.expected_commit,
              "runUrl": run.get("html_url"), "artifactId": artifact["id"], "artifactName": ARTIFACT_NAME,
              "artifactDigest": artifact.get("digest"), "artifactCreatedAt": artifact.get("created_at"),
              "signing": "Development-key-signed standalone release-mode test APK; not the production Play binary",
              "verifiedAt": now()}
    args.output.mkdir(parents=True, exist_ok=True)
    (args.output / "source.json").write_text(json.dumps(record, indent=2) + "\n")
    if os.environ.get("GITHUB_OUTPUT"):
        with open(os.environ["GITHUB_OUTPUT"], "a") as handle:
            handle.write(f"artifact_id={artifact['id']}\n")
    print(f"Verified native test APK artifact {artifact['id']} from main {args.expected_commit}.")


def bounds(node):
    match = re.fullmatch(r"\[(\d+),(\d+)\]\[(\d+),(\d+)\]", node.get("bounds", ""))
    if not match:
        return None
    left, top, right, bottom = map(int, match.groups())
    left, top, right, bottom = max(0, left), max(0, top), min(WIDTH, right), min(HEIGHT, bottom)
    return (left, top, right, bottom) if right > left and bottom > top else None


def nodes_from_xml(xml):
    root = ET.fromstring(xml)
    return [n for n in root.iter("node") if n.get("package") == PACKAGE and bounds(n)]


def text_of(node):
    return node.get("content-desc") or node.get("text", "")


def exact_label(label):
    return lambda node: node.get("content-desc") == label or node.get("text") == label


def explore_card(node):
    label = node.get("content-desc", "")
    return label.startswith("Explore ") and node.get("clickable") == "true"


class Device:
    def __init__(self, output):
        result = subprocess.run(["adb", "devices"], capture_output=True, text=True, check=True)
        devices = [line.split()[0] for line in result.stdout.splitlines()[1:] if line.endswith("\tdevice")]
        if len(devices) != 1 or not devices[0].startswith("emulator-"):
            raise ReviewError("Native review requires exactly one disposable emulator, never a physical device.")
        self.serial = devices[0]
        self.output = output
        if self.adb("shell", "getprop", "ro.kernel.qemu").strip() != "1":
            raise ReviewError("Connected device is not an Android emulator.")

    def adb(self, *args, binary=False, check=True, timeout=40):
        result = subprocess.run(["adb", "-s", self.serial, *map(str, args)],
                                capture_output=True, text=not binary, timeout=timeout, check=False)
        if check and result.returncode:
            raise ReviewError(f"adb {args[0]} failed during native review.")
        return result.stdout

    def ui(self):
        self.adb("shell", "uiautomator", "dump", "--compressed", "/sdcard/india-gully-review.xml")
        xml = self.adb("exec-out", "cat", "/sdcard/india-gully-review.xml")
        return xml, nodes_from_xml(xml)

    def wait(self, predicate, timeout=45):
        deadline = time.monotonic() + timeout
        while time.monotonic() < deadline:
            try:
                xml, nodes = self.ui()
                matching = [node for node in nodes if predicate(node)]
                if matching:
                    return matching
            except (ReviewError, ET.ParseError):
                pass
            time.sleep(1)
        raise ReviewError("Expected native control did not become visible; see failure screenshot/tree.")

    def tap(self, predicate, bottommost=False):
        matches = self.wait(predicate)
        node = max(matches, key=lambda n: bounds(n)[1]) if bottommost else matches[0]
        left, top, right, bottom = bounds(node)
        label = text_of(node)
        self.adb("shell", "input", "tap", (left + right) // 2, (top + bottom) // 2)
        return label

    def tab(self, label):
        self.tap(exact_label(label), bottommost=True)
        self.wait(lambda n: n.get("content-desc") == label and n.get("selected") == "true")

    def scroll_to(self, predicate, attempts=10):
        for _ in range(attempts):
            _, nodes = self.ui()
            matches = [node for node in nodes if predicate(node)]
            if matches:
                return matches[0]
            self.adb("shell", "input", "swipe", WIDTH // 2, 1480, WIDTH // 2, 520, 400)
        raise ReviewError("Expected native control was not found while scrolling.")

    def launch(self):
        self.adb("shell", "am", "force-stop", PACKAGE)
        result = self.adb("shell", "am", "start", "-W", "-n", PACKAGE + "/.MainActivity")
        if "Error:" in result:
            raise ReviewError("Native MainActivity did not launch.")
        self.wait(exact_label("Home"))

    def screenshot(self, name):
        # Let the native modal transition and outstanding image paint settle.
        time.sleep(2)
        xml, _ = self.ui()
        png = self.adb("exec-out", "screencap", "-p", binary=True)
        if png[:8] != b"\x89PNG\r\n\x1a\n" or struct.unpack(">II", png[16:24]) != (WIDTH, HEIGHT):
            raise ReviewError("Native screenshot was not a valid 1080 by 1920 PNG.")
        (self.output / (name + ".png")).write_bytes(png)
        (self.output / (name + ".xml")).write_text(xml)
        return {"name": name, "file": name + ".png", "width": WIDTH, "height": HEIGHT,
                "sha256": hashlib.sha256(png).hexdigest(), "capturedAt": now()}


def capture(args):
    args.output.mkdir(parents=True, exist_ok=True)
    source = json.loads((args.output / "source.json").read_text())
    if source.get("repository") != REPOSITORY or source.get("artifactName") != ARTIFACT_NAME:
        raise ReviewError("Verified APK source record is missing.")
    apks = list(args.apk_directory.rglob("*.apk"))
    if len(apks) != 1:
        raise ReviewError("Expected exactly one downloaded APK.")
    apk = apks[0]
    device = Device(args.output)
    record = {"kind": "Actual native Android emulator screenshots and runtime smoke",
              "status": "running", "source": source, "apkSha256": hashlib.sha256(apk.read_bytes()).hexdigest(),
              "captureWorkflowCommit": os.environ.get("GITHUB_SHA"), "startedAt": now(),
              "device": {"serial": device.serial, "model": device.adb("shell", "getprop", "ro.product.model").strip(),
                         "sdk": device.adb("shell", "getprop", "ro.build.version.sdk").strip(), "width": WIDTH, "height": HEIGHT},
              "publicFeed": "https://indiagully.com/api/mobile/catalogue", "fixturesInjected": False,
              "checks": [], "screenshots": []}

    def frame(name):
        record["screenshots"].append(device.screenshot(name))

    try:
        device.adb("shell", "wm", "size", f"{WIDTH}x{HEIGHT}")
        device.adb("shell", "wm", "density", "420")
        device.adb("shell", "settings", "put", "system", "font_scale", "1.0")
        device.adb("install", "-r", str(apk), timeout=120)
        package_info = device.adb("shell", "dumpsys", "package", PACKAGE)
        installed_version = re.search(r"versionName=([^\s]+)", package_info)
        installed_code = re.search(r"versionCode=(\d+)", package_info)
        if not installed_version or not installed_code:
            raise ReviewError("Expected India Gully package was not installed.")
        record["installedPackage"] = {"name": PACKAGE, "version": installed_version.group(1),
                                      "versionCode": int(installed_code.group(1))}
        # This clears only the newly installed app on the fresh disposable emulator.
        device.adb("shell", "pm", "clear", PACKAGE)
        device.adb("logcat", "-c")
        device.launch()
        device.tab("Explore")
        device.wait(lambda n: bool(re.fullmatch(r"[1-9][0-9]* published briefs?", text_of(n))))
        device.scroll_to(explore_card)
        device.wait(explore_card)
        record["checks"].append("Live public catalogue rendered in native Android UI")
        device.tab("Home")
        frame("01-home")
        device.tab("Explore")
        frame("02-explore")
        device.scroll_to(explore_card)
        listing_label = device.tap(explore_card)
        device.wait(exact_label("Close details"))
        frame("03-property-detail")
        device.tap(exact_label("Save to shortlist"))
        device.wait(exact_label("Remove from shortlist"))
        device.tap(exact_label("Close details"))
        device.tab("Saved")
        device.scroll_to(exact_label(listing_label))
        frame("04-saved")
        device.launch()
        device.tab("Saved")
        device.scroll_to(exact_label(listing_label))
        record["checks"].append("Native shortlist saved the selected listing and persisted after process restart")
        device.tab("HORECA")
        device.scroll_to(explore_card)
        frame("05-horeca-collections")
        category_label = device.tap(explore_card)
        device.wait(lambda n: exact_label(category_label.removeprefix("Explore "))(n) and n.get("selected") == "true")
        device.scroll_to(lambda n: explore_card(n) and text_of(n) != category_label)
        frame("06-horeca-products")
        device.tap(lambda n: explore_card(n) and text_of(n) != category_label)
        device.wait(exact_label("Close details"))
        frame("07-product-detail")
        device.tap(exact_label("Close details"))
        record["checks"].append("HORECA collection opened actual native product cards and product detail")
        device.tab("More")
        frame("08-more")
        device.scroll_to(exact_label("Client workspace, opens secure website"))
        frame("09-client-entry")
        device.scroll_to(exact_label("Staff workspace sign in, opens secure website"))
        device.wait(exact_label("FOR THE INDIA GULLY TEAM"))
        frame("10-separate-staff-entry")
        record["checks"].append("Client and staff entry controls are separately presented; no account or external browser opened")
        device.adb("shell", "svc", "wifi", "disable")
        device.adb("shell", "svc", "data", "disable")
        device.launch()
        device.wait(exact_label("We could not refresh the catalogue. Check your connection and try again."))
        device.tab("Saved")
        device.scroll_to(exact_label(listing_label))
        frame("11-offline-shortlist")
        record["checks"].append("Saved public listing reopened after restart with emulator Wi-Fi and mobile data disabled")
        record["status"] = "passed"
    except Exception as error:
        record["status"] = "failed"
        record["error"] = str(error)
        try:
            frame("failure-current-screen")
        except Exception:
            pass
        raise
    finally:
        device.adb("shell", "svc", "wifi", "enable", check=False)
        device.adb("shell", "svc", "data", "enable", check=False)
        record["completedAt"] = now()
        (args.output / "manifest.json").write_text(json.dumps(record, indent=2) + "\n")
        pid = device.adb("shell", "pidof", PACKAGE, check=False).strip().split()
        if pid and pid[0].isdigit():
            (args.output / "app-logcat.txt").write_text(device.adb("logcat", "-d", f"--pid={pid[0]}", "-t", "600", check=False))
    print(f"Native Android review passed with {len(record['screenshots'])} real screenshots. No app was published.")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    commands = parser.add_subparsers(dest="command", required=True)
    source = commands.add_parser("verify-source")
    source.add_argument("--run-id", required=True)
    source.add_argument("--expected-commit", required=True)
    source.add_argument("--output", required=True, type=Path)
    capture_parser = commands.add_parser("capture")
    capture_parser.add_argument("--apk-directory", required=True, type=Path)
    capture_parser.add_argument("--output", required=True, type=Path)
    args = parser.parse_args()
    verify_source(args) if args.command == "verify-source" else capture(args)


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        print(f"Native Android review failed: {exc}", file=sys.stderr)
        sys.exit(1)

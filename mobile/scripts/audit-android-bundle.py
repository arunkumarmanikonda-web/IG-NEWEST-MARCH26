#!/usr/bin/env python3
"""Audit the final AAB with pinned official bundletool; never handle signing keys.

SDK floors come from the installed React Native manifest used by this Expo build,
not a guessed future Play requirement. This is the current app's release policy,
not a general assertion that every exported Android component is unsafe.
"""
import argparse
import hashlib
import json
from pathlib import Path
import re
import subprocess
import sys
import xml.etree.ElementTree as ET
from zipfile import ZipFile

ANDROID = "{http://schemas.android.com/apk/res/android}"
BUNDLETOOL_VERSION = "1.18.3"
BUNDLETOOL_SHA256 = "a099cfa1543f55593bc2ed16a70a7c67fe54b1747bb7301f37fdfd6d91028e29"
# These ordinary permissions do not expose personal content. Anything else must
# be deliberately reviewed before this public-catalogue app can request it.
NORMAL_PERMISSIONS = {
    "android.permission.INTERNET", "android.permission.ACCESS_NETWORK_STATE",
    "android.permission.ACCESS_WIFI_STATE", "android.permission.WAKE_LOCK",
}
COMPONENT_TYPES = {"activity", "activity-alias", "service", "receiver", "provider"}


class AuditError(ValueError):
    pass


def sha256(path):
    with Path(path).open("rb") as handle:
        return hashlib.file_digest(handle, "sha256").hexdigest()


def parse_xml(text):
    if "<!DOCTYPE" in text.upper() or "<!ENTITY" in text.upper():
        raise AuditError("Manifest must not contain DTD or entity declarations.")
    try:
        root = ET.fromstring(text)
    except ET.ParseError as exc:
        raise AuditError("Manifest is not valid decoded XML.") from exc
    if root.tag != "manifest":
        raise AuditError("Expected an Android manifest root.")
    return root


def positive_integer(value, name):
    if not isinstance(value, str) or not re.fullmatch(r"[0-9]+", value) or int(value) < 1:
        raise AuditError(f"{name} must be an explicit positive integer.")
    return int(value)


def read_sdk_baseline(path):
    sdk = parse_xml(Path(path).read_text()).find("uses-sdk")
    if sdk is None:
        raise AuditError("Installed React Native manifest has no SDK baseline.")
    return {
        "minSdk": positive_integer(sdk.get(ANDROID + "minSdkVersion"), "Baseline min SDK"),
        "targetSdk": positive_integer(sdk.get(ANDROID + "targetSdkVersion"), "Baseline target SDK"),
        "source": "node_modules/react-native/ReactAndroid/src/main/AndroidManifest.xml",
    }


def boolean_attribute(node, name, default):
    value = node.get(ANDROID + name)
    if value is None:
        return default
    if value not in ("true", "false"):
        raise AuditError(f"android:{name} must be a resolved boolean, not {value!r}.")
    return value == "true"


def full_name(name, package):
    if not name or name.startswith("@"):
        raise AuditError("A component has no resolved class name.")
    return package + name if name.startswith(".") else (package + "." + name if "." not in name else name)


def signature_only(level):
    # 'signatureOrSystem' and arbitrary named permissions are not equivalent.
    return level == "signature" or bool(level and re.fullmatch(r"(?:0x0*2|0*2)", level))


def audit_manifest(xml, config, baseline):
    root = parse_xml(xml)
    errors = []
    expected = config.get("android", {})
    package = root.get("package")
    if not package or not re.fullmatch(r"[A-Za-z][A-Za-z0-9_]*(?:\.[A-Za-z][A-Za-z0-9_]*)+", package):
        raise AuditError("Final manifest has no resolved Android package name.")
    version = root.get(ANDROID + "versionName")
    version_code = positive_integer(root.get(ANDROID + "versionCode"), "Version code")
    if expected.get("package") != "com.indiagully.app" or package != expected.get("package"):
        errors.append("Final manifest package does not match India Gully's generated Expo configuration.")
    if version != config.get("version") or version_code != expected.get("versionCode"):
        errors.append("Final manifest version does not match the generated Expo configuration.")
    if root.get(ANDROID + "sharedUserId") is not None:
        errors.append("A shared Android user identity is not permitted.")
    sdk = root.find("uses-sdk")
    if sdk is None:
        raise AuditError("Final manifest has no uses-sdk declaration.")
    minimum = positive_integer(sdk.get(ANDROID + "minSdkVersion"), "Minimum SDK")
    target = positive_integer(sdk.get(ANDROID + "targetSdkVersion"), "Target SDK")
    if minimum < baseline["minSdk"] or target < baseline["targetSdk"] or minimum > target:
        errors.append("Final SDK levels are below the installed React Native baseline or inconsistent.")
    applications = root.findall("application")
    if len(applications) != 1:
        raise AuditError("Expected exactly one application element.")
    app = applications[0]
    flags = {
        "debuggable": boolean_attribute(app, "debuggable", False),
        "testOnly": boolean_attribute(app, "testOnly", False),
        "allowBackup": boolean_attribute(app, "allowBackup", True),
        "usesCleartextTraffic": boolean_attribute(app, "usesCleartextTraffic", target < 28),
        "networkSecurityConfig": app.get(ANDROID + "networkSecurityConfig"),
    }
    for flag in ("debuggable", "testOnly", "allowBackup", "usesCleartextTraffic"):
        if flags[flag]:
            errors.append(f"Unsafe release flag: {flag}=true.")
    if flags["networkSecurityConfig"] is not None:
        errors.append("Network security configuration needs a resource-level audit; cleartext cannot be inferred.")
    declarations = {}
    for node in root.findall("permission"):
        name = node.get(ANDROID + "name")
        if not name or name in declarations:
            errors.append("Missing or duplicate permission declaration; protection cannot be inferred.")
        declarations[name] = node.get(ANDROID + "protectionLevel", "normal")

    def own_signature_permission(name):
        return bool(name and name.startswith((package or "com.indiagully.app") + ".")
                    and signature_only(declarations.get(name)))

    permissions = []
    blocked = set(expected.get("blockedPermissions", []))
    for node in root:
        if node.tag not in ("uses-permission", "uses-permission-sdk-23", "uses-permission-sdk-m"):
            continue
        name = node.get(ANDROID + "name")
        permissions.append({"name": name, "element": node.tag, "maxSdkVersion": node.get(ANDROID + "maxSdkVersion")})
        if name in blocked or (name not in NORMAL_PERMISSIONS and not own_signature_permission(name)):
            errors.append(f"Permission is blocked or not reviewed for this app: {name}.")
    components = []
    activities = {full_name(n.get(ANDROID + "name"), package): n for n in app.findall("activity")}
    for node in app:
        if node.tag not in COMPONENT_TYPES:
            continue
        name = full_name(node.get(ANDROID + "name"), package)
        filters = []
        for intent in node.findall("intent-filter"):
            filters.append({
                "actions": [n.get(ANDROID + "name") for n in intent.findall("action")],
                "categories": [n.get(ANDROID + "name") for n in intent.findall("category")],
                "data": [{k.removeprefix(ANDROID): v for k, v in n.attrib.items()} for n in intent.findall("data")],
            })
        if target >= 31 and filters and node.get(ANDROID + "exported") is None and node.tag != "provider":
            errors.append(f"Missing explicit exported value on filtered component: {name}.")
        default_exported = target < 17 if node.tag == "provider" else bool(filters)
        exported = boolean_attribute(node, "exported", default_exported)
        permission = node.get(ANDROID + "permission", app.get(ANDROID + "permission"))
        target_activity = None
        if node.tag == "activity-alias":
            target_activity = full_name(node.get(ANDROID + "targetActivity"), package)
            original = activities.get(target_activity)
            if original is None:
                errors.append(f"Activity alias targets a missing activity: {name}.")
            elif node.get(ANDROID + "permission") is None:
                permission = original.get(ANDROID + "permission", app.get(ANDROID + "permission"))
        read_permission = node.get(ANDROID + "readPermission", permission) if node.tag == "provider" else None
        write_permission = node.get(ANDROID + "writePermission", permission) if node.tag == "provider" else None
        launcher = node.tag == "activity" and name == package + ".MainActivity" and any(
            "android.intent.action.MAIN" in f["actions"] and "android.intent.category.LAUNCHER" in f["categories"] for f in filters)
        profile_receiver = node.tag == "receiver" and name == "androidx.profileinstaller.ProfileInstallReceiver" and permission == "android.permission.DUMP"
        signature_guard = (own_signature_permission(read_permission) and own_signature_permission(write_permission)
                           if node.tag == "provider" else own_signature_permission(permission))
        # Path permissions can open a provider subpath beyond its top-level guard.
        if exported and node.tag == "provider" and node.findall("path-permission"):
            signature_guard = False
        if exported and not (launcher or profile_receiver or signature_guard):
            errors.append(f"Unapproved exported component: {node.tag} {name}.")
        components.append({"type": node.tag, "name": name, "exported": exported,
                           "exportedExplicit": node.get(ANDROID + "exported"), "permission": permission,
                           "readPermission": read_permission, "writePermission": write_permission,
                           "authorities": node.get(ANDROID + "authorities"), "targetActivity": target_activity,
                           "intentFilters": filters})
    if not any(c["type"] == "activity" and c["name"] == package + ".MainActivity" and c["exported"] for c in components):
        errors.append("The public MainActivity entry is missing or not exported.")
    return {"status": "failed" if errors else "passed", "package": package, "version": version,
            "versionCode": version_code, "minSdk": minimum, "targetSdk": target, "sdkBaseline": baseline,
            "application": flags, "permissions": permissions, "declaredPermissions": declarations,
            "components": components, "errors": errors}


def inspect_bundle(bundle, bundletool):
    if sha256(bundletool) != BUNDLETOOL_SHA256:
        raise AuditError("Official bundletool checksum does not match the pinned release.")
    with ZipFile(bundle) as archive:
        manifests = sorted(n for n in archive.namelist() if n.endswith("/manifest/AndroidManifest.xml"))
    if manifests != ["base/manifest/AndroidManifest.xml"]:
        raise AuditError("Expected the current app's single base module; review every module before changing this audit.")
    command = ["java", "-jar", str(bundletool)]
    for args in (["validate", f"--bundle={bundle}"], ["dump", "manifest", f"--bundle={bundle}", "--module=base"]):
        result = subprocess.run(command + args, capture_output=True, text=True, check=False)
        if result.returncode:
            raise AuditError(f"Official bundletool {args[0]} failed; no release audit was passed.")
    return result.stdout


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--bundle", required=True, type=Path)
    parser.add_argument("--bundletool", required=True, type=Path)
    parser.add_argument("--config", required=True, type=Path)
    parser.add_argument("--release-manifest", required=True, type=Path)
    parser.add_argument("--sdk-baseline", type=Path, default=Path("node_modules/react-native/ReactAndroid/src/main/AndroidManifest.xml"))
    parser.add_argument("--output", required=True, type=Path)
    args = parser.parse_args()
    config = json.loads(args.config.read_text())
    release = json.loads(args.release_manifest.read_text())
    xml = inspect_bundle(args.bundle, args.bundletool)
    report = audit_manifest(xml, config, read_sdk_baseline(args.sdk_baseline))
    report.update({"bundleSha256": sha256(args.bundle), "bundletoolVersion": BUNDLETOOL_VERSION,
                   "bundletoolSha256": BUNDLETOOL_SHA256, "sourceCommit": release.get("sourceCommit")})
    for field in ("package", "version", "versionCode", "bundleSha256"):
        if report[field] != release.get(field):
            report["errors"].append(f"Final AAB {field} disagrees with the signing release record.")
    report["status"] = "failed" if report["errors"] else "passed"
    args.output.mkdir(parents=True, exist_ok=True)
    (args.output / "android-manifest.xml").write_text(xml)
    (args.output / "android-manifest-audit.json").write_text(json.dumps(report, indent=2) + "\n")
    if report["errors"]:
        raise AuditError("\n".join(report["errors"]))
    print(f"Final AAB manifest passed: {report['package']} {report['version']} ({report['versionCode']}), min SDK {report['minSdk']}, target SDK {report['targetSdk']}.")


if __name__ == "__main__":
    try:
        main()
    except (AuditError, OSError, ValueError) as exc:
        print(f"Android manifest audit failed: {exc}", file=sys.stderr)
        sys.exit(1)

#!/usr/bin/env python3
"""One-time upload-key provisioning. Defaults to read-only preflight.

Only --create generates a key. --repair can repair the public certificate pin.
Both modes write GitHub and require an already authenticated
GitHub CLI; this script does not log in, create tokens, or change access rules.
Never run with shell/HTTP tracing enabled. Do not run competing initializations.
"""
from __future__ import annotations

import argparse
import base64
import hashlib
import json
import os
from pathlib import Path
import secrets
import shutil
import signal
import subprocess
import sys
import tempfile

REPOSITORY = "arunkumarmanikonda-web/IG-NEWEST-MARCH26"
OWNER = REPOSITORY.split("/")[0]
ENVIRONMENT = "android-production"
KEY_ALIAS = "indiagully-upload"
SECRET_NAMES = (
    "ANDROID_UPLOAD_KEYSTORE_BASE64",
    "ANDROID_UPLOAD_STORE_PASSWORD",
    "ANDROID_UPLOAD_KEY_ALIAS",
    "ANDROID_UPLOAD_KEY_PASSWORD",
)
BUNDLE_NAME = "ANDROID_UPLOAD_SIGNING_BUNDLE"
FINGERPRINT_NAME = "ANDROID_UPLOAD_CERTIFICATE_SHA256"
BASE = f"repos/{REPOSITORY}/environments/{ENVIRONMENT}"
REPO_ROOT = Path(__file__).resolve().parents[2]
DISTINGUISHED_NAME = (
    "CN=India Gully Android Upload, OU=Mobile Release, "
    "O=VIVACIOUS ENTERTAINMENT AND HOSPITALITY PRIVATE LIMITED, "
    "L=New Delhi, ST=Delhi, C=IN"
)


class ProvisioningError(Exception):
    """A safe diagnostic containing no command output or secret value."""


def command(args: list[str], *, data: bytes | None = None,
            env: dict[str, str] | None = None) -> bytes:
    # Never echo a subprocess exception, stdout, stderr, environment, or stdin.
    # gh may log request bodies with GH_DEBUG=api, so strip tracing explicitly.
    child_env = dict(os.environ if env is None else env)
    for name in ("GH_DEBUG", "DEBUG", "GIT_TRACE", "GIT_CURL_VERBOSE"):
        child_env.pop(name, None)
    child_env.update(GH_HOST="github.com", GH_PROMPT_DISABLED="1", GH_PAGER="cat")
    try:
        result = subprocess.run(args, input=data, stdout=subprocess.PIPE,
                                stderr=subprocess.PIPE, env=child_env, timeout=120,
                                check=False)
    except (OSError, subprocess.TimeoutExpired):
        raise ProvisioningError(f"{args[0]} could not complete; credentials were not printed.") from None
    if result.returncode != 0:
        raise ProvisioningError(f"{args[0]} failed (exit {result.returncode}); credentials were not printed.")
    return result.stdout


def api(endpoint: str) -> dict:
    raw = command(["gh", "api", "--hostname", "github.com", "--method", "GET",
                   "-H", "Accept: application/vnd.github+json", endpoint])
    try:
        result = json.loads(raw)
    except (ValueError, UnicodeError):
        raise ProvisioningError("GitHub returned an invalid response.") from None
    if not isinstance(result, dict):
        raise ProvisioningError("GitHub returned an unexpected response shape.")
    return result


def rows(response: dict, field: str) -> list[dict]:
    result = response.get(field)
    if (not isinstance(result, list)
            or response.get("total_count") != len(result)
            or any(not isinstance(row, dict) for row in result)):
        raise ProvisioningError("Incomplete GitHub inventory; refusing to overlook existing settings.")
    return result


def validate_protection(environment: dict, branches: dict) -> None:
    if environment.get("name") != ENVIRONMENT:
        raise ProvisioningError("The configured environment is not android-production.")
    policy = environment.get("deployment_branch_policy") or {}
    if policy.get("custom_branch_policies") is not True or policy.get("protected_branches") is not False:
        raise ProvisioningError("android-production must use selected deployment branches.")
    rules = rows(branches, "branch_policies")
    if len(rules) != 1 or rules[0].get("name") != "main" or rules[0].get("type") != "branch":
        raise ProvisioningError("android-production must allow exactly the main branch and no tags.")
    reviewers = [rule for rule in environment.get("protection_rules", [])
                 if rule.get("type") == "required_reviewers"]
    if len(reviewers) != 1:
        raise ProvisioningError("android-production must require the owner's review.")
    allowed = reviewers[0].get("reviewers", [])
    if (len(allowed) != 1 or allowed[0].get("type") != "User"
            or allowed[0].get("reviewer", {}).get("login", "").lower() != OWNER.lower()):
        raise ProvisioningError("android-production's sole required reviewer must be the repository owner.")
    if environment.get("can_admins_bypass") is not False:
        raise ProvisioningError("Administrator bypass must be disabled and verifiable before provisioning.")


def inventory() -> tuple[set[str], dict[str, str]]:
    secret_rows = rows(api(f"{BASE}/secrets?per_page=100"), "secrets")
    variable_rows = rows(api(f"{BASE}/variables?per_page=100"), "variables")
    return ({item["name"] for item in secret_rows},
            {item["name"]: item.get("value", "") for item in variable_rows})


def require_uninitialized(secret_names: set[str], variables: dict[str, str]) -> None:
    if (set(SECRET_NAMES) | {BUNDLE_NAME}).intersection(secret_names) or FINGERPRINT_NAME in variables:
        raise ProvisioningError(
            "Signing configuration already exists or is partially initialized. "
            "Refusing to replace it; reconcile the retained original key manually.")


def preflight(*, repair: bool = False) -> None:
    for executable in ("gh", "keytool"):
        if not shutil.which(executable):
            raise ProvisioningError(f"Required executable is missing: {executable}.")
    if api("user").get("login", "").lower() != OWNER.lower():
        raise ProvisioningError("Authenticate gh as the approved repository owner before continuing.")
    repo = api(f"repos/{REPOSITORY}")
    if repo.get("full_name", "").lower() != REPOSITORY.lower() or repo.get("permissions", {}).get("admin") is not True:
        raise ProvisioningError("The authenticated owner must have admin access to the exact approved repository.")
    validate_protection(api(BASE), api(f"{BASE}/deployment-branch-policies?per_page=100"))
    current_secrets, current_variables = inventory()
    if repair:
        if BUNDLE_NAME not in current_secrets or set(SECRET_NAMES).intersection(current_secrets):
            raise ProvisioningError("Repair requires the existing atomic bundle and no legacy signing secrets.")
    else:
        require_uninitialized(current_secrets, current_variables)
    api(f"{BASE}/secrets/public-key")


def private_write(path: Path, data: bytes) -> None:
    descriptor = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(descriptor, "wb") as target:
        target.write(data)
        target.flush()
        os.fsync(target.fileno())


def create_material(directory: Path) -> tuple[dict[str, str], str]:
    password = secrets.token_urlsafe(48)
    key_path = directory / "india-gully-upload.p12"
    recovery = {
        "repository": REPOSITORY, "environment": ENVIRONMENT, "alias": KEY_ALIAS,
        "keystore": key_path.name, "store_password": password, "key_password": password,
        "warning": "Private recovery material. Never upload to Git or build artifacts.",
    }
    private_write(directory / "recovery.json", (json.dumps(recovery) + "\n").encode())
    child_env = dict(os.environ, IG_UPLOAD_STORE_PASSWORD=password)
    command(["keytool", "-genkeypair", "-noprompt", "-storetype", "PKCS12",
             "-keystore", str(key_path), "-alias", KEY_ALIAS,
             "-keyalg", "RSA", "-keysize", "4096", "-sigalg", "SHA256withRSA",
             "-validity", "10000", "-dname", DISTINGUISHED_NAME,
             "-storepass:env", "IG_UPLOAD_STORE_PASSWORD",
             "-keypass:env", "IG_UPLOAD_STORE_PASSWORD"], env=child_env)
    os.chmod(key_path, 0o600)
    certificate = command(["keytool", "-exportcert", "-keystore", str(key_path),
                           "-alias", KEY_ALIAS, "-storepass:env", "IG_UPLOAD_STORE_PASSWORD"], env=child_env)
    if not certificate or len(certificate) < 256:
        raise ProvisioningError("The generated upload certificate could not be verified.")
    fingerprint = hashlib.sha256(certificate).hexdigest().upper()
    private_write(directory / "upload-certificate.der", certificate)
    return {
        "ANDROID_UPLOAD_KEYSTORE_BASE64": base64.b64encode(key_path.read_bytes()).decode("ascii"),
        "ANDROID_UPLOAD_STORE_PASSWORD": password,
        "ANDROID_UPLOAD_KEY_ALIAS": KEY_ALIAS,
        "ANDROID_UPLOAD_KEY_PASSWORD": password,
    }, fingerprint


def encode_bundle(material: dict[str, str], fingerprint: str) -> str:
    return json.dumps({"schemaVersion": 1, **material,
                       FINGERPRINT_NAME: fingerprint}, separators=(",", ":"))


def decode_bundle(value: str) -> tuple[dict[str, str], str]:
    try:
        bundle = json.loads(value)
    except (ValueError, TypeError):
        raise ProvisioningError("The existing signing bundle is invalid JSON.") from None
    if (not isinstance(bundle, dict) or bundle.get("schemaVersion") != 1
            or any(not isinstance(bundle.get(name), str) or not bundle[name] for name in SECRET_NAMES)
            or bundle.get("ANDROID_UPLOAD_KEY_ALIAS") != KEY_ALIAS
            or bundle.get("ANDROID_UPLOAD_STORE_PASSWORD") != bundle.get("ANDROID_UPLOAD_KEY_PASSWORD")):
        raise ProvisioningError("The existing signing bundle has an invalid schema or identity.")
    fingerprint = bundle.get(FINGERPRINT_NAME)
    if not isinstance(fingerprint, str) or len(fingerprint) != 64 or any(c not in "0123456789ABCDEF" for c in fingerprint):
        raise ProvisioningError("The existing bundle certificate fingerprint is invalid.")
    try:
        keystore = base64.b64decode(bundle["ANDROID_UPLOAD_KEYSTORE_BASE64"], validate=True)
    except ValueError:
        raise ProvisioningError("The existing signing bundle has invalid keystore encoding.") from None
    if len(keystore) < 100:
        raise ProvisioningError("The existing signing bundle has no valid keystore.")
    return {name: bundle[name] for name in SECRET_NAMES}, fingerprint


def set_pin(fingerprint: str) -> None:
    _, variables = inventory()
    existing = variables.get(FINGERPRINT_NAME)
    if existing is not None:
        if existing != fingerprint:
            raise ProvisioningError("Existing certificate pin differs; refusing to replace it.")
        return
    command(["gh", "variable", "set", FINGERPRINT_NAME, "--env", ENVIRONMENT,
             "--repo", f"github.com/{REPOSITORY}"], data=fingerprint.encode("ascii"))
    if inventory()[1].get(FINGERPRINT_NAME) != fingerprint:
        raise ProvisioningError("GitHub did not confirm the public certificate pin. Use repair with the saved bundle.")


def store_material(material: dict[str, str], fingerprint: str) -> None:
    # GitHub has no conditional create-only secret operation. The hosted setup
    # and release workflows share a concurrency group; never initialize elsewhere
    # concurrently. One encrypted value contains every credential and its pin.
    require_uninitialized(*inventory())
    command(["gh", "secret", "set", BUNDLE_NAME, "--env", ENVIRONMENT,
             "--repo", f"github.com/{REPOSITORY}"], data=encode_bundle(material, fingerprint).encode("utf-8"))
    if BUNDLE_NAME not in inventory()[0]:
        raise ProvisioningError("GitHub did not confirm the signing bundle; inspect the environment before retrying.")
    # Once this atomic write succeeds, the key and passwords are durable even if
    # a later pin write or workflow step fails. --repair never creates a new key.
    set_pin(fingerprint)


def repair_pin(directory: Path) -> str:
    material, fingerprint = decode_bundle(os.environ.get(BUNDLE_NAME, ""))
    key_path = directory / "india-gully-upload.p12"
    private_write(key_path, base64.b64decode(material["ANDROID_UPLOAD_KEYSTORE_BASE64"], validate=True))
    child_env = dict(os.environ, IG_UPLOAD_STORE_PASSWORD=material["ANDROID_UPLOAD_STORE_PASSWORD"])
    certificate = command(["keytool", "-exportcert", "-keystore", str(key_path),
                           "-alias", KEY_ALIAS, "-storepass:env", "IG_UPLOAD_STORE_PASSWORD"], env=child_env)
    if hashlib.sha256(certificate).hexdigest().upper() != fingerprint:
        raise ProvisioningError("Existing bundle certificate does not match its recorded fingerprint.")
    set_pin(fingerprint)
    return fingerprint


def provision(create: bool = False, repair: bool = False) -> str | None:
    preflight(repair=repair)
    if not create and not repair:
        print("Read-only preflight passed: approved owner, repository, protected environment and empty signing slots.")
        return None
    old_umask = os.umask(0o077)
    directory: Path | None = None
    success = False
    try:
        directory = Path(tempfile.mkdtemp(prefix="india-gully-upload-key-", dir="/tmp")).resolve()
        os.chmod(directory, 0o700)
        if directory == REPO_ROOT or REPO_ROOT in directory.parents:
            raise ProvisioningError("Private material must be created outside the repository.")
        if repair:
            fingerprint = repair_pin(directory)
        else:
            material, fingerprint = create_material(directory)
            store_material(material, fingerprint)
        success = True
        print("Atomic encrypted signing bundle and public certificate pin are configured." if create else "Existing upload key verified; public certificate pin is configured.")
        print(f"Upload certificate SHA-256: {fingerprint}")
        return fingerprint
    finally:
        os.umask(old_umask)
        if directory is not None:
            if success or repair or not (directory / "india-gully-upload.p12").exists():
                shutil.rmtree(directory)
            else:
                print(f"Provisioning incomplete. Protected recovery material retained at: {directory}", file=sys.stderr)
                print("If the atomic bundle exists, run repair; never overwrite it with a newly generated key.", file=sys.stderr)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    mode = parser.add_mutually_exclusive_group()
    mode.add_argument("--create", action="store_true", help="Generate the first upload key and store one atomic encrypted bundle in GitHub.")
    mode.add_argument("--repair", action="store_true", help="Verify the existing injected bundle and add its missing public pin; never generate or replace a key.")
    mode.add_argument("--dry-run", action="store_true", help="Read-only checks only (the default).")
    args = parser.parse_args()
    try:
        provision(create=args.create, repair=args.repair)
    except (ProvisioningError, KeyboardInterrupt) as error:
        print(str(error) if isinstance(error, ProvisioningError) else "Provisioning interrupted.", file=sys.stderr)
        return 1
    except Exception:
        # Do not include raw exception text: values may be included by libraries.
        print("Provisioning failed unexpectedly; no credentials were printed.", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    signal.signal(signal.SIGTERM, lambda _number, _frame: (_ for _ in ()).throw(KeyboardInterrupt()))
    sys.exit(main())

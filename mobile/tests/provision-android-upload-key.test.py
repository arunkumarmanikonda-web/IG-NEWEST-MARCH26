"""Safety checks; all subprocess/network operations and key generation are mocked."""
import base64
import hashlib
import os
import contextlib
import copy
import importlib.util
import io
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

MODULE = Path(__file__).resolve().parents[1] / "scripts/provision-android-upload-key.py"
spec = importlib.util.spec_from_file_location("provision_upload_key", MODULE)
provisioner = importlib.util.module_from_spec(spec)
spec.loader.exec_module(provisioner)


def protected_environment():
    return {
        "name": provisioner.ENVIRONMENT,
        "can_admins_bypass": False,
        "deployment_branch_policy": {"custom_branch_policies": True, "protected_branches": False},
        "protection_rules": [{"type": "required_reviewers", "reviewers": [
            {"type": "User", "reviewer": {"login": provisioner.OWNER}}
        ]}],
    }


def main_branch():
    return {"total_count": 1, "branch_policies": [{"name": "main", "type": "branch"}]}


class ProvisioningSafetyTests(unittest.TestCase):
    def test_existing_partial_or_complete_configuration_is_never_overwritten(self):
        provisioner.require_uninitialized(set(), {})
        for secret in (*provisioner.SECRET_NAMES, provisioner.BUNDLE_NAME):
            with self.assertRaises(provisioner.ProvisioningError):
                provisioner.require_uninitialized({secret}, {})
        with self.assertRaises(provisioner.ProvisioningError):
            provisioner.require_uninitialized(set(), {provisioner.FINGERPRINT_NAME: ""})
        with patch.object(provisioner, "inventory", return_value=({provisioner.SECRET_NAMES[0]}, {})), \
             patch.object(provisioner, "command") as command:
            with self.assertRaises(provisioner.ProvisioningError):
                provisioner.store_material({}, "A" * 64)
            command.assert_not_called()

    def test_unprotected_or_different_environment_fails_closed(self):
        provisioner.validate_protection(protected_environment(), main_branch())
        for key, value in (("name", "other"), ("can_admins_bypass", True),
                           ("can_admins_bypass", None), ("protection_rules", [])):
            environment = protected_environment()
            environment[key] = value
            with self.assertRaises(provisioner.ProvisioningError):
                provisioner.validate_protection(environment, main_branch())
        for name, branch_type in (("*", "branch"), ("main", "tag"), ("main", None)):
            branches = main_branch()
            branches["branch_policies"][0].update(name=name, type=branch_type)
            with self.assertRaises(provisioner.ProvisioningError):
                provisioner.validate_protection(protected_environment(), branches)
        with self.assertRaises(provisioner.ProvisioningError):
            provisioner.rows({"total_count": 2, "secrets": [{"name": "x"}]}, "secrets")

    def test_dry_run_cannot_generate_or_store_material(self):
        with patch.object(provisioner, "preflight"), \
             patch.object(provisioner, "create_material") as generate, \
             patch.object(provisioner, "store_material") as store, \
             patch.object(provisioner.tempfile, "mkdtemp") as create_directory, \
             contextlib.redirect_stdout(io.StringIO()):
            provisioner.provision()
            generate.assert_not_called()
            store.assert_not_called()
            create_directory.assert_not_called()

    def test_atomic_secret_uses_stdin_and_errors_never_echo_output(self):
        material = {name: f"unreal-test-value-{index}" for index, name in enumerate(provisioner.SECRET_NAMES)}
        fingerprint = "A" * 64
        inventory = [(set(), {}), ({provisioner.BUNDLE_NAME}, {}), ({provisioner.BUNDLE_NAME}, {}),
                     ({provisioner.BUNDLE_NAME}, {provisioner.FINGERPRINT_NAME: fingerprint})]
        with patch.object(provisioner, "inventory", side_effect=inventory), \
             patch.object(provisioner, "command") as command:
            provisioner.store_material(material, fingerprint)
            self.assertEqual(command.call_count, 2)
            secret_call = command.call_args_list[0]
            self.assertIn(provisioner.BUNDLE_NAME, secret_call.args[0])
            self.assertEqual(secret_call.kwargs["data"], provisioner.encode_bundle(material, fingerprint).encode())
            for value in material.values():
                self.assertNotIn(value, secret_call.args[0])
        failed = type("Result", (), {"returncode": 1, "stdout": b"PRIVATE", "stderr": b"PRIVATE"})()
        with patch.object(provisioner.subprocess, "run", return_value=failed):
            with self.assertRaises(provisioner.ProvisioningError) as caught:
                provisioner.command(["gh", "secret", "set", "TEST"], data=b"PRIVATE")
            self.assertNotIn("PRIVATE", str(caught.exception))

    def test_repair_never_replaces_a_key_or_conflicting_pin(self):
        certificate = b"fake-public-certificate-for-mocked-test"
        fingerprint = hashlib.sha256(certificate).hexdigest().upper()
        material = {
            "ANDROID_UPLOAD_KEYSTORE_BASE64": base64.b64encode(b"fake" * 100).decode(),
            "ANDROID_UPLOAD_STORE_PASSWORD": "fake-password",
            "ANDROID_UPLOAD_KEY_PASSWORD": "fake-password",
            "ANDROID_UPLOAD_KEY_ALIAS": provisioner.KEY_ALIAS,
        }
        with tempfile.TemporaryDirectory() as directory, \
             patch.dict(os.environ, {provisioner.BUNDLE_NAME: provisioner.encode_bundle(material, fingerprint)}), \
             patch.object(provisioner, "command", return_value=certificate) as command, \
             patch.object(provisioner, "set_pin") as set_pin:
            self.assertEqual(provisioner.repair_pin(Path(directory)), fingerprint)
            self.assertEqual(command.call_count, 1)
            self.assertIn("-exportcert", command.call_args.args[0])
            self.assertNotIn("-genkeypair", command.call_args.args[0])
            set_pin.assert_called_once_with(fingerprint)
        with patch.object(provisioner, "inventory", return_value=({provisioner.BUNDLE_NAME}, {provisioner.FINGERPRINT_NAME: "B" * 64})), \
             patch.object(provisioner, "command") as command:
            with self.assertRaises(provisioner.ProvisioningError):
                provisioner.set_pin(fingerprint)
            command.assert_not_called()
        with self.assertRaises(provisioner.ProvisioningError) as caught:
            provisioner.decode_bundle("PRIVATE_BAD_JSON")
        self.assertNotIn("PRIVATE_BAD_JSON", str(caught.exception))

    def test_partial_failure_retains_private_recovery_and_success_cleans_up(self):
        for fail in (True, False):
            with tempfile.TemporaryDirectory() as parent:
                keydir = Path(parent) / "private"
                keydir.mkdir(mode=0o700)
                def fake_material(directory):
                    provisioner.private_write(directory / "india-gully-upload.p12", b"fake-encrypted-test-material")
                    provisioner.private_write(directory / "recovery.json", b"fake-test-recovery")
                    return {}, "A" * 64
                output = io.StringIO()
                with patch.object(provisioner, "preflight"), \
                     patch.object(provisioner.tempfile, "mkdtemp", return_value=str(keydir)), \
                     patch.object(provisioner, "create_material", side_effect=fake_material), \
                     patch.object(provisioner, "store_material", side_effect=provisioner.ProvisioningError("failure") if fail else None), \
                     contextlib.redirect_stdout(output), contextlib.redirect_stderr(output):
                    if fail:
                        with self.assertRaises(provisioner.ProvisioningError):
                            provisioner.provision(create=True)
                    else:
                        provisioner.provision(create=True)
                self.assertEqual(keydir.exists(), fail)
                if fail:
                    self.assertEqual(keydir.stat().st_mode & 0o777, 0o700)
                    self.assertEqual((keydir / "recovery.json").stat().st_mode & 0o777, 0o600)
                self.assertNotIn("fake-test-recovery", output.getvalue())


if __name__ == "__main__":
    unittest.main()

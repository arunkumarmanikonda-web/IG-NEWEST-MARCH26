"""No real authentication or network calls are made by these safety tests."""
import contextlib
import importlib.util
import io
import os
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

MODULE = Path(__file__).resolve().parents[1] / "scripts/github-key-setup-auth.py"
spec = importlib.util.spec_from_file_location("key_setup_auth", MODULE)
auth = importlib.util.module_from_spec(spec)
spec.loader.exec_module(auth)


def result(code=0, output=b"--no-revoke"):
    return type("Result", (), {"returncode": code, "stdout": output, "stderr": b"PRIVATE_TEST_TOKEN"})()


class AuthSafetyTests(unittest.TestCase):
    def test_existing_or_unprotected_session_is_rejected(self):
        with patch.dict(os.environ, {"GH_CONFIG_DIR": "/tmp/not-authorized"}):
            with self.assertRaises(RuntimeError):
                auth.environment()
        with tempfile.TemporaryDirectory() as directory:
            (Path(directory) / "hosts.yml").write_text("fake-test-session")
            with patch.object(auth, "environment", return_value=({}, Path(directory))), \
                 patch.object(auth, "quiet", return_value=result()), \
                 patch.object(auth.subprocess, "Popen") as process:
                with self.assertRaises(RuntimeError):
                    auth.login()
                process.assert_not_called()

    def test_only_device_pairing_code_is_selected_from_raw_output(self):
        raw = "untrusted auth log PRIVATE_TEST_TOKEN\n! First copy your one-time code: ABCD-EFGH\nsecret-token=OTHER_PRIVATE"
        self.assertEqual(auth.pairing_code(raw), "ABCD-EFGH")
        self.assertIsNone(auth.pairing_code("token=PRIVATE_TEST_TOKEN"))
        self.assertIsNone(auth.pairing_code("one-time code: not-a-valid-code"))

    def test_cli_must_support_default_revocation(self):
        with patch.object(auth, "quiet", return_value=result(output=b"old-help")):
            with self.assertRaises(RuntimeError):
                auth.require_revoking_cli({})
        with tempfile.TemporaryDirectory() as directory, \
             patch.object(auth, "environment", return_value=({}, Path(directory))), \
             patch.object(auth, "quiet", return_value=result(output=b"old-help")), \
             patch.object(auth.subprocess, "Popen") as process:
            with self.assertRaises(RuntimeError):
                auth.login()
            process.assert_not_called()

    def test_auth_environment_cannot_reuse_ambient_credentials(self):
        with tempfile.TemporaryDirectory(prefix="india-gully-key-setup-test-", dir="/dev/shm") as directory:
            with patch.dict(os.environ, {"GH_CONFIG_DIR": directory, "GH_TOKEN": "FAKE", "GITHUB_TOKEN": "FAKE", "GH_DEBUG": "api"}):
                env, path = auth.environment()
                self.assertNotIn("GH_TOKEN", env)
                self.assertNotIn("GITHUB_TOKEN", env)
                self.assertNotIn("GH_DEBUG", env)
                self.assertEqual(path, Path(directory))
            os.chmod(directory, 0o755)
            with patch.dict(os.environ, {"GH_CONFIG_DIR": directory}):
                with self.assertRaises(RuntimeError):
                    auth.environment()

    def test_new_authorization_is_confined_to_private_ram_storage(self):
        with tempfile.TemporaryDirectory() as directory, \
             patch.object(auth, "environment", return_value=({}, Path(directory))), \
             patch.object(auth, "quiet", side_effect=[result(), result(output=b"--expiring")]), \
             patch.object(auth.subprocess, "Popen", side_effect=RuntimeError("fixture stop")) as process:
            with self.assertRaises(RuntimeError):
                auth.login()
            self.assertIn("--insecure-storage", process.call_args.args[0])
            self.assertIn("--expiring", process.call_args.args[0])

    def test_logout_revokes_only_isolated_session_and_does_not_suppress_failure(self):
        for failed in (False, True):
            with tempfile.TemporaryDirectory() as directory:
                private = Path(directory) / "session"
                private.mkdir()
                (private / "hosts.yml").write_text("fake-test-session")
                with patch.object(auth, "environment", return_value=({}, private)), \
                     patch.object(auth, "quiet", side_effect=[result(), result(1 if failed else 0)]) as command, \
                     contextlib.redirect_stdout(io.StringIO()) as output:
                    if failed:
                        with self.assertRaises(RuntimeError):
                            auth.logout()
                    else:
                        auth.logout()
                self.assertEqual(command.call_args_list[1].args[0], ["gh", "auth", "logout", "--hostname", "github.com"])
                self.assertEqual(private.exists(), failed)
                self.assertNotIn("PRIVATE_TEST_TOKEN", output.getvalue())


if __name__ == "__main__":
    unittest.main()

#!/usr/bin/env python3
"""Short-lived official gh device authorization for the protected setup job.

Never print OAuth credentials or raw CLI output. Only the GitHub device pairing
code and fixed verification URL are emitted. Logout revokes this job's token.
"""
import argparse
import os
from pathlib import Path
import re
import selectors
import shutil
import signal
import subprocess
import sys
import time

OWNER = "arunkumarmanikonda-web"


def environment():
    result = dict(os.environ)
    for name in ("GH_TOKEN", "GITHUB_TOKEN", "GH_DEBUG", "DEBUG", "GIT_TRACE", "GIT_CURL_VERBOSE", "GH_PROMPT_DISABLED"):
        result.pop(name, None)
    result.update(GH_HOST="github.com", GH_BROWSER="true", GH_PAGER="cat")
    directory = Path(result.get("GH_CONFIG_DIR", "")).resolve()
    if (directory.parent != Path("/dev/shm") or not directory.name.startswith("india-gully-key-setup-")
            or not directory.is_dir() or directory.stat().st_mode & 0o077):
        raise RuntimeError("GH_CONFIG_DIR must be the job's private0700 directory in /dev/shm.")
    return result, directory


def quiet(args, env):
    return subprocess.run(args, env=env, stdin=subprocess.DEVNULL, stdout=subprocess.PIPE,
                          stderr=subprocess.PIPE, check=False, timeout=60)


def require_revoking_cli(env):
    help_result = quiet(["gh", "auth", "logout", "--help"], env)
    if help_result.returncode or b"--no-revoke" not in help_result.stdout:
        raise RuntimeError("This GitHub CLI does not expose default token revocation; authentication was not started.")


def pairing_code(output):
    match = re.search(r"one-time code:\s*([A-Z0-9]{4}-[A-Z0-9]{4})", output)
    return match.group(1) if match else None


def login():
    env, directory = environment()
    require_revoking_cli(env)
    if (directory / "hosts.yml").exists():
        raise RuntimeError("Refusing to overwrite an existing CLI session.")
    help_result = quiet(["gh", "auth", "login", "--help"], env)
    if help_result.returncode or b"--expiring" not in help_result.stdout:
        raise RuntimeError("This GitHub CLI does not support expiring credentials.")
    # Keep this isolated session exclusively in private RAM-backed storage,
    # never in a shared OS keyring; it is revoked and removed in cleanup.
    args = ["gh", "auth", "login", "--hostname", "github.com", "--web", "--expiring", "--insecure-storage",
            "--git-protocol", "https", "--skip-ssh-key"]
    (directory / "auth-attempted").touch(mode=0o600, exist_ok=False)
    process = subprocess.Popen(args, env=env, stdin=subprocess.PIPE, stdout=subprocess.PIPE,
                               stderr=subprocess.STDOUT, bufsize=0)
    try:
        process.stdin.write(b"\n")
        process.stdin.close()
        selector = selectors.DefaultSelector()
        selector.register(process.stdout, selectors.EVENT_READ)
        output = ""
        pairing_printed = False
        deadline = time.monotonic() + 480
        print("Waiting for the owner to authorize GitHub CLI for this one-time protected key setup.", flush=True)
        while time.monotonic() < deadline:
            for key, _ in selector.select(timeout=0.5):
                chunk = os.read(key.fileobj.fileno(), 4096)
                if chunk:
                    output = (output + chunk.decode("utf-8", errors="replace"))[-65536:]
                    code = pairing_code(output)
                    if code and not pairing_printed:
                        print(f"GitHub pairing code: {code}", flush=True)
                        print("Authorize only at https://github.com/login/device using the repository owner's account.", flush=True)
                        pairing_printed = True
            if process.poll() is not None:
                break
        if process.poll() is None:
            raise RuntimeError("Owner authorization timed out; start a new protected setup run if needed.")
        if process.returncode:
            raise RuntimeError("GitHub CLI authorization did not finish. Raw authentication output was suppressed.")
        identity = quiet(["gh", "api", "--hostname", "github.com", "user", "--jq", ".login"], env)
        if identity.returncode or identity.stdout.decode().strip().lower() != OWNER.lower():
            raise RuntimeError("The authorized account is not the approved repository owner; no key may be generated.")
        print("Owner authorization verified. No OAuth credential was printed.", flush=True)
    finally:
        if process.poll() is None:
            process.terminate()
            try:
                process.wait(timeout=10)
            except subprocess.TimeoutExpired:
                process.kill()
                process.wait()


def logout():
    env, directory = environment()
    require_revoking_cli(env)
    if not (directory / "hosts.yml").exists():
        if (directory / "auth-attempted").exists():
            raise RuntimeError("No local OAuth credential is available for revocation. If browser authorization completed, revoke this GitHub CLI authorization in account settings.")
        print("No GitHub CLI authentication was started by this job.")
        shutil.rmtree(directory)
        return
    # This new, isolated directory belongs only to this run; never target any
    # user/global CLI session. No --no-revoke: current pinned gh revokes by default.
    result = quiet(["gh", "auth", "logout", "--hostname", "github.com"], env)
    if result.returncode:
        raise RuntimeError("GitHub CLI token revocation could not be confirmed. Revoke this authorization in GitHub account settings; this runner's local credentials will be destroyed.")
    shutil.rmtree(directory)
    print("This setup job's GitHub CLI OAuth authorization was revoked and local credentials removed.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("mode", choices=("login", "logout"))
    args = parser.parse_args()
    signal.signal(signal.SIGTERM, lambda _number, _frame: (_ for _ in ()).throw(KeyboardInterrupt()))
    try:
        (login if args.mode == "login" else logout)()
    except (Exception, KeyboardInterrupt) as error:
        # Only our fixed RuntimeError diagnostics are safe to report.
        print(str(error) if type(error) is RuntimeError else "Authentication cleanup failed without exposing credentials.", file=sys.stderr)
        sys.exit(1)

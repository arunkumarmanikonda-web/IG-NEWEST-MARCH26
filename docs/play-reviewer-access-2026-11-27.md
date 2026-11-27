# Store reviewer access: remaining work

A client-only reviewer can use the existing password flow with a dedicated verified account and synthetic, explicitly granted data room. This does not cover staff functionality.

Production staff review is blocked: staff permissions are practice-wide, not assigned-project scoped; arbitrary review practices are rejected. Administrator and auditor roles also expose global records. Separately, staff access requires TOTP or email OTP. Google's current sign-in requirements call for reusable credentials bypassing these challenges; supplying a TOTP seed is not a confirmed compliant solution.

Do not grant production staff access or add an authentication exception. Keep production submission pending until a genuinely isolated, synthetic staff review environment and reusable access are verified. A client-only login plus “staff unavailable” instructions cannot be represented as full review access.

The independently discovered client-directory disclosure was corrected in production on 27 November 2026 using `client_directory_scope`. The function now applies the existing per-client read permission. The complete 38-script local database workflow suite passed, including 19 directory assertions and a regression check that fails against the prior implementation. Production verification confirmed the scope filter and retained authenticated-only RPC grants. This does not establish full demo isolation or a general security audit.


# India Gully Portal — Master Credentials Reference
> **Last verified:** 22 March 2026  
> **Source:** Cryptographically confirmed via PBKDF2-SHA256 hash matching across all git commits  
> **DO NOT COMMIT real production secrets here — these are platform dev/staging credentials**

---

## Super Admin (Platform Owner)
| Field | Value |
|-------|-------|
| **URL** | https://india-gully.pages.dev/admin |
| **Email** | `superadmin@indiagully.com` |
| **Password** | `IGAdmin@Test2026!` |
| **TOTP Key** | `CG5LSHWCQHZL7TV7CQE6Z3DJIAO2MMBZ` |
| **TOTP Label** | India Gully Admin |
| **PBKDF2 Hash** | `0710e299d5de37a3aab1ac14b07b0ba9897d6050f2d8d6c081b5f0939e9b7e4e` |
| **Salt** | `ig-salt-admin-v3-2026` |

---

## Demo Client Portal
| Field | Value |
|-------|-------|
| **URL** | https://india-gully.pages.dev/portal/client |
| **Email** | `demo@indiagully.com` |
| **Password** | `IGClient@Test2026!` |
| **TOTP Key** | `VCPFNOW2QGBUBUTF2MCQXFCLVCPPOXJU` |

---

## Demo Employee Portal
| Field | Value |
|-------|-------|
| **URL** | https://india-gully.pages.dev/portal/employee |
| **ID** | `IG-EMP-0001` |
| **Password** | `IGEmployee@Test2026!` |
| **TOTP Key** | `B3S56WWK5R6NSEDML5ARXTDXCVRUXZ67` |

---

## Demo Board/KMP Portal
| Field | Value |
|-------|-------|
| **URL** | https://india-gully.pages.dev/portal/board |
| **ID** | `IG-KMP-0001` |
| **Password** | `IGBoard@Test2026!` |
| **TOTP Key** | `FMWCS4OPGN73MK3LFQOCZYFLW555NAWN` |

---

## QA Account (No TOTP required)
| Field | Value |
|-------|-------|
| **URL** | https://india-gully.pages.dev/portal/client |
| **Email** | `qa@indiagully.com` |
| **Password** | `IGQa@Test2026!` |
| **TOTP** | Not required (mfa_required = false) |

---

## Real User Accounts (from migration 0017)
| Email | Role | Password | TOTP |
|-------|------|----------|------|
| `akm@indiagully.com` | Board/MD | See 0017 migration | `4Q54XPCBOQVYNMT2PG2ONFEF2GPVECRU` |
| `pavan@indiagully.com` | Board/ED | See 0017 migration | `3IC6XPOQAV4BU5JQVXGS766S2QVXKGDO` |
| `amit.jhingan@indiagully.com` | Board/KMP | See 0017 migration | `YW3DZJZTMUKGDDT3QCR6S2JJKZHWYYTO` |
| `atul.rana@indiagully.com` | Employee | See 0017 migration | `GX6QF2VEKJVQ6LYN7ZTV3SNHBUHPPQQU` |

---

## How to Add TOTP in Google Authenticator
1. Open Google Authenticator → **+** → **Enter a setup key**
2. Account name: as shown above
3. Key: paste the TOTP key (spaces are ignored)
4. Type: **Time-based**
5. Tap **Add**

---

## How to Fix Login If It Breaks Again

Run this ONE command — it syncs D1 database with the credentials above:

```powershell
cd C:\Users\arunk\OneDrive\Documents\GitHub\IG-NEWEST-MARCH26
npx wrangler d1 execute india-gully-production --remote --command="UPDATE ig_users SET password_hash='0710e299d5de37a3aab1ac14b07b0ba9897d6050f2d8d6c081b5f0939e9b7e4e', password_salt='ig-salt-admin-v3-2026', totp_secret='CG5LSHWCQHZL7TV7CQE6Z3DJIAO2MMBZ', totp_enabled=1, is_active=1, is_demo=0, mfa_required=1, updated_at=CURRENT_TIMESTAMP WHERE identifier='superadmin@indiagully.com';"
```

---

## Why This Keeps Breaking (Root Cause — Fixed)

The seed files used `INSERT OR IGNORE` — meaning once a row exists in D1,
re-running seeds NEVER updates it. So when credentials were changed in
code/USER_STORE, D1 was never updated.

**This is now fixed:** `fix_superadmin_login.sql` uses `UPDATE` (not INSERT),
and is the canonical way to repair D1 credentials. The fix_superadmin_login.sql
always reflects the current correct credentials.

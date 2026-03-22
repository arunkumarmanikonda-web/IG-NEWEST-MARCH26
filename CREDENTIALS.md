# India Gully Platform — Master Credentials Reference
**Last verified: 22 March 2026 (DEFINITIVE — do not overwrite)**
**Hashing: PBKDF2-SHA256, 100,000 iterations, 256-bit output**

> ⚠️  These are the CANONICAL credentials. Both `src/routes/api.tsx` (USER_STORE)
> and all seed SQL files (`seed_users.sql`, `seed_phase18.sql`) must match this table.
> The D1 fix script `migrations/fix_all_users_final.sql` applies these to production.

---

## 🔐 Production User Accounts (8/8 Complete)

| # | User | Role | Email/ID | Password | TOTP Secret | Portal URL |
|---|------|------|----------|----------|-------------|------------|
| 1 | SuperAdmin | Super Admin | superadmin@indiagully.com | `India@5327**` | `CG5LSHWCQHZL7TV7CQE6Z3DJIAO2MMBZ` | /admin |
| 2 | Arun Manikonda | Board/MD | akm@indiagully.com | `Arun@IG2026` | `ZMUGY577GXFLTDG6KXKUT3DWZZXOA4JQ` | /portal/board |
| 3 | Pavan Manikonda | Board/ED | pavan@indiagully.com | `Pavan@IG2026` | `OGLMM2FKY3CI26XF2W6PMUPXMV3EY4DO` | /portal/board |
| 4 | Amit Jhingan | Board/President | amit.jhingan@indiagully.com | `Amit@IG2026` | `BI6OWJWK2F5B3C6MZW2UJJOFAV7M3GSR` | /portal/board |
| 5 | Atul Rana | Head Sales | atul.rana@indiagully.com | `Atul@IG2026#` | `GX6QF2VEKJVQ6LYN7ZTV3SNHBUHPPQQU` | /portal/employee |
| 6 | HR Manager | HR ERP | hr@indiagully.com | `HR@IG2026#` | `6CYKXRA3K7ENLOPSY5S25FECVXX3BT3Z` | /admin/hr |
| 7 | Finance CFO | Finance ERP | finance@indiagully.com | `Finance@IG2026#` | `INRLENYXGKG66B4G7PVWZFG7NQLRJHUD` | /admin/finance |
| 8 | Legal CS | Legal | legal@indiagully.com | `Legal@IG2026#` | `CK76ZZNXPCGWCQNFQZDK4YTQH3DH2YL5` | /admin/governance |

---

## 🧪 Demo / QA Accounts (testing only)

| User | Email/ID | Password | TOTP Secret | Notes |
|------|----------|----------|-------------|-------|
| Demo Client | demo@indiagully.com | IGClient@Test2026! | VCPFNOW2QGBUBUTF2MCQXFCLVCPPOXJU | Demo mode |
| Demo Employee | IG-EMP-0001 | IGEmployee@Test2026! | B3S56WWK5R6NSEDML5ARXTDXCVRUXZ67 | Demo mode |
| Demo Board | IG-KMP-0001 | IGBoard@Test2026! | FMWCS4OPGN73MK3LFQOCZYFLW555NAWN | Demo mode |
| QA Account | qa@indiagully.com | IGQa@Test2026! | WGYPMNQOOEEJT7VJKBE6ZMZDH3UEGYSK | No MFA |

---

## 🔑 Password Hashes (PBKDF2-SHA256)

| Email | Salt | Hash |
|-------|------|------|
| superadmin@indiagully.com | ig-salt-admin-v3-2026 | `531e7f8d58df22dc04f4883380c7def8ea1f7a548938d62065d46cf1c011ec1c` |
| akm@indiagully.com | ig-salt-board-akm-2026 | `cdd6bc852a717f91b12f69240f31e79a2395c0fc78933c1085a09898f9dbe5ad` |
| pavan@indiagully.com | ig-salt-board-pavan-2026 | `1acec72c5694e8b9422a5dc4f53619e640df99c78d7ea50f265433a888b9c69c` |
| amit.jhingan@indiagully.com | ig-salt-board-amit-2026 | `93a39866cc13631cdc12d38c762869938bfcee2a649250c4952bce79ebebd836` |
| atul.rana@indiagully.com | ig-salt-emp-atul-2026 | `f1868b84e10fb9ba07c183969b669591a82e97f55927cc1ef7fbf8d7bb1d8066` |
| hr@indiagully.com | ig-salt-hr-2026 | `b00b260813234b492e7d553c6baf9db49dff4cf30e3260cfb1d841ae1331508f` |
| finance@indiagully.com | ig-salt-finance-2026 | `bea826a65411a726a511dfe3e9cc22f230e71854a74d923b8967724f98eedad7` |
| legal@indiagully.com | ig-salt-legal-2026 | `255f716a8d4c3476776ed5b2971806991ea67083befba1f311ab255270bb70ab` |

---

## 🌐 Production Admin URL

**https://indiagully.com/admin** — Super Admin Portal

---

## 🚀 Apply to Live D1 (Run once in PowerShell from project root)

```powershell
npx wrangler d1 execute india-gully-production --remote --file=migrations/fix_all_users_final.sql
```

### Or inline (SuperAdmin only):
```powershell
npx wrangler d1 execute india-gully-production --remote --command="UPDATE ig_users SET password_hash='531e7f8d58df22dc04f4883380c7def8ea1f7a548938d62065d46cf1c011ec1c', password_salt='ig-salt-admin-v3-2026', totp_secret='CG5LSHWCQHZL7TV7CQE6Z3DJIAO2MMBZ', totp_enabled=1, is_active=1, is_demo=0, mfa_required=1, updated_at=CURRENT_TIMESTAMP WHERE identifier='superadmin@indiagully.com';"
```

### Verify all 8 users:
```powershell
npx wrangler d1 execute india-gully-production --remote --command="SELECT identifier, role, is_active, totp_enabled, CASE WHEN totp_secret IS NOT NULL AND totp_secret != '' THEN 'TOTP_OK' ELSE 'MISSING' END AS totp, CASE WHEN password_hash IS NOT NULL AND password_hash != '' THEN 'PWD_OK' ELSE 'MISSING' END AS pwd FROM ig_users ORDER BY id;"
```

---

## 📱 Google Authenticator Setup

For each account, add manually:
- **Account name**: India Gully [Role] (e.g. "India Gully Admin")
- **Key**: The TOTP secret from the table above (spaces optional)
- **Type**: Time-based (TOTP)

---

## ⚠️ Why passwords kept "resetting" — Root Cause Fixed

The seed files used `INSERT OR IGNORE` which **silently skips** any row that already exists.
So every time a new migration ran, the OLD credentials stayed in D1 untouched.

**Fixed by:**
1. Changed `INSERT OR IGNORE` → `INSERT OR REPLACE` in both seed files
2. Added all 8 real users to `USER_STORE` in `api.tsx` (D1 fallback)
3. `fix_all_users_final.sql` uses `UPDATE` (always applies)
4. This file is the single source of truth — any hash change must update ALL THREE:
   - `CREDENTIALS.md` (this file)
   - `src/routes/api.tsx` (USER_STORE)
   - `migrations/seed_users.sql` + `seed_phase18.sql`


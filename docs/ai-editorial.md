# OpenAI editorial drafting

Updated 12 November 2026 (India Standard Time).

The staff AI drafting studio creates structured drafts for opportunities, HORECA products, articles, pages and campaigns. Output includes body copy, search title/description, keyword ideas, bounded ad copy, creative direction, source-linked claims and review questions. It uses the OpenAI Responses API with strict JSON output and `store: false`.

Only deliberately submitted, publicly approved facts and source references are sent. The integration has no tools or automatic access to client records, data rooms, reports, email, code or payment systems. Sources and brief are treated as untrusted input. Generated claims must reference supplied fact IDs. Reference validation alone cannot establish factual or semantic accuracy; staff must review the entire draft.

Access requires a valid staff session, MFA and content rights for the practice. The super-user controls enabled/disabled mode, encrypted credential override, model, output-token limit and daily request limit. An optional Vercel `OPENAI_API_KEY` Secret can supply the key. A global daily request cap and 30-second per-user cooldown are enforced before generation. Failed requests count toward the cap. These are request/token limits, not a currency-denominated spend guarantee.

Saving requires explicit review and creates an unpublished CMS draft. Existing publication controls apply afterward. The studio does not activate ads, send campaigns, publish automatically, generate documentary property imagery or deploy code. Creative output is a brief; Runway/image generation remains a separate unconnected capability.

Current preview state: OpenAI is disabled and no API credential is configured. Twelve rollback-only database assertions and controlled-response API tests passed for roles, MFA, caps, source references, malformed/incomplete/refused output, review and unpublished saves. A funded account/key and a live generation acceptance test remain necessary. No real OpenAI request or charge was made by these tests.

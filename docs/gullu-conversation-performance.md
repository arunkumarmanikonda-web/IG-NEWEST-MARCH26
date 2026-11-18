# Gullu: conversation and response speed

Gullu remains **Your India Gully buddy**. This release improves the existing guide, guest sessions and animated avatar. It does not represent a newly trained foundation model or a claim of human identity.

## Conversation contract

- Speak as India Gully: we, us and our; hum/hamari in Hinglish. Attribute outside partners' roles correctly.
- Match English, Hindi or Hinglish, including explicit language selection.
- Be playful when the visitor is playful, and businesslike for funding, distress, complaints and legal topics. Rotate common greetings and jokes within the current conversation.
- Use the previous shortlist to resolve first/second/third options. Ask which asset when a fact question has multiple possible subjects.
- Accept corrections and refusals. Do not interpret every yes as permission to send a follow-up.
- Remember the visitor's stated brief within the supplied recent conversation. A stated budget is not evidence of a property price, service guarantee or approved transaction.
- Unknown facts remain unknown. Public website content is the source of business answers. A new chat does not inherit another guest's conversation.

## Response paths

| Path | Provider requests | Checks |
| --- | ---: | --- |
| Common greetings, banter, thanks and brief acknowledgements | 0 | Whole-message recognition; mixed factual questions continue to retrieval |
| Simple published fields, leadership, practice directory and supported shortlists | 0 | Public publication snapshot; explicit fields; subject resolution; qualified listing prices |
| Unrecognised casual conversation | 1 | Bounded structured response; no source-backed business assertions or claimed actions |
| Generated factual answers | 2 | Citation and number validation, followed by independent claim/subject/units/qualification verification |

Configuration and public content load in parallel. Retrieval is limited to five ranked documents, with up to four passages each. Simple-field answers bypass generation only when the entire request fits that field. Complex and comparative questions keep the reasoning route.

The browser receives real finding/thinking/checking/saving stages over a private, uncached newline-delimited stream. It receives an answer only after verification and successful persistence. Interrupted requests retain the same turn ID for a safe retry. JSON clients remain compatible. Reading earlier messages no longer forces the conversation to the bottom.

The existing configured model remains the production default. Optional server-side `gullu_model` and `gullu_verifier_model` overrides are isolated from Perspectives and content generation. Evaluate a model change before enabling it; this release does not silently replace the provider model.

## Staff rehearsal and monitoring

Open **Admin → Perspectives & Gullu → Gullu rehearsal** (`/admin/intelligence#gullu-rehearsal`). The workspace requires the existing active staff, verification, policy and intelligence-module permissions. It uses the same public-answer engine without creating a guest, enquiry or email. Rehearsal transcripts stay in that screen. It is rate limited and should use fictional briefs/public information.

Rehearsals show the engine's total, retrieval, configuration, generation and verification durations. Independent reads overlap. Engine duration excludes network transit and authentication. The visitor route logs `gullu_timing` with numerical durations/outcome only, including server request duration. It does not log questions, answers, sources, contact details or session IDs. Use a representative live sample to measure p50/p95; there is no Google-speed guarantee.

## Validation

Automated regression cases cover explicit and ambiguous subjects, ordinal references, topic changes, compound/hypothetical questions, visitor-budget attribution, repeated banter, zero-model fast paths, independent reads, split UTF-8 streams, interrupted streams, save failures, retry identity, session restoration, unauthenticated rehearsal denial and mobile/keyboard behaviour. Existing financial-claim and source-validation tests remain required.

Live model quality and end-to-end latency should be evaluated through the authenticated rehearsal; local provider mocks prove routing/guards, not model intelligence or production response time.

Reference: [OpenAI latency guidance](https://developers.openai.com/api/docs/guides/latency-optimization), consulted 18 November 2026.

## Leadership retrieval regression, 18 November 2026

The reported sequence `hello → whats up → love you → who is the boss at india gully` exposed a gap: keyword-only retrieval could omit the leadership directory, and `job_title` was not part of Gullu's public evidence projection. Published people now have a separate retrieval group, their role is projected explicitly, a compact published leadership reference also stays in model context for unfamiliar phrasings such as “your captain”, and ordinary boss/founder/person-in-charge questions resolve to the applicable current published role. The response uses CMS data, with no hardcoded executive name. Ownership, CEO titles, external-company leaders, ambiguous roles and compound questions do not use that shortcut.

Internal evidence/context commentary is rejected before display, and the independent verifier is instructed not to infer global absence from a limited set of passages. The exact user sequence was replayed locally against the current three published leadership profiles: all four replies required zero model calls, with the final answer identifying Arun Manikonda as Founder and Managing Director. Related English, Hinglish and Hindi phrasing, isolated public retrieval, role edits and incorrect role assumptions have dedicated regressions. This validates the code path and source mapping, not a live authenticated conversation benchmark.

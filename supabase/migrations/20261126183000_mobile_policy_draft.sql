-- Stage factual mobile/access corrections for review. This migration does not
-- publish a policy, assert legal review, change an acceptance or grant access.
-- Publish the reviewed documents through ig_policy_publish under a fresh final
-- version (not this draft version). See docs/mobile-policy-review-2026-11-26.md.
do $migration$
declare
 base public.ig_policy_releases;
 existing public.ig_policy_releases;
 candidate jsonb;
 candidate_hash text;
 privacy_body text;
 data_use_body text;
 draft_version constant text='2026-11-26.mobile-draft.1';
 expected_base_hash constant text='62acfad3240828407e1829165202b82ff4fe910f4e10ae2aef7e3dc5e13e99c1';
 mobile_section constant text=$mobile$## Mobile app and local storage

Public catalogue browsing in the India Gully mobile app does not require an account. The app retrieves public catalogue content and images over HTTPS. Hosting and security providers receive the technical request information needed to deliver and protect those services.

The app stores public catalogue content and your shortlist on your device for convenience and offline reading. Your native shortlist is not uploaded to India Gully. You can remove saved items in the app; clearing the app's storage or uninstalling it removes its local data. When you choose Share, the operating system passes the selected public link to the app you select.

Client accounts, staff sign-in, Gullu, enquiries and private project services open India Gully's website in the system browser. Their authentication, consent, access and retention rules apply. Website sessions and storage are separate from the native app's public cache. The native cache does not store passwords, account tokens, chat transcripts or private data-room documents.

The app does not include an advertising or analytics SDK and does not request permission to access your contacts, microphone, camera or precise location. These statements do not mean that website service records or technical requests are anonymous or unrecorded.

Use More > Delete account & data in the app or https://indiagully.com/delete-account to request account and associated personal-data deletion. The request is reviewed under the retention and privacy-request provisions below; clearing local app data alone does not delete an account or server records.

$mobile$;
 old_access constant text=$old$Public teasers intentionally limit identifying information. Registration, policy acceptance or an enquiry does not execute an NDA or grant access to a project. An applicable project NDA must be accepted and reviewed, and an administrator must grant access to that specific data room. Access may expire or be revoked. Download rights are set separately for each room, client and file. You must not circumvent restrictions, share credentials, redistribute files or upload information without authority.$old$;
 new_access constant text=$access$Registration, policy acceptance, an enquiry, a marketing choice or possession of a room link does not itself grant access to confidential project information. Access is granted for a particular room and verified recipient through the applicable project NDA, client engagement or mandate permissions, or a recorded administrator authorisation. An authorised administrator may grant access before NDA signing and records the recipient, reason, expiry and download permissions. This decision does not create an NDA signature or alter an agreement already accepted. Recipients must sign in using their authorised email address; access may expire or be revoked. File and upload permissions remain subject to the room's configured rules. You must not circumvent restrictions, share credentials, redistribute files or upload information without authority.$access$;
 old_changes constant text=$old$The policy version and publication date are displayed here. Material changes are published as a new retained version. Registered users are asked to acknowledge the current registration policies before continuing protected account operations. A new policy does not retroactively change an executed NDA or accepted commercial agreement.$old$;
 new_changes constant text=$changes$The policy version and publication date are displayed here. Material changes are published as a new retained version. Original registration acceptances retain the version and hash recorded when they were given. Publishing a new release does not rewrite an earlier acceptance or change an executed NDA or accepted commercial agreement. Where a new consent or acknowledgement is required, it must be obtained separately.$changes$;
begin
 perform pg_advisory_xact_lock(7193344);
 select * into base from public.ig_policy_releases where version='2026-11-11.2';
 if base.version is null or base.sha256 is distinct from expected_base_hash
    or encode(extensions.digest(convert_to(base.documents::text,'UTF8'),'sha256'),'hex') is distinct from expected_base_hash then
  raise exception 'Policy base differs from the reviewed release; prepare a new draft against the current documents';
 end if;
 privacy_body=base.documents->'privacy'->>'body';
 data_use_body=base.documents->'dataUse'->>'body';
 if strpos(privacy_body,'This notice covers the website, accounts, enquiries, procurement and controlled project information.')=0
    or strpos(privacy_body,'## Information and purposes')=0
    or strpos(privacy_body,old_changes)=0 or strpos(data_use_body,old_access)=0 then
  raise exception 'Policy text anchors changed; review the draft replacements';
 end if;
 privacy_body=replace(privacy_body,
  'This notice covers the website, accounts, enquiries, procurement and controlled project information.',
  'This notice covers the India Gully website and mobile applications, accounts, enquiries, procurement and controlled project information.');
 privacy_body=replace(privacy_body,'## Information and purposes',mobile_section||'## Information and purposes');
 privacy_body=replace(privacy_body,old_changes,new_changes);
 data_use_body=replace(data_use_body,old_access,new_access);
 candidate=jsonb_set(jsonb_set(base.documents,'{privacy,body}',to_jsonb(privacy_body),false),'{dataUse,body}',to_jsonb(data_use_body),false);
 candidate_hash=encode(extensions.digest(convert_to(candidate::text,'UTF8'),'sha256'),'hex');

 -- Reapplying the migration cannot overwrite a draft, republish an old release,
 -- or demote a newer release. A version collision always fails closed.
 select * into existing from public.ig_policy_releases where version=draft_version;
 if found then
  if existing.documents is distinct from candidate or existing.sha256 is distinct from candidate_hash
     or existing.current or existing.legal_reviewed then
   raise exception 'Policy draft version already exists with a different state; use a new version';
  end if;
  return;
 end if;
 -- A clean installation has not published its initial release yet. Staging an
 -- unreviewed draft is safe there too; never derive it over a newer live policy.
 if exists(select 1 from public.ig_policy_releases where current and version<>base.version) then
  raise exception 'A different policy is active; prepare a fresh draft';
 end if;
 insert into public.ig_policy_releases(version,documents,sha256,current,legal_reviewed)
 values(draft_version,candidate,candidate_hash,false,false);
end
$migration$;

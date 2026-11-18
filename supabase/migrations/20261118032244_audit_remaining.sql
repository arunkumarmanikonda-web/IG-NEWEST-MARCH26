-- Audit F11: expiry and revocation are enforced by the database, including old clients.
alter table ig_private.gullu_guests add column expires_at timestamptz;
update ig_private.gullu_guests set expires_at=created_at+interval '24 hours';
alter table ig_private.gullu_guests alter column expires_at set default now()+interval '24 hours';
alter table ig_private.gullu_guests alter column expires_at set not null;
alter table ig_private.gullu_guests add column revoked_at timestamptz;
alter function public.ig_gullu_guest(text,jsonb) set schema ig_private;
alter function ig_private.ig_gullu_guest(text,jsonb) rename to gullu_guest_before_sessions;
revoke all on function ig_private.gullu_guest_before_sessions(text,jsonb) from public,anon,authenticated;
create function public.ig_gullu_guest(secret text,p jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
begin
 if not ig_private.integration_server(secret) then raise exception 'Server required' using errcode='42501';end if;
 if p->>'action'<>'start' and not exists(select from ig_private.gullu_guests where session_id=(p->>'session_id')::uuid and expires_at>now() and revoked_at is null) then raise exception 'Chat expired. Start a new conversation' using errcode='42501';end if;
 return ig_private.gullu_guest_before_sessions(secret,p);
end $$;
revoke all on function public.ig_gullu_guest(text,jsonb) from public;
grant execute on function public.ig_gullu_guest(text,jsonb) to anon,authenticated;
create function public.ig_gullu_session(secret text,p jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare guest ig_private.gullu_guests; turns jsonb; cutoff ig_private.gullu_turns; total integer;
begin
 if not ig_private.integration_server(secret) then raise exception 'Server required' using errcode='42501';end if;
 select * into guest from ig_private.gullu_guests where session_id=(p->>'session_id')::uuid and revoked_at is null and expires_at>now();
 if guest.session_id is null then return null;end if;
 if p->>'action'='end' then update ig_private.gullu_guests set revoked_at=now() where session_id=guest.session_id;return '{}';end if;
 if p->>'action'<>'resume' then raise exception 'Unknown session action';end if;
 if p->>'before' is not null then
  select * into strict cutoff from ig_private.gullu_turns where session_id=guest.session_id and turn_id=(p->>'before')::uuid;
 end if;
 select count(*) into total from (select 1 from ig_private.gullu_turns where session_id=guest.session_id and (cutoff.turn_id is null or (created_at,turn_id)<(cutoff.created_at,cutoff.turn_id)) limit 51) q;
 select coalesce(jsonb_agg(jsonb_build_object('turn_id',turn_id,'question',question,'answer',answer,'sources',sources,'practice_interest',practice_interest) order by created_at,turn_id),'[]') into turns from
 (select * from ig_private.gullu_turns where session_id=guest.session_id and (cutoff.turn_id is null or (created_at,turn_id)<(cutoff.created_at,cutoff.turn_id)) order by created_at desc,turn_id desc limit 50) q;
 return jsonb_build_object('session_id',guest.session_id,'firstName',split_part(guest.name,' ',1),'messages',turns,'hasMore',total>50);
end $$;
revoke all on function public.ig_gullu_session(text,jsonb) from public;
grant execute on function public.ig_gullu_session(text,jsonb) to anon,authenticated;


notify pgrst,'reload schema';

-- Audit F14: page only public SKU summaries; never ship the complete catalogue to browsers.
create function ig_private.product_category(d jsonb,title text,tags jsonb) returns text language plpgsql immutable set search_path='' as $$
declare category text=trim(regexp_replace(lower(coalesce(d->>'category','')),'[^a-z0-9]+',' ','g')); chosen text; value text;
begin
 chosen=case when category in ('lighting','lighting') then 'lighting'
when category in ('in room','in room') then 'in-room'
when category in ('cutlery','cutlery') then 'cutlery'
when category in ('crockery','crockery') then 'crockery'
when category in ('glassware','glassware') then 'glassware'
when category in ('hollowware','hollowware') then 'hollowware'
when category in ('kitchen equipment','kitchen equipment') then 'kitchen-equipment'
when category in ('linen','linen') then 'linen'
when category in ('housekeeping','housekeeping') then 'housekeeping'
when category in ('banquet buffet','banquet buffet') then 'banquet-buffet'
when category in ('furniture','furniture') then 'furniture'
when category in ('bathroom','bathroom') then 'bathroom'
when category in ('other','other supplies') then 'other' else null end;if chosen is not null then return chosen;end if;
 for value in select category union all select trim(regexp_replace(lower(t->>'label'),'[^a-z0-9]+',' ','g')) from jsonb_array_elements(coalesce(tags,'[]')) t where coalesce(t->>'dimension','product-category')='product-category' union all select trim(regexp_replace(lower(title),'[^a-z0-9]+',' ','g')) loop
 if value ~ '\y(light(?:ing|s|er)?|downlights?|downlighter|chandeliers?|lamps?|luminaire|track spots?|pendants?|pendents|led|sconce)\y' then return 'lighting';end if;
if value ~ '\y(cutlery|cuttlery|flatware|forks?|spoons?|knives|table knife|steak knife|butter knife)\y' then return 'cutlery';end if;
if value ~ '\y(crockery|porcelain|ceramic|bone china|stoneware|plates?|bowls?|saucers?|cups?|ramekins?|mugs?)\y' then return 'crockery';end if;
if value ~ '\y(glass ?ware|stemware|tumblers?|goblets?|wine glasses|beer glasses|glass decanters?)\y' then return 'glassware';end if;
if value ~ '\y(hollow ?ware|metal serviceware|stainless steel (?:jug|pot|tray)|silverware)\y' then return 'hollowware';end if;
if value ~ '\y(in ?room|guest ?room|room amenities|guest amenities|minibars?|safes?|kettles?|hair ?dryers?|ironing|hangers?|luggage racks?)\y' then return 'in-room';end if;
if value ~ '\y(linen|bedding|towels?|duvets?|pillows?|bed ?sheets?|napkins?|tablecloths?|bathrobes?)\y' then return 'linen';end if;
if value ~ '\y(housekeeping|cleaning|janitorial|vacuum|scrubber|waste bins?|mops?|laundry equipment)\y' then return 'housekeeping';end if;
if value ~ '\y(banquet|buffet|chafing|food warmer|service station)\y' then return 'banquet-buffet';end if;
if value ~ '\y(furniture|chairs?|tables?|sofas?|beds?|wardrobes?|desks?|stools?|loungers?)\y' then return 'furniture';end if;
if value ~ '\y(bathroom|bath fittings|sanitary|faucets?|showers?|soap dispensers?|towel rails?)\y' then return 'bathroom';end if;
if value ~ '\y(kitchen|cookware|cooking|ovens?|fryers?|refrigerat\w*|freezers?|dishwashers?|ice makers?|food preparation|baking|bakery|coffee machines?|blenders?)\y' then return 'kitchen-equipment';end if;
 end loop;return 'other';
end $$;
create function ig_private.product_type(category text,d jsonb,title text) returns text language plpgsql immutable set search_path='' as $$
declare value text=lower(coalesce(d->>'category','')||' '||title);
begin
 if category='lighting' then return case when value ~ '\y(track|spots)\y' then 'Track lights' when value ~ '\y(pendant|pendents)\y' then 'Pendant lights' when value ~ '\yglobe\y' then 'Globe lights' when value ~ '\ychandelier\y' then 'Chandeliers' when value ~ '\y(downlight|downlights|downlighter|recess|recessed|popout)\y' then 'Downlights' when value ~ '\ylamp\y' then 'Lamps' else 'Lighting' end;
 elsif category='crockery' then return case when value ~ '\y(plate|plates|platter)\y' then 'Plates & platters' when value ~ '\y(bowl|bowls|ramekin)\y' then 'Bowls & ramekins' when value ~ '\y(cup|mug|saucer)\y' then 'Cups & saucers' else 'Table accessories' end;
 elsif category='cutlery' then return case when value ~ '\y(knife|knives)\y' then 'Knives' when value ~ '\y(fork|forks)\y' then 'Forks' when value ~ '\y(spoon|spoons|teaspoon)\y' then 'Spoons' else 'Cutlery' end;
 end if;
 return case category when 'lighting' then 'Lighting' when 'in-room' then 'In-room' when 'cutlery' then 'Cutlery' when 'crockery' then 'Crockery' when 'glassware' then 'Glassware' when 'hollowware' then 'Hollowware' when 'kitchen-equipment' then 'Kitchen Equipment' when 'linen' then 'Linen' when 'housekeeping' then 'Housekeeping' when 'banquet-buffet' then 'Banquet & Buffet' when 'furniture' then 'Furniture' when 'bathroom' then 'Bathroom' when 'other' then 'Other Supplies' else 'Other Supplies' end;
end $$;
revoke all on function ig_private.product_category(jsonb,text,jsonb),ig_private.product_type(text,jsonb,text) from public,anon,authenticated;
create function public.ig_horeca_catalogue(p jsonb default '{}') returns jsonb language sql stable security definer set search_path='' as $$
 with source as materialized (
 select c.id,c.slug,c.title,c.summary,c.version,c.published_at,c.public_data,
 coalesce((select jsonb_agg(jsonb_build_object('label',t.label,'dimension',t.dimension) order by t.label) from public.ig_public_tags pt join public.ig_taxonomy t on t.id=pt.term_id where pt.content_id=c.id and t.active),'[]') tags
 from public.ig_public_content c where c.kind='product'),
 classified as materialized (select s.*,ig_private.product_category(public_data,title,tags) category from source s),
 typed as materialized (select c.*,ig_private.product_type(category,public_data,title) product_type from classified c),
 scoped as materialized (select * from typed where (coalesce(p->>'category','')='' or category=p->>'category') and
 position(lower(left(trim(coalesce(p->>'query','')),120)) in lower(concat_ws(' ',title,summary,public_data->>'sector',public_data->>'sku',public_data->>'reference',public_data->>'brand',public_data->>'category',category,tags::text)))>0),
 filtered as materialized (select s.*,pr.slot from scoped s left join public.ig_live_product_priorities() pr on pr.content_id=s.id where
 (coalesce(p->>'brand','')='' or lower(public_data->>'brand')=lower(p->>'brand')) and (coalesce(p->>'type','')='' or product_type=p->>'type')),
 page as (select * from filtered order by case when p->>'sort'='priority' then slot end asc nulls last,
 case when coalesce(p->>'sort','name')='name' then lower(title) end asc,
 published_at desc,id asc limit 24 offset greatest(0,least(coalesce((p->>'offset')::int,0),100000)))
 select jsonb_build_object(
 'items',case when coalesce(p->>'category','')='' and coalesce(p->>'query','')='' then '[]'::jsonb else coalesce((select jsonb_agg(jsonb_build_object('id',id,'slug',slug,'title',title,'summary',summary,'tags',tags,'public_data',jsonb_build_object('brand',public_data->'brand','sku',public_data->'sku','reference',public_data->'reference','category',public_data->'category','sector',public_data->'sector','image',public_data->'image','image_alt',public_data->'image_alt','price_label',public_data->'price_label','pack_size',public_data->'pack_size','moq',public_data->'moq','uom',public_data->'uom'))) from page),'[]') end,
 'total',(select count(*) from filtered),'counts',(select coalesce(jsonb_object_agg(category,n),'{}') from (select category,count(*) n from typed group by category) c),
 'brands',(select coalesce(jsonb_agg(b order by b),'[]') from (select distinct public_data->>'brand' b from scoped where nullif(public_data->>'brand','') is not null) b),
 'types',(select coalesce(jsonb_agg(t order by t),'[]') from (select distinct product_type t from scoped where coalesce(p->>'brand','')='' or lower(public_data->>'brand')=lower(p->>'brand')) t),
 'revision',(select md5(coalesce(string_agg(id::text||':'||version::text||':'||published_at::text,',' order by id),'')) from source));
$$;
revoke all on function public.ig_horeca_catalogue(jsonb) from public;
grant execute on function public.ig_horeca_catalogue(jsonb) to anon,authenticated;


notify pgrst,'reload schema';

-- Audit F03: readiness must precede invitations and new grants.
create function public.ig_room_readiness(p jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare room uuid=(p->>'room_id')::uuid; problems jsonb;
begin
 if not ig_private.room_staff(room) then raise exception 'Room administration permission required' using errcode='42501';end if;
 select coalesce(jsonb_agg(jsonb_build_object('id',f.id,'name',f.name,'status',f.status,'download_enabled',f.download_enabled,
 'reason',case when f.status='pending' then 'Upload has not completed. Retry or remove this pending file.' else 'Add an optimised PDF preview, or explicitly permit original downloads for this file and recipient.' end) order by f.name),'[]') into problems
 from public.ig_room_files f where f.room_id=room and f.preview_for is null and (
 f.status='pending' or (f.status='ready' and not (f.mime in ('application/pdf','image/jpeg','image/png','image/webp') and f.bytes<=20971520)
 and not exists(select 1 from public.ig_room_files pr where pr.preview_for=f.id and pr.status='ready' and pr.mime='application/pdf' and pr.bytes<=20971520)
 and not (f.download_enabled and coalesce(p->>'download_mode','none')='all')));
 return jsonb_build_object('ready',jsonb_array_length(problems)=0,'issues',problems);
end $$;
revoke all on function public.ig_room_readiness(jsonb) from public,anon;
grant execute on function public.ig_room_readiness(jsonb) to authenticated;
alter function ig_private.room_share(jsonb) rename to room_share_before_readiness;
revoke all on function ig_private.room_share_before_readiness(jsonb) from public,anon,authenticated;
create function ig_private.room_share(p jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare readiness jsonb;
begin
 if not ig_private.room_staff((p->>'room_id')::uuid) then raise exception 'Room administration permission required' using errcode='42501';end if;
 if p->>'action'='readiness' then return public.ig_room_readiness(p);end if;
 if p->>'action' in ('share','access') then
  if exists(select 1 from ig_private.room_share_receipts where batch_id=(p->>'batch_id')::uuid) then return ig_private.room_share_before_readiness(p);end if;
  perform 1 from public.ig_data_rooms where id=(p->>'room_id')::uuid for update;
  readiness=public.ig_room_readiness(p||jsonb_build_object('download_mode',case when p->>'download_mode'='all' and exists(
   select 1 from public.ig_room_grants g where g.room_id=(p->>'room_id')::uuid and g.active and g.expires_at>now() and g.download_mode<>'all'
   and (g.contact_id::text in (select jsonb_array_elements_text(p->'recipient_ids')) or g.nda_request_id::text in (select jsonb_array_elements_text(p->'recipient_ids')))) then 'none' else p->>'download_mode' end));
  if readiness->>'ready'<>'true' then raise exception 'Room not ready: % file(s) require attention. First: %. Open the readiness list before sharing.',jsonb_array_length(readiness->'issues'),readiness->'issues'->0->>'name';end if;
 end if;
 return ig_private.room_share_before_readiness(p);
end $$;
revoke all on function ig_private.room_share(jsonb) from public,anon;
grant execute on function ig_private.room_share(jsonb) to authenticated;


notify pgrst,'reload schema';

-- Audit F16: jurisdiction-aware legal names, always reviewed by a person.
alter table public.ig_legal_entities add column country text not null default 'IN';
alter table public.ig_legal_entities add column entity_type text;
alter table public.ig_legal_entities add column registration_id text;
alter table public.ig_legal_entities drop constraint ig_legal_entities_kind_check;
alter table public.ig_legal_entities add constraint ig_legal_entities_kind_check check(kind in ('company','individual','organisation','international_individual'));
alter table public.ig_legal_entities add constraint ig_entity_country check(country ~ '^[A-Z]{2}$');
alter table public.ig_legal_entities drop constraint ig_entity_identifiers;
alter table public.ig_legal_entities add constraint ig_entity_identifiers check (
 (kind='company' and country='IN' and cin is not null and cin ~ '^[LU][0-9]{5}[A-Z]{2}[0-9]{4}[A-Z]{3}[0-9]{6}$' and (gstin is null or gstin ~ '^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$') and pan is null and id_method is null)
 or (kind='individual' and country='IN' and pan is not null and pan ~ '^[A-Z]{5}[0-9]{4}[A-Z]$' and id_method is not null and id_method in ('passport','aadhaar_offline') and cin is null and gstin is null)
 or (kind='organisation' and entity_type in ('llp','partnership','trust','foreign_company','other') and length(trim(registration_id)) between 2 and 80 and registration_id is not null and entity_type is not null and cin is null and pan is null and gstin is null and id_method is null)
 or (kind='international_individual' and country<>'IN' and cin is null and gstin is null and pan is null and id_method is not null and id_method='passport'));
create or replace function ig_private.kyc_slots(e public.ig_legal_entities) returns text[] language sql immutable set search_path='' as $$
 select case when e.kind='company' then case when e.gstin is null then array['incorporation','resolution'] else array['incorporation','gst','resolution'] end
 when e.kind='organisation' then array['registration','authority'] when e.kind='international_individual' then array['passport'] else array['pan',e.id_method] end
$$;
do $$
declare spec text=pg_get_functiondef('public.ig_client_identity(jsonb)'::regprocedure);
begin
 if position('user_id,kind,legal_name,vital_date,signer,cin,gstin,pan,id_method)' in spec)=0 then raise exception 'Identity writer changed';end if;
 spec=replace(spec,'(k=''individual'' and d>','(k in (''individual'',''international_individual'') and d>');
 spec=replace(spec,'if k=''individual'' then s=n;','if k in (''individual'',''international_individual'') then s=n;');
 spec=replace(spec,'user_id,kind,legal_name,vital_date,signer,cin,gstin,pan,id_method)','user_id,kind,legal_name,vital_date,signer,cin,gstin,pan,id_method,country,entity_type,registration_id)');
 spec=replace(spec,'nullif(p->>''id_method'','''')) returning','nullif(p->>''id_method'',''''),coalesce(nullif(upper(p->>''country''),''''),''IN''),nullif(p->>''entity_type'',''''),nullif(trim(p->>''registration_id''),'''')) returning');
 spec=replace(spec,'set kind=k,legal_name=n','set country=coalesce(nullif(upper(p->>''country''),''''),''IN''),entity_type=nullif(p->>''entity_type'',''''),registration_id=nullif(trim(p->>''registration_id''),''''),kind=k,legal_name=n');
 execute spec;
end $$;


notify pgrst,'reload schema';

-- Audit F02: failed research retries the next editorial morning, not a fortnight later.
-- Publication still requires the independent verifier and all existing source checks.
do $$
declare spec text=pg_get_functiondef('public.ig_perspective_worker(text,jsonb)'::regprocedure);
 retry text=$s$((current_date+1)+time '09:00') at time zone 'Asia/Kolkata'$s$;
begin
 if position('next_at=case when attempts>=3 then cycle' in spec)=0 then raise exception 'Perspective retry function changed';end if;
 spec=replace(spec,'next_at=case when attempts>=3 then cycle','next_at=case when attempts>=3 then '||retry);
 spec=replace(spec,'set attempts=0,next_at=cycle where id; return null;','set attempts=0,next_at='||retry||' where id; return null;');
 execute spec;
end $$;
notify pgrst,'reload schema';

-- Poll once every ten minutes even when queues are idle so stale monitoring is meaningful.
do $$
declare spec text=pg_get_functiondef('ig_private.run_email_worker()'::regprocedure);
begin
 if position('if not exists(select 1 from ig_private.intelligence_settings' in spec)=0 then raise exception 'Worker schedule changed';end if;
 spec=replace(spec,'if not exists(select 1 from ig_private.intelligence_settings',
 'if not exists(select 1 from ig_private.worker_health where started_at is null or started_at<now()-interval ''10 minutes'') and not exists(select 1 from ig_private.intelligence_settings');
 execute spec;
end $$;

notify pgrst,'reload schema';

drop policy collection_email_read on public.ig_outbox;
drop policy outbox_read on public.ig_outbox;
drop policy room_outbox_read on public.ig_outbox;
create policy outbox_read on public.ig_outbox for select to authenticated using (
 exists(select 1 from public.ig_enquiries e where e.id=ig_outbox.enquiry_id)
 or (collection_link_id is not null and exists(select 1 from public.ig_collection_links c where c.id=ig_outbox.collection_link_id and ig_private.collection_allowed(c.practice)))
 or (room_id is not null and ig_private.room_staff(room_id)));


notify pgrst,'reload schema';

begin;
do $$
declare secret text=repeat('g',64); sid uuid=gen_random_uuid();tid uuid=gen_random_uuid(); t jsonb; d date=(now() at time zone 'Asia/Kolkata')::date; snap jsonb; j jsonb; lease jsonb; jobs jsonb;
begin
 update ig_private.integration_root set secret_hash=encode(extensions.digest(secret,'sha256'),'hex');
 update ig_private.integration_config set mode='enabled' where id='resend';
 perform public.ig_gullu_guest(secret,jsonb_build_object('action','start','session_id',sid,'name','Test Guest','email','guest@example.invalid','mobile','+919999000000','consent',true));
 t=jsonb_build_object('action','record','session_id',sid,'turn_id',tid,'question','Kya options hain?','answer','Published information','sources','[]'::jsonb,'practice_interest','Real estate','follow_up',false);
 perform public.ig_gullu_guest(secret,t);perform public.ig_gullu_guest(secret,t);
 if (select count(*) from ig_private.gullu_reports where period_start=d and cadence='daily')<>3 then raise exception 'Daily reports missing';end if;
 snap=ig_private.gullu_day_sessions(d,null,25);
 if snap#>>'{0,email}'<>'guest@example.invalid' or jsonb_array_length(snap#>'{0,turns}')<>1 then raise exception 'Wrong transcript';end if;
 if (public.ig_gullu_guest(secret,t||'{"action":"context"}')#>>'{existing,turn_id}')<>tid::text then raise exception 'Idempotent read missing';end if;
 perform public.ig_gullu_guest(secret,t||'{"follow_up":true}');
 if not exists(select 1 from public.ig_enquiries where email='guest@example.invalid' and phone='+919999000000') then raise exception 'Mobile missing';end if;
 update ig_private.gullu_reports set next_at=now() where cadence='daily' and period_start=d;
 jobs=public.ig_gullu_digest(secret,'{"action":"claim"}');
 if jsonb_array_length(jobs)<>3 or jobs#>>'{0,cadence}'<>'daily' then raise exception 'Daily lease missing';end if;
 j=jobs->0;lease=jsonb_build_object('action','rows','id',j->>'id','lease_token',j->>'lease_token');
 if public.ig_gullu_digest(secret,lease)#>>'{0,turns,0,question}'<>'Kya options hain?' then raise exception 'Report data missing';end if;
end $$;
rollback;

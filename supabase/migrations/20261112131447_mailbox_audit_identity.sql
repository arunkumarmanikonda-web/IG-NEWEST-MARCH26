do $migration$
declare source text;
begin
 select pg_get_functiondef('ig_private.mailbox_runtime(text,jsonb)'::regprocedure) into source;
 source=replace(source,$old$record_audit('mailbox.connected',uid,$old$,$new$record_audit('mailbox.connected',uid::text,$new$);
 source=replace(source,$old$record_audit('mailbox.disconnected',uid,$old$,$new$record_audit('mailbox.disconnected',uid::text,$new$);
 source=replace(source,$old$record_audit('mailbox.send_requested',did,$old$,$new$record_audit('mailbox.send_requested',did::text,$new$);
 source=replace(source,$old$record_audit('mailbox.'||(p->>'status'),did,$old$,$new$record_audit('mailbox.'||(p->>'status'),did::text,$new$);
 execute source;
end $migration$;

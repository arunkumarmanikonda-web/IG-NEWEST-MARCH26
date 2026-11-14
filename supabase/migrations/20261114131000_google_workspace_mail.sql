alter table ig_private.integration_config
  drop constraint integration_config_id_check,
  add constraint integration_config_id_check
    check (id in ('business','resend','razorpay','fast2sms','openai','runway','google_mail'));

insert into ig_private.integration_config (id, mode, settings)
values ('google_mail', 'disabled', '{"client_id":""}')
on conflict (id) do nothing;

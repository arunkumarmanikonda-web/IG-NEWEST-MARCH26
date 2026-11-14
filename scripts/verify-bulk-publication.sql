-- Disposable local business fixtures. The transaction is always rolled back.
begin;
do $$
declare
  staff_id uuid; staff_session uuid;
  product jsonb; other jsonb; invalid jsonb; request jsonb; result jsonb;
  test_slug text := 'bulk-fixture-'||gen_random_uuid();
begin
  select u.id,s.id into strict staff_id,staff_session
    from auth.users u join auth.sessions s on s.user_id=u.id where u.email='owner@example.invalid' limit 1;
  perform set_config('request.jwt.claims',jsonb_build_object('sub',staff_id,'session_id',staff_session,'aal','aal2','role','authenticated')::text,true);
  product := public.ig_save_content(jsonb_build_object('kind','product','practice','horeca','title','Regression product',
    'slug',test_slug,'body','Reviewed description','public_data',jsonb_build_object('uom','piece')));
  other := public.ig_save_content(jsonb_build_object('kind','opportunity','practice','real-estate','title','Regression property',
    'slug',test_slug||'-property','body','Reviewed description','public_data','{}'::jsonb));
  invalid := public.ig_save_content(jsonb_build_object('kind','product','practice','horeca','title','Draft without unit',
    'slug',test_slug||'-incomplete','public_data','{}'::jsonb));
  request := jsonb_build_object('action','publish','rows',jsonb_build_array(
    jsonb_build_object('id',product->'id','version',product->'version'),
    jsonb_build_object('id',invalid->'id','version',invalid->'version'),
    jsonb_build_object('id',other->'id','version',other->'version')),
    'factsConfirmed',true,'rightsConfirmed',true,'privacyConfirmed',true);
  perform set_config('ig.test_public_slug',test_slug,true);
  set local role authenticated;
  result := public.ig_bulk_publication(request - 'factsConfirmed');
  assert not exists(select 1 from jsonb_array_elements(result) x where (x->>'ok')::boolean);
  result := public.ig_bulk_publication(request);
  assert jsonb_array_length(result)=3;
  assert (select count(*)=2 from jsonb_array_elements(result) x where (x->>'ok')::boolean);
  assert exists(select 1 from jsonb_array_elements(result) x where x->>'id'=invalid->>'id' and x->>'error' like '%unit%');
  assert exists(select 1 from public.ig_public_content where slug=test_slug and kind='product' and version=(product->>'version')::int);
  assert exists(select 1 from public.ig_public_content where slug=test_slug||'-property');
  assert not exists(select 1 from public.ig_public_content where id=(invalid->>'id')::uuid);
  result := public.ig_bulk_publication(jsonb_build_object('action','publish','rows',jsonb_build_array(
    jsonb_build_object('id',product->'id','version',product->'version','verify_only',true))));
  assert (result->0->>'ok')::boolean;
  result := public.ig_bulk_publication(jsonb_build_object('action','archive','rows',jsonb_build_array(
    jsonb_build_object('id',product->'id','version',product->'version','verify_only',true))));
  assert not (result->0->>'ok')::boolean;
  reset role;
  set local role anon;
  assert exists(select 1 from public.ig_public_content where slug=test_slug and kind='product');
  reset role;
  set local role authenticated;
  result := public.ig_bulk_publication(jsonb_build_object('action','archive','rows',jsonb_build_array(jsonb_build_object('id',product->'id','version',0))));
  assert not (result->0->>'ok')::boolean;
  assert exists(select 1 from public.ig_public_content where slug=test_slug);
  result := public.ig_bulk_publication(jsonb_set(request,'{action}','"archive"'));
  assert not exists(select 1 from public.ig_public_content where slug in (test_slug,test_slug||'-property'));
end $$;
rollback;

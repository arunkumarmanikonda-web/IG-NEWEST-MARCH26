import test from 'node:test';
import assert from 'node:assert/strict';
import {stageRazorpayLive} from '../lib/razorpay-live.mjs';
const previous={mode:'test',settings:{key_id:'rzp_test_old',merchant_verified:true,max_payment_paise:10000}};
const env={VERCEL_ENV:'production',RAZORPAY_LIVE_KEY_ID:'rzp_live_fixture',RAZORPAY_LIVE_KEY_SECRET:'synthetic-secret-fixture'};
test('live-key staging is blocked outside production even if keys are present',()=>{
  for(const VERCEL_ENV of ['preview','development',undefined])assert.throws(()=>stageRazorpayLive(previous,{...env,VERCEL_ENV}),/only be staged in production/);
});
test('staging retains payment limits, discards test credentials and cannot activate payments',()=>{
  const staged=stageRazorpayLive(previous,env);
  assert.equal(staged.mode,'disabled');assert.equal(staged.settings.merchant_verified,false);assert.equal(staged.settings.max_payment_paise,10000);
  assert.equal(staged.clear_credentials,true);assert.deepEqual(Object.keys(staged.credentials),['key_secret']);assert.equal(previous.mode,'test');
});
test('invalid key pairs and active live rotations fail closed',()=>{
  assert.throws(()=>stageRazorpayLive(previous,{...env,RAZORPAY_LIVE_KEY_ID:'rzp_test_fixture'}),/Save RAZORPAY/);
  assert.throws(()=>stageRazorpayLive(previous,{...env,RAZORPAY_LIVE_KEY_SECRET:''}),/Save RAZORPAY/);
  assert.throws(()=>stageRazorpayLive({...previous,mode:'live'},env),/already active/);
});

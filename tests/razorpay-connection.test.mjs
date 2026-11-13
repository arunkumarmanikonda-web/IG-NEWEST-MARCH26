import test from 'node:test';
import assert from 'node:assert/strict';
import {checkRazorpayCredentials} from '../lib/razorpay-live.mjs';
const config={mode:'disabled',settings:{key_id:'rzp_live_ControlledTest'},secrets:{key_secret:'controlled-test-only'}};

test('Razorpay connection check is a single read-only request and returns no merchant records',async()=>{
 let calls=0;
 const result=await checkRazorpayCredentials(config,async(url,options)=>{
  calls++;assert.equal(url,'https://api.razorpay.com/v1/orders?count=1');
  assert.equal(options.method,'GET');assert.equal(options.body,undefined);
  assert.equal(options.redirect,'error');assert.equal(options.cache,'no-store');
  assert.equal(options.headers.Authorization,'Basic '+Buffer.from('rzp_live_ControlledTest:controlled-test-only').toString('base64'));
  return Response.json({entity:'collection',count:1,items:[{id:'private-order',notes:{customer:'private-customer'}}]});
 });
 assert.equal(calls,1);assert.equal(result.ok,true);
 assert.doesNotMatch(JSON.stringify(result),/private-order|private-customer|controlled-test-only/);
 assert.equal(config.mode,'disabled');
});
test('Missing credentials never reach the provider',async()=>{
 assert.equal((await checkRazorpayCredentials({settings:{},secrets:{}},()=>{throw Error('must not request');})).ok,false);
});
test('Rejected or malformed provider results cannot report credential acceptance',async()=>{
 for(const response of [Response.json({error:{description:'sensitive provider detail'}},{status:401}),Response.json({entity:'order'}),new Response('invalid')]){
  await assert.rejects(()=>checkRazorpayCredentials(config,async()=>response),error=>error.message.includes('could not be verified')&&!error.message.includes('sensitive provider detail'));
 }
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {createHmac} from 'node:crypto';
import {validWorkerSignature} from '../supabase/functions/ig-provider-webhook/worker-signature.mjs';

test('Scheduled worker authentication works without a global Node Buffer',()=>{
 const stamp='1794485000',secret='unit-test-secret',body=new TextEncoder().encode('{}');
 const signature=createHmac('sha256',secret).update('ig-email-worker-v1.'+stamp+'.{}').digest('hex');
 const payload={stamp,secret,body,signature,now:Number(stamp)*1000};
 const buffer=globalThis.Buffer;
 try{globalThis.Buffer=undefined;assert.equal(validWorkerSignature(payload),true);}finally{globalThis.Buffer=buffer;}
 assert.equal(validWorkerSignature({...payload,signature:'0'.repeat(64)}),false);
 assert.equal(validWorkerSignature({...payload,now:payload.now+301000}),false);
 assert.equal(validWorkerSignature({...payload,body:new TextEncoder().encode('{"changed":true}')}),false);
 assert.equal(validWorkerSignature({...payload,secret:''}),false);
});

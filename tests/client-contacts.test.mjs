import test from 'node:test';
import assert from 'node:assert/strict';
import {prepareContactRows} from '../lib/client-services.mjs';
test('multiple named contacts retain separate numbers and permissions',()=>{
 const rows=prepareContactRows([{name:' A ',email:'A@example.invalid',phone:'+1 (202) 555-0101',designation:'Owner',portal_enabled:true},{name:'B',email:'b@example.invalid',phone:'+44 20 7946 0001',circulation:true},{}]);
 assert.equal(rows.length,2);assert.equal(rows[0].email,'a@example.invalid');assert.equal(rows[0].phone,'+1 (202) 555-0101');assert.equal(rows[1].phone,'+44 20 7946 0001');assert.equal(rows[1].portal_enabled,false);assert.equal(rows[1].circulation,true);
});
test('duplicate email in a batch is explained before a partial save can happen',()=>{
 assert.throws(()=>prepareContactRows([{name:'A',email:'a@example.invalid'},{name:'B',email:'A@example.invalid'}]),/appears more than once/);
});
test('partially entered and malformed contacts are rejected but wholly empty rows are ignored',()=>{
 assert.deepEqual(prepareContactRows([{}]),[]);
 assert.throws(()=>prepareContactRows([{phone:'+12025550101'}]),/name and email/);
 assert.throws(()=>prepareContactRows([{name:'A',email:'bad'}]),/valid email/);
 assert.throws(()=>prepareContactRows([{name:'A',email:'a@example.invalid',phone:'abc'}]),/valid phone/);
 assert.equal(prepareContactRows([{name:'A',email:'a@example.invalid'}])[0].phone,'');
});

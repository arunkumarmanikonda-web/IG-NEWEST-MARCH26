import test from 'node:test';
import assert from 'node:assert/strict';
import {enquiryEmail} from '../lib/email-message.mjs';
const configs={resend:{settings:{from_name:'India Gully',from_email:'hello@indiagully.com',reply_to:'hello@indiagully.com'}},business:{settings:{legal_name:'Vivacious Entertainment and Hospitality Private Limited'}}};
const job={kind:'room_update',recipient:'client@example.com',room_id:'00000000-0000-0000-0000-000000000001',private_report:'CONFIDENTIAL VALUE',other_contacts:['another@example.com']};
test('circulation sends one private dashboard link per recipient and no reports or address list',()=>{
 const email=enquiryEmail(configs,job,'https://portal.example.com');
 assert.deepEqual(email.to,['client@example.com']);assert.equal(email.cc,undefined);assert.equal(email.bcc,undefined);assert.equal(email.attachments,undefined);assert.equal(email.reply_to,'hello@indiagully.com');
 assert.match(email.text,/https:\/\/portal.example.com\/account\/data-rooms\//);assert.doesNotMatch(JSON.stringify(email),/CONFIDENTIAL VALUE|another@example.com/);
});
test('circulation refuses missing or insecure portal addresses',()=>{
 for(const origin of [undefined,'http://portal.example.com','https://portal.example.com/path','https://portal.example.com?secret=1'])assert.throws(()=>enquiryEmail(configs,job,origin));
});

import test from 'node:test';
import assert from 'node:assert/strict';
import jsQR from 'jsqr';
import {PNG} from 'pngjs';
import {rupeesToPaise,validateCollectionInput,safeCollectionUrl,createCollectionLink,fetchCollectionLink,collectionSnapshot,collectionQr,collectionEmail} from '../lib/collection-links.mjs';
import {collectionCard} from '../lib/collection-card.mjs';
import {enquiryEmail} from '../lib/email-message.mjs';
import {mimeMessage} from '../lib/mailbox.mjs';
const row={id:'11111111-1111-4111-8111-111111111111',reference:'IG-COL-20261113-111111111111',created_by:'22222222-2222-4222-8222-222222222222',collector_name:'Arun Manikonda',collector_email:'akm@indiagully.com',practice:'horeca',customer_name:'Example Client',customer_email:'client@example.invalid',invoice_ref:'QUOTE-001 / advance',description:'Advance against the approved crockery supply quotation',amount_paise:2500050,amount_paid:0,mode:'test',status:'active',short_url:'https://rzp.io/i/CollectionFixture',expires_at:'2030-01-20T18:29:59.000Z'};
const config={mode:'test',settings:{key_id:'rzp_test_fake',max_payment_paise:1000000000},secrets:{key_secret:'mock-only'}};
const provider={id:'plink_Fixture',reference_id:row.id,amount:row.amount_paise,amount_paid:0,currency:'INR',accept_partial:false,customer:{name:row.customer_name,email:row.customer_email},expire_by:Math.floor(Date.parse(row.expires_at)/1000),short_url:row.short_url,status:'created'};
const configs={resend:{settings:{from_name:'India Gully',from_email:'hello@indiagully.com',reply_to:'hello@indiagully.com'}},business:{settings:{legal_name:'Vivacious Entertainment and Hospitality Private Limited'}}};
function decode(buffer){const p=PNG.sync.read(buffer);return jsQR(new Uint8ClampedArray(p.data),p.width,p.height)?.data;}
test('Staff amounts preserve paise exactly and reject rounding, exponents and invalid bounds',()=>{
 assert.equal(rupeesToPaise('25000.50'),2500050);assert.equal(rupeesToPaise('1.01'),101);assert.equal(rupeesToPaise('10000000'),1000000000);
 for(const value of ['0','0.99','1.001','1e5','-100','NaN','1,000','10000000.01',''])assert.throws(()=>rupeesToPaise(value));
});
test('Collection input requires a reviewed recipient, purpose and finite expiry',()=>{
 const p={request_id:row.id,confirmed:true,practice:'horeca',amount:'25000.50',invoice_ref:row.invoice_ref,description:row.description,customer_name:row.customer_name,customer_email:row.customer_email,expires_at:row.expires_at};
 const now=Date.parse('2030-01-01');assert.equal(validateCollectionInput(p,now).amount_paise,2500050);
 for(const change of [{confirmed:false},{customer_email:'a@b.com,c@d.com'},{customer_email:'a@b.com\nBcc:x@y.com'},{expires_at:'invalid'},{expires_at:'2031-01-01'},{invoice_ref:'A\nB'},{description:'short'},{contact_id:'untrusted'},{request_id:'random'}])assert.throws(()=>validateCollectionInput({...p,...change},now));
});
test('Provider creation carries immutable staff attribution, full amount, and no automatic notifications',async()=>{
 let body,calls=0;await createCollectionLink(config,row,async(url,options)=>{calls++;assert.equal(url,'https://api.razorpay.com/v1/payment_links');assert.equal(options.method,'POST');body=JSON.parse(options.body);return {ok:true,json:async()=>provider};});
 assert.equal(calls,1);assert.equal(body.amount,2500050);assert.equal(body.currency,'INR');assert.equal(body.accept_partial,false);assert.deepEqual(body.notify,{sms:false,email:false});assert.equal(body.reminder_enable,false);assert.equal(body.reference_id,row.id);assert.equal(body.notes.collector_id,row.created_by);assert.equal(body.notes.collector_name,row.collector_name);assert.equal(body.notes.india_gully_reference,row.reference);
 let failedCalls=0;await assert.rejects(()=>createCollectionLink(config,row,async()=>{failedCalls++;throw Error('timed out');}));assert.equal(failedCalls,1);
 await assert.rejects(()=>createCollectionLink({...config,settings:{...config.settings,max_payment_paise:100}},row));
});
test('Uncertain creation is reconciled by the existing unique reference without another POST',async()=>{
 const found=await fetchCollectionLink(config,row,async(url,options)=>{assert.equal(options.method,'GET');assert.match(url,/reference_id=11111111/);return {ok:true,json:async()=>({payment_links:[provider]})};});assert.equal(found.id,provider.id);
 for(const links of [[],[provider,provider],[{...provider,reference_id:'different'}]])await assert.rejects(()=>fetchCollectionLink(config,row,async()=>({ok:true,json:async()=>({payment_links:links})})));
});
test('Provider snapshots refuse recipient, amount, link and identity mismatches',()=>{
 assert.equal(collectionSnapshot(provider,row).provider_status,'created');
 for(const change of [{reference_id:'different'},{amount:1},{amount_paid:-1},{status:'paid'},{currency:'USD'},{accept_partial:true},{customer:{email:'other@example.com'}},{expire_by:1},{short_url:'https://rzp.io.evil.test/i/abc'},{short_url:'http://rzp.io/i/abc'},{id:'not-link'}])assert.throws(()=>collectionSnapshot({...provider,...change},row));
 assert.equal(collectionSnapshot({...provider,status:'paid',amount_paid:row.amount_paise},row).amount_paid,row.amount_paise);
 for(const url of ['https://evil.test/pay','https://rzp.io@evil.test','https://user@rzp.io/i/abc','https://rzp.io:8080/i/abc','javascript:alert(1)'])assert.throws(()=>safeCollectionUrl(url));
});
test('Raw and branded QR cards decode to the exact fixed-amount checkout URL',async()=>{
 assert.equal(decode(await collectionQr(row.short_url)),row.short_url);
 const card=await collectionCard(row);assert.equal(decode(card),row.short_url);assert.equal(PNG.sync.read(card).width,760);
});
test('Payment emails identify staff and legal payee, escape visitor text and carry a scannable QR',async()=>{
 const email=await collectionEmail(configs,{recipient:row.customer_email,collection:{...row,customer_name:'Client <img src=x onerror=alert(1)>'}});
 assert.deepEqual(email.to,[row.customer_email]);assert.equal(email.reply_to,'akm@indiagully.com');assert.match(email.text,/Arun Manikonda has sent you a payment request for ₹25,000.50/);assert.match(email.text,/M\/s Vivacious Entertainment and Hospitality Private Limited/);assert.match(email.text,/IG-COL-20261113-111111111111/);assert.match(email.html,/Celebrating Desiness/);assert.doesNotMatch(email.html,/<img src=x/);assert.match(email.html,/&lt;img src=x/);assert.equal(decode(Buffer.from(email.attachments[0].content,'base64')),row.short_url);assert.ok(JSON.stringify(email).length<50000);assert.match(email.html,/border:2px solid #b99b43/);assert.ok(email.html.includes('src="cid:'+email.attachments[0].content_id+'"'));assert.match(email.html,/Complete secure payment/);
 await assert.rejects(()=>collectionEmail(configs,{recipient:'wrong@example.com',collection:row}));await assert.rejects(()=>collectionEmail(configs,{recipient:row.customer_email,collection:{...row,status:'paid'}}));
});
test('Enquiry and employee notifications share the brand and preserve the full reference',()=>{
 const enquiry={id:row.id,name:'Client <script>bad</script>',email:row.customer_email,practice:'horeca',message:'Please call <b>today</b>'};
 for(const kind of ['internal','acknowledgement']){const email=enquiryEmail(configs,{kind,recipient:'akm@indiagully.com',enquiry},'https://indiagully.com');assert.match(email.html,/Celebrating Desiness/);assert.match(email.text,new RegExp(row.id));assert.doesNotMatch(email.html,/<script>/);if(kind==='internal')assert.match(email.text,/Hello Arun,/);}
});
test('Business mailbox retains authored text and adds a branded HTML alternative',()=>{
 const text='Hello Client,\nYour quotation is ready. <script>not html</script>';
 const mime=Buffer.from(mimeMessage('akm@indiagully.com',{to:row.customer_email,subject:'Your quotation',text},row.id),'base64url').toString();assert.match(mime,/multipart\/alternative/);assert.match(mime,/Content-Type: text\/html/);
 const sections=mime.split('Content-Transfer-Encoding: base64\r\n\r\n').slice(1).map(s=>Buffer.from(s.split('\r\n--')[0].replaceAll('\r\n',''),'base64').toString());assert.ok(sections[0].startsWith(text));assert.match(sections[1],/Celebrating Desiness/);assert.doesNotMatch(sections[1],/<script>/);
});

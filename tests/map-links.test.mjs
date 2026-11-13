import test from 'node:test';import assert from 'node:assert/strict';
import {resolveMapLink,expandIntakeMap} from '../lib/map-links.mjs';
test('Google map share redirects preserve exact supplied coordinates',async()=>{
 const result=await resolveMapLink('https://maps.app.goo.gl/Test',async()=>new Response(null,{status:302,headers:{location:'https://www.google.com/maps/place/example/@28.5,77.2,16z'}}));
 assert.equal(result.latitude,'28.5');assert.equal(result.longitude,'77.2');
});
test('Map resolver refuses private hosts, credentials, unrelated Google paths and unsafe redirects',async()=>{
 for(const url of ['http://maps.app.goo.gl/Test','https://127.0.0.1/maps','https://user:secret@maps.google.com/maps','https://www.google.com/url?q=test','https://goo.gl/notmaps'])await assert.rejects(()=>resolveMapLink(url));
 await assert.rejects(()=>resolveMapLink('https://maps.app.goo.gl/Test',async()=>new Response(null,{status:302,headers:{location:'https://evil.example/maps/@1.2,3.4'}})));
});
test('Ambiguous or failed map resolution leaves source facts unchanged',async()=>{
 const context={kind:'opportunity',text:'https://maps.app.goo.gl/Test'};
 const result=await expandIntakeMap(context,async()=>new Response('not a pin'));assert.equal(result.context,context);assert.equal(result.notes.length,1);
});

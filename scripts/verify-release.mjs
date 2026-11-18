import assert from 'node:assert/strict';

// Read-only production smoke. Never submits a form, starts AI work or sends mail.
const base=new URL(process.argv[2]||'https://indiagully.com');
assert.equal(base.protocol,'https:');
const checks=[];
async function get(path){
  const response=await fetch(new URL(path,base),{redirect:'manual',signal:AbortSignal.timeout(30000)});
  return response;
}
for(const path of ['/','/opportunities','/retail-leasing','/horeca','/insights','/privacy','/terms','/data-usage']){
  const response=await get(path);assert.equal(response.status,200,path);
  const html=await response.text(),policy=response.headers.get('content-security-policy')||'';
  const nonce=policy.match(/'nonce-([^']+)'/)?.[1];assert.ok(nonce,path+' CSP nonce');
  assert.ok(policy.includes("'strict-dynamic'"),path+' script policy');
  assert.ok(!policy.includes("script-src 'self' 'unsafe-inline'"));
  for(const script of html.matchAll(/<script\b([^>]*)>/g)){
    assert.ok(script[1].includes(`nonce="${nonce}"`),path+' script nonce');
  }
  const canonical=html.match(/<link\b[^>]*rel="canonical"[^>]*href="([^"]+)"/)?.[1];
  assert.ok(canonical,path+' canonical');assert.equal(new URL(canonical).pathname,path);
  assert.equal(new URL(canonical).origin,base.origin,path+' canonical origin');
  checks.push({path,status:response.status,nonce:true,canonical});
}
const catalogue=await (await get('/api/horeca/catalogue?offset=0')).json();
const category=Object.entries(catalogue.counts).sort((a,b)=>b[1]-a[1])[0]?.[0];
assert.ok(category,'Published catalogue category');
const page1=await (await get('/api/horeca/catalogue?category='+encodeURIComponent(category)+'&offset=0')).json();
const page2=await (await get('/api/horeca/catalogue?category='+encodeURIComponent(category)+'&offset=24')).json();
assert.ok(Array.isArray(page1.items)&&page1.items.length>0&&page1.items.length<=24);
assert.ok(Array.isArray(page2.items)&&page2.items.length<=24);
assert.equal(page1.total,page2.total);
assert.ok(page2.items.every(p=>!page1.items.some(q=>q.id===p.id)),'No duplicate pagination');
checks.push({path:'/api/horeca/catalogue',total:page1.total,first:page1.items.length,second:page2.items.length});
const invalid=await get('/api/horeca/catalogue?offset=-1');assert.equal(invalid.status,400);
const chat=await get('/api/gullu');assert.equal(chat.status,200);assert.equal((await chat.json()).session,null);
checks.push({path:'/api/gullu',anonymousSession:null});
console.log(JSON.stringify({checkedAt:new Date().toISOString(),base:base.origin,checks},null,2));

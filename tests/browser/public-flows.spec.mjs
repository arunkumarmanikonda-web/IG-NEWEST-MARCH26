import {test,expect} from '@playwright/test';

test('public pages hydrate under CSP and legal pages have canonicals',async({page})=>{
  const violations=[];
  page.on('console',m=>{if(/Content Security Policy|Refused to execute/i.test(m.text()))violations.push(m.text());});
  for(const path of ['/','/retail-leasing','/privacy','/terms','/data-usage']){
    const r=await page.goto(path);expect(r.status()).toBe(200);
    const policy=r.headers()['content-security-policy'];expect(policy).toContain("'strict-dynamic'");
    const nonce=policy.match(/'nonce-([^']+)'/)[1];
    const inline=await page.locator('script:not([src])').evaluateAll(s=>s.map(x=>x.nonce));
    expect(inline.every(n=>n===nonce)).toBe(true);
    const canonical=new URL(await page.locator('link[rel="canonical"]').getAttribute('href'));
    expect(canonical.pathname).toBe(path);
    expect(canonical.protocol).toBe('https:');
  }
  expect(violations).toEqual([]);
});

test('HORECA category results page correctly and preserve SKU search',async({page})=>{
  const rows=Array.from({length:40},(_,i)=>({id:'sku-'+i,slug:'fixture-'+i,title:'Fixture Knife '+String(i).padStart(2,'0'),summary:'A synthetic browser-test product.',tags:[],public_data:{sku:'QA-'+i,brand:'Fixture',category:'Cutlery',reference:'MODEL-'+i}}));
  await page.route('**/api/horeca/catalogue?*',async route=>{
    const q=new URL(route.request().url()).searchParams;
    const found=rows.filter(p=>!q.get('query')||p.public_data.reference===q.get('query'));
    await route.fulfill({json:{items:found.slice(Number(q.get('offset')),Number(q.get('offset'))+24),total:found.length,counts:{cutlery:40},brands:['Fixture'],types:['Knives'],revision:'test'}});
  });
  await page.route('**/api/horeca/priorities?*',route=>route.fulfill({json:{}}));
  await page.goto('/horeca?category=cutlery');
  await expect(page.locator('.sku-grid article')).toHaveCount(24);
  await page.getByRole('button',{name:/Show more SKUs/}).click();
  await expect(page.locator('.sku-grid article')).toHaveCount(40);
  await page.getByRole('searchbox').fill('MODEL-37');
  await expect(page.locator('.sku-grid article')).toHaveCount(1);
  await expect(page.locator('.sku-grid')).toContainText('QA-37');
});

test('Gullu resumes after a page reload and ends the session explicitly',async({page})=>{
  let ended=false;
  const turn={turn_id:'synthetic-turn',question:'Hotel supplies chahiye',answer:'Bilkul. Aap kis project ke liye dekh rahe hain?',sources:[],practice_interest:'General enquiry'};
  await page.route('**/api/gullu',async route=>{
    if(route.request().method()==='POST'){
      expect(route.request().postDataJSON().action).toBe('end');ended=true;return route.fulfill({json:{ended:true}});
    }
    return route.fulfill({json:{session:ended?null:{session_id:'synthetic-session',firstName:'Guest',messages:[turn],hasMore:false}}});
  });
  await page.goto('/');
  await page.getByRole('button',{name:'Ask Gullu',exact:true}).click();
  await expect(page.locator('.g-log')).toContainText(turn.question);
  await page.reload();
  await page.getByRole('button',{name:'Ask Gullu',exact:true}).click();
  await expect(page.locator('.g-log')).toContainText(turn.answer);
  await page.getByRole('button',{name:'End chat',exact:true}).click();
  await expect(page.getByLabel('Your name',{exact:true})).toBeVisible();
  expect(ended).toBe(true);
});

test('a complete procurement draft survives reload and points sign-in back to its basket',async({page})=>{
 await page.route('**/api/portal/action',route=>route.fulfill({status:401,json:{error:'Sign in required'}}));
 await page.goto('/horeca#quotation-basket');
 const form=page.locator('#quotation-basket');
 await form.getByRole('button',{name:'+ Add a custom requirement'}).click();
 await form.getByLabel('Requirement 1',{exact:true}).fill('Opening linen, specification to follow');
 await form.getByLabel('Quantity 1',{exact:true}).fill('25');
 await form.getByLabel('Request title',{exact:true}).fill('Kochi hotel opening');
 await form.getByLabel('Required delivery',{exact:true}).fill('2026-12-20');
 await form.getByLabel('Delivery destination',{exact:true}).fill('Kochi, 682001');
 await form.getByLabel('Specifications and notes',{exact:true}).fill('Samples before final approval');
 await page.reload();
 await expect(form.getByLabel('Request title',{exact:true})).toHaveValue('Kochi hotel opening');
 await expect(form.getByLabel('Delivery destination',{exact:true})).toHaveValue('Kochi, 682001');
 await expect(form.getByLabel('Required delivery',{exact:true})).toHaveValue('2026-12-20');
 await expect(form.getByLabel('Specifications and notes',{exact:true})).toHaveValue('Samples before final approval');
 await expect(form.getByLabel('Quantity 1',{exact:true})).toHaveValue('25');
 await expect(form.getByRole('link',{name:'Sign in and continue →'})).toHaveAttribute('href','/login?next=%2Fhoreca%23quotation-basket');
 await expect(form.getByRole('button',{name:'Submit quotation request',exact:true})).toHaveCount(0);
});

test('public journeys reflow at 320 CSS pixels and Gullu remains keyboard dismissible',async({page})=>{
 await page.setViewportSize({width:320,height:800});
 await page.emulateMedia({reducedMotion:'reduce'});
 for(const path of ['/','/horeca','/retail-leasing','/shortlist','/contact']){
  await page.goto(path);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),path).toBe(true);
 }
 await page.route('**/api/gullu',route=>route.fulfill({json:{session:null}}));
 await page.getByRole('button',{name:'Ask Gullu',exact:true}).click();
 await expect(page.getByRole('dialog',{name:'Gullu'})).toBeVisible();
 await page.keyboard.press('Escape');
 await expect(page.getByRole('dialog',{name:'Gullu'})).toHaveCount(0);
 await expect(page.getByRole('button',{name:'Ask Gullu',exact:true})).toBeFocused();
});

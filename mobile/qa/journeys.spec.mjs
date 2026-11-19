import {test,expect} from '@playwright/test';
import {readFile,mkdir,writeFile,access} from 'node:fs/promises';
import {resolve} from 'node:path';
const feed=JSON.parse(await readFile(new URL('./fixtures/public-catalogue.json',import.meta.url),'utf8'));
const feedPath='**/api/mobile/catalogue';
async function ready(page, data=feed){
 const localImages=new Map();
 for(const entry of [...data.listings,...data.products,...data.categories]){
  const image=entry.image;
  if(typeof image==='string' && image.startsWith('/images/') && !image.includes('..')){
   const path=resolve('public'+image);
   if(await access(path).then(()=>true,()=>false))localImages.set(`https://indiagully.com${image}`,path);
  }
 }
 // Use the repository's original published image bytes when available; this
 // removes network timing from layout review without substituting mock artwork.
 await page.route('https://indiagully.com/images/**',route=>{
  const path=localImages.get(route.request().url());
  return path?route.fulfill({path}):route.continue();
 });
 await page.route(feedPath,r=>r.fulfill({json:data}));
 await page.goto('/');
 await expect(page.getByRole('button',{name:`Explore ${data.listings[0].title}`,exact:true})).toBeAttached();
 await expect(page.getByText('Opening the gully…')).toHaveCount(0);
 await page.evaluate(()=>document.fonts.ready);
}
async function frame(page,testInfo,name){
 const dir=resolve('mobile/qa-output/frames',testInfo.project.name);await mkdir(dir,{recursive:true});
 // React Native's modal entrance/exit continues after the element is visible.
 // Let that finite transition settle before documenting the resulting screen.
 await page.waitForTimeout(650);
 await page.evaluate(() => Promise.race([Promise.all(Array.from(document.images).map(i=>i.complete ? Promise.resolve() : new Promise(r=>{i.addEventListener('load',r,{once:true});i.addEventListener('error',r,{once:true});}))), new Promise(r=>setTimeout(r,5000))]));
 await page.screenshot({path:resolve(dir,name+'.png'),animations:'disabled'});
}
test('actual app journeys and review frames',async({page},testInfo)=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await ready(page);await frame(page,testInfo,'01-home');
 await page.getByRole('tab',{name:'Explore',exact:true}).click();
 await frame(page,testInfo,'02-opportunities');
 const first=feed.listings[0];
 await page.getByRole('button',{name:`Explore ${first.title}`,exact:true}).click();
 await expect(page.getByRole('button',{name:'Close details'})).toBeVisible();
 await frame(page,testInfo,'03-property-brief');
 await page.getByRole('button',{name:'Save to shortlist',exact:true}).click();
 await expect(page.getByRole('button',{name:'Remove from shortlist',exact:true})).toBeVisible();
 await page.getByRole('button',{name:'Close details'}).click();
 await page.getByRole('tab',{name:'Saved',exact:true}).click();
 await expect(page.getByText(first.title,{exact:true})).toBeVisible();
 await frame(page,testInfo,'04-saved');
 await page.reload();await page.getByRole('tab',{name:'Saved',exact:true}).click();
 await expect(page.getByText(first.title,{exact:true})).toBeVisible();
 await page.getByRole('tab',{name:'Explore',exact:true}).click();
 await page.getByRole('textbox',{name:'Search properties and leasing mandates'}).fill('no-matches-qa');
 await page.getByRole('tab',{name:'Home',exact:true}).click();
 await page.getByRole('button',{name:'View all →',exact:true}).click();
 await expect(page.getByRole('textbox',{name:'Search properties and leasing mandates'})).toHaveValue('');
 await expect(page.getByText(`${feed.listings.length} published briefs`,{exact:true})).toBeVisible();
 await page.getByRole('tab',{name:'HORECA',exact:true}).click();
 await frame(page,testInfo,'05-horeca-collections');
 const product=feed.products.find(x=>x.sku)||feed.products[0];
 await page.getByRole('textbox',{name:'Search HORECA products by SKU, brand or category'}).fill(product.sku||product.title);
 await expect(page.getByRole('button',{name:`Explore ${product.title}`,exact:true}).first()).toBeVisible();
 await frame(page,testInfo,'06-product-search');
 await page.getByRole('button',{name:`Explore ${product.title}`,exact:true}).first().click();
 await frame(page,testInfo,'07-product-brief');
 await page.getByRole('button',{name:'Close details'}).click();
 await page.getByRole('tab',{name:'More',exact:true}).click();
 await frame(page,testInfo,'08-gullu-and-more');
 const client=page.getByRole('button',{name:'Client workspace, opens secure website',exact:true});
 await client.scrollIntoViewIfNeeded();await frame(page,testInfo,'09-client-workspace-entry');
 const staff=page.getByRole('button',{name:'Staff workspace sign in, opens secure website',exact:true});
 const separated=await page.evaluate(()=>{const c=document.querySelector('[aria-label="Client workspace, opens secure website"]'),s=document.querySelector('[aria-label="Staff workspace sign in, opens secure website"]');return c&&s&&(s.getBoundingClientRect().top-c.getBoundingClientRect().bottom)>300;});
 expect(separated).toBe(true);
 await staff.scrollIntoViewIfNeeded();await frame(page,testInfo,'10-staff-sign-in-separate');
 for(const [button,path] of [[staff,'/login'],[client,'/account']]){
  const requested=page.context().waitForEvent('request',r=>r.url()===`https://indiagully.com${path}`);
  const popupPromise=page.waitForEvent('popup');await button.click();const popup=await popupPromise;
  expect((await requested).url()).toBe(`https://indiagully.com${path}`);await popup.close();
 }
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
 expect(errors).toEqual([]);
 const dir=resolve('mobile/qa-output/frames',testInfo.project.name);
 await writeFile(resolve(dir,'manifest.json'),JSON.stringify({kind:'Actual app web preview, not a native store screenshot',catalogue_date:feed.generated_at,viewport:testInfo.project.use.viewport,commit:process.env.GITHUB_SHA||'local',frames:10},null,2));
});
test('HORECA pagination can reach beyond the previous 100-product cap',async({page})=>{
 const products=Array.from({length:125},(_,i)=>({...feed.products[0],id:`qa-${i}`,title:`Synthetic pagination product ${i}`,sku:`QA${i}`,category:'lighting'}));
 await ready(page,{...feed,products});await page.getByRole('tab',{name:'HORECA',exact:true}).click();
 await page.getByRole('textbox',{name:'Search HORECA products by SKU, brand or category'}).fill('Synthetic pagination');
 await expect(page.getByRole('button',{name:/^Explore Synthetic pagination product/})).toHaveCount(24);
 for(let n=0;n<5;n++)await page.getByRole('button',{name:/Show more products/}).click();
 await expect(page.getByRole('button',{name:/^Explore Synthetic pagination product/})).toHaveCount(125);
 await expect(page.getByRole('button',{name:/Show more products/})).toHaveCount(0);
});
test('a shortlist read error does not overwrite stored data during refresh',async({page})=>{
 await page.addInitScript(()=>{const key='@indiagully/public-shortlist/v1';localStorage.setItem(key,'preserve-this-value');const original=Storage.prototype.getItem;Storage.prototype.getItem=function(k){if(k===key)throw new Error('Synthetic storage read failure');return original.call(this,k);};window.__readStored=()=>original.call(localStorage,key);});
 await ready(page);await page.getByRole('tab',{name:'Saved',exact:true}).click();
 await expect(page.getByText('Your shortlist could not be loaded',{exact:true})).toBeVisible();
 expect(await page.evaluate(()=>window.__readStored())).toBe('preserve-this-value');
});

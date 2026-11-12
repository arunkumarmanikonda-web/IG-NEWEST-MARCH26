import test from 'node:test';import assert from 'node:assert/strict';
import {validateCatalogueResult,extractCataloguePage} from '../lib/brand-catalogue.mjs';
import {slugFromTitle,contentPath} from '../lib/content-routes.mjs';
const product={image_id:'',title:'Dinner plate',reference:'P-27',category:'Crockery',uom:'',summary:'27 cm plate',specifications:'Diameter: 27 cm. Material: porcelain.',evidence:'P-27. Porcelain. 27 cm.',image_box:[100,100,500,500],review_notes:''};
test('catalogue rejects invented image bounds and unsupported or oversized product output',()=>{
 assert.equal(validateCatalogueResult({products:[product],complete:true,notes:''}).products.length,1);
 for(const image_box of [[-1,0,500,500],[100,100,99,200],[0,0,1001,200],[0,1],[0,0,NaN,10]])assert.throws(()=>validateCatalogueResult({products:[{...product,image_box}],complete:true,notes:''}));
 assert.throws(()=>validateCatalogueResult({products:[{...product,evidence:''}],complete:true,notes:''}));
 assert.throws(()=>validateCatalogueResult({products:Array(25).fill(product),complete:true,notes:''}));
 assert.deepEqual(validateCatalogueResult({products:[],complete:true,notes:'Cover page'}).products,[]);
});
test('catalogue extraction uses strict structured output, no retention, and preserves missing facts',async()=>{
 const result={products:[{...product,image_box:[]}],complete:false,notes:'Two codes are unreadable.'};let request;
 const d=await extractCataloguePage({settings:{model:'vision-fixture',max_output_tokens:3000},secrets:{api_key:'fixture'}},{brand:'Test',name:'test.pdf',page:2,text:'source',image:Buffer.from('test')},async(url,options)=>{request=JSON.parse(options.body);return {ok:true,json:async()=>({id:'test',status:'completed',output:[{content:[{type:'output_text',text:JSON.stringify(result)}]}]})};});
 assert.equal(request.store,false);assert.equal(request.text.format.strict,true);assert.equal(d.result.products[0].uom,'');assert.equal(d.result.complete,false);assert.equal(request.input[0].content[1].type,'input_image');
});
test('partial AI responses never become a partial catalogue import',async()=>{
 await assert.rejects(extractCataloguePage({settings:{model:'test',max_output_tokens:100},secrets:{api_key:'test'}},{brand:'Test',page:1,image:Buffer.from('test')},async()=>({ok:true,json:async()=>({status:'incomplete'})})),/No partial products/);
});
test('product URLs use the public catalogue route and title conversion handles punctuation',()=>{
 assert.equal(contentPath({kind:'product',slug:'white-plate'}),'/horeca/products/white-plate');assert.equal(contentPath({kind:'opportunity',slug:'ig-opp-private'}),'/opportunities/ig-opp-private');assert.equal(slugFromTitle('Café · Crockery / Tableware!'),'cafe-crockery-tableware');assert.equal(slugFromTitle('a'.repeat(99)+' -- xyz').endsWith('-'),false);
});

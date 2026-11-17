import test from 'node:test';
import assert from 'node:assert/strict';
import {horecaCategory,categoryDirectory,productType} from '../lib/horeca-categories.mjs';
import {catalogueProduct,catalogueResults} from '../lib/catalogue-results.mjs';
const product=(id,title,category,extra={})=>({id,slug:id,title,summary:'',tags:[],public_data:{category,sku:'IG-'+id,brand:'Brand A',...extra}});
test('supplier lighting subcategories form one directory and explicit categories take precedence',()=>{
 for(const name of ['downlight','Recessed Downlight','Recess Downlight','LED Downlight','Recessed Ceiling Light','Track Light','Globe Light','Pendant Light','Downlighter','Popout Light'])assert.equal(horecaCategory(product('a','Fixture',name)).id,'lighting',name);
 assert.equal(horecaCategory(product('a','Kitchen pendant light','Kitchen Equipment')).id,'kitchen-equipment');
 assert.equal(horecaCategory(product('a','Kitchen pendant light','')).id,'lighting');
 for(const [name,id] of [['Inroom','in-room'],['Cuttlery','cutlery'],['Glass ware','glassware'],['Hollow ware','hollowware'],['Kitchen equipments','kitchen-equipment']])assert.equal(horecaCategory(product('a','Item',name)).id,id);
 assert.equal(horecaCategory(product('a','Unclassified item','')).id,'other');
});
test('category counts include every SKU once and empty practice categories remain available',()=>{
 const rows=[product('1','Lamp','Lighting'),product('2','Lamp variant','Track Light'),product('3','Dinner plate','Crockery')];
 const directory=categoryDirectory(rows);
 assert.equal(directory.find(c=>c.id==='lighting').count,2);
 assert.equal(directory.find(c=>c.id==='crockery').count,1);
 assert.equal(directory.find(c=>c.id==='glassware').count,0);
 assert.equal(directory.reduce((n,c)=>n+c.count,0),3);
 assert.equal(directory.some(c=>c.id==='other'),false);
});
test('SKU filters combine category, brand, product type and exact manufacturer code with priority',()=>{
 const rows=[product('1','Table fork','Cutlery'),product('2','Downlight','Lighting',{reference:'MODEL-991'}),product('3','Pendant light','Lighting',{brand:'Brand B'}),product('4','Track spots','Lighting')];
 const positions=[{content_id:'1',slot:1},{content_id:'4',slot:2}];
 assert.deepEqual(catalogueResults(rows,positions,'','priority',{category:'lighting'}).map(p=>p.id),['4','2','3']);
 assert.deepEqual(catalogueResults(rows,positions,'','name',{category:'lighting',brand:'Brand B',type:'Pendant lights'}).map(p=>p.id),['3']);
 assert.equal(catalogueResults(rows,positions,'MODEL-991','name',{category:'lighting'})[0].id,'2');
 assert.equal(catalogueResults(rows,positions,'MODEL-991','name',{category:'cutlery'}).length,0);
 assert.equal(productType(rows[0]),'Forks');
 assert.equal(catalogueProduct(rows[1]).public_data.reference,'MODEL-991');
 assert.equal(rows[0].id,'1');
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {collectionItems,propertyFacts,propertyStatus} from '../lib/property-collection.mjs';
const items=[{title:'Prism Tower',location:'Gurugram',sector:'Commercial',type:'Lease',description:'Mixed-use',image:'/prism.jpg',contexts:[]},{title:'A hotel',location:'Jaipur',sector:'Hospitality',type:'Investment',description:'Spa and wellness',contexts:['strategic']},{title:'Hill retreat',location:'Kasauli',sector:'Hospitality',type:'Investment',image:'/hill.jpg',description:'Resort',contexts:['strategic']}];
test('Collection combines words across fields and applies all filters',()=>{
 assert.deepEqual(collectionItems(items,{query:'gurugram tower',sector:'Commercial'}).map(x=>x.title),['Prism Tower']);
 assert.deepEqual(collectionItems(items,{sector:'Hospitality',context:'strategic',city:'Jaipur'}).map(x=>x.title),['A hotel']);
 assert.equal(collectionItems(items,{query:'unmatched'}).length,0);
});
test('Sorting does not mutate the CMS source ordering',()=>{
 assert.deepEqual(collectionItems(items,{sort:'title'}).map(x=>x.title),['A hotel','Hill retreat','Prism Tower']);
 assert.deepEqual(collectionItems(items),items);
 assert.deepEqual(collectionItems(items,{sort:'featured'}).map(x=>x.title),['Prism Tower','A hotel','Hill retreat']);
 const newestFirst=[items[1],items[0],items[2]];
 assert.deepEqual(collectionItems(newestFirst,{sort:''}),newestFirst);
 assert.equal(collectionItems(newestFirst,{sector:'Hospitality'})[0],items[1]);
 assert.equal(items[1].title,'A hotel');
});
test('Historical reference never implies current availability and unknown facts stay absent',()=>{
 assert.equal(propertyStatus({reference:'Portfolio reference',availability:'Available'}),'Portfolio reference');
 assert.equal(propertyStatus({}),'Availability on enquiry');
 assert.deepEqual(propertyFacts({}),[]);
 assert.deepEqual(propertyFacts({area:'1200',areaUnit:'sq ft',keys:12}),[['Area','1200 sq ft'],['Keys',12]]);
});

test('Campaigns respect filters and explicit chronological sorting',()=>{
 const cards = [{...items[0],feature:{slot:2}},items[1],{...items[2],feature:{slot:1}}];
 assert.deepEqual(collectionItems(cards,{sort:'featured'}).map(x=>x.title),['Hill retreat','Prism Tower','A hotel']);
 assert.deepEqual(collectionItems(cards,{sort:'featured',sector:'Commercial'}).map(x=>x.title),['Prism Tower']);
 assert.deepEqual(collectionItems(cards,{sort:'newest'}),cards);
});

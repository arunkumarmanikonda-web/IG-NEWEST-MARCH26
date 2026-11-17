import test from 'node:test';
import assert from 'node:assert/strict';
import {horecaCollectionDefaults,collectionDirectory} from '../lib/horeca-collections.mjs';
import {validateSection} from '../lib/site-editorial.mjs';

test('CMS collection edits preserve category identity and approved image paths',()=>{
  const config=structuredClone(horecaCollectionDefaults);
  config.collections.reverse();
  config.collections.find(c=>c.id==='lighting').title='Lighting collection';
  assert.equal(validateSection('horeca-collections',config),config);
  const missing=structuredClone(config);missing.collections.pop();
  assert.throws(()=>validateSection('horeca-collections',missing),/each standard/);
  const duplicate=structuredClone(config);duplicate.collections[0].id=duplicate.collections[1].id;
  assert.throws(()=>validateSection('horeca-collections',duplicate),/each standard/);
  const external=structuredClone(config);external.collections[0].image='https://example.com/photo.jpg';
  assert.throws(()=>validateSection('horeca-collections',external),/website image path/);
});

test('editorial titles and ordering retain accurate SKU category counts',()=>{
  const config=structuredClone(horecaCollectionDefaults);
  config.collections.reverse();config.collections.find(c=>c.id==='lighting').title='Lighting collection';
  const products=[{title:'A',public_data:{category:'Track Light'}},{title:'B',public_data:{category:'Lighting'}}];
  const directory=collectionDirectory(products,config);
  assert.equal(directory.length,12);
  assert.equal(directory.at(-1).id,'lighting');
  assert.equal(directory.at(-1).title,'Lighting collection');
  assert.equal(directory.at(-1).count,2);
  assert.equal(directory.find(c=>c.id==='crockery').count,0);
  assert.equal(directory.some(c=>c.id==='other'),false);
});

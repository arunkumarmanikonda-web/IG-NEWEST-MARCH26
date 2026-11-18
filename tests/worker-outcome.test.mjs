import {test} from 'node:test';
import assert from 'node:assert/strict';
import {workerNeedsAttention,workerIsIdle} from '../lib/worker-outcome.mjs';

test('partial delivery failures and held jobs cannot produce a green worker outcome',()=>{
  for(const result of [{sent:3,failed:1},{accepted:1,failed:2},{checked:4,pending_review:1},{status:'held'},{status:'unknown'},{status:'failed'}])assert.equal(workerNeedsAttention(result),true);
  for(const result of [undefined,{sent:0,disabled:true},{sent:3,failed:0},{checked:2,pending_review:0},{status:'published'}])assert.equal(workerNeedsAttention(result),false);
});
test('an idle queue does not clear a recorded processing failure',()=>{
  for(const result of [undefined,{sent:0,disabled:true},{accepted:0},{processed:0},{checked:0,pending_review:0}])assert.equal(workerIsIdle(result),true);
  for(const result of [{sent:0,failed:1},{status:'held'},{status:'published'},{processed:1},{checked:2}])assert.equal(workerIsIdle(result),false);
});

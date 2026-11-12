import 'server-only';
import {cache} from 'react';
import {cmsConfigured} from './cms';
import {anonymousServerClient} from './runtime-config';
import {initialPolicies,initialPolicyVersion} from './legal-content.mjs';
export const currentPolicies=cache(async()=>{
  if(!cmsConfigured())return {version:initialPolicyVersion,documents:initialPolicies,legal_reviewed:false};
  const {data,error}=await anonymousServerClient().from('ig_policy_releases').select('*').eq('current',true).maybeSingle();
  if(error)throw new Error('Current legal policies unavailable');return data;
});

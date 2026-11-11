// Stable IDs, editable labels. Persistence and mutation endpoints are not yet connected.
export const opportunityContexts=[
{id:'strategic-investment',label:'Strategic investment'},
{id:'cirp',label:'CIRP',requiresEvidence:true},
{id:'distressed',label:'Distressed asset',requiresEvidence:true},
{id:'special-situation',label:'Special situation',requiresEvidence:true},
{id:'turnaround',label:'Turnaround / repositioning'},
{id:'income-producing',label:'Income-producing asset'},
{id:'development',label:'Development opportunity'},
{id:'growth-capital',label:'Growth capital'},
{id:'refinancing',label:'Refinancing'},
{id:'joint-venture',label:'Joint venture / JDA'}
];
export const taxonomyDimensions=['asset-class','transaction-type','opportunity-context','location','sector','lifecycle'];
export function validateTaxonomyChange({action,term,replacementId,referencedCount=0,allIds=[]}){
if(!['create','rename','retire','delete','merge'].includes(action))return {valid:false,reason:'Unknown action'};
if(!term||typeof term.id!=='string'||!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(term.id)||!taxonomyDimensions.includes(term.dimension))return {valid:false,reason:'Invalid term'};
if(typeof term.label!=='string'||!term.label.trim()||term.label.length>80)return {valid:false,reason:'Invalid label'};
if(!Number.isInteger(referencedCount)||referencedCount<0)return {valid:false,reason:'Invalid reference count'};
if(action==='create'&&allIds.includes(term.id))return {valid:false,reason:'ID already exists'};
if(action!=='create'&&!allIds.includes(term.id))return {valid:false,reason:'Term does not exist'};
if(action==='merge'&&(!replacementId||replacementId===term.id||!allIds.includes(replacementId)))return {valid:false,reason:'A distinct existing replacement is required'};
if(action==='delete'&&referencedCount>0)return {valid:false,reason:'Merge or remove references before deletion'};
return {valid:true};
}

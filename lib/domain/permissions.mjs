// Pure permission policy, not authentication. Identity and grants must come from server verification.
export const permissions=Object.freeze({
owner:['content.read','content.write','content.publish','content.archive','taxonomy.manage','users.manage','roles.manage','enquiries.read','enquiries.assign','products.write','opportunities.write','campaigns.prepare','campaigns.activate','automation.configure','audit.read'],
administrator:['content.read','content.write','content.publish','content.archive','taxonomy.manage','users.manage','enquiries.read','enquiries.assign','products.write','opportunities.write','campaigns.prepare','audit.read'],
publisher:['content.read','content.write','content.publish','content.archive','taxonomy.manage'],
editor:['content.read','content.write'],
property_manager:['content.read','opportunities.write'],
procurement_manager:['content.read','products.write'],
marketing_manager:['content.read','content.write','campaigns.prepare'],
sales:['content.read','enquiries.read','enquiries.assign'],
auditor:['content.read','audit.read'],client:[],vendor:[]
});
export function can(actor,action){return Boolean(actor?.verified===true&&actor?.status==='active'&&Array.isArray(actor.roles)&&actor.roles.some(role=>Object.hasOwn(permissions,role)&&permissions[role].includes(action)));}
export function canAccessMailbox(actor,mailbox,action){if(actor?.verified!==true||actor.status!=='active'||!['read','draft','send'].includes(action))return false;return mailbox?.connected===true&&Array.isArray(mailbox.grants)&&mailbox.grants.some(g=>g.userId===actor.id&&Array.isArray(g.actions)&&g.actions.includes(action));}
export function validateRoleChange(actor,target,nextRoles,{activeOwnerCount}={}){
if(!can(actor,'users.manage'))return {allowed:false,reason:'User administration permission required'};
if(!Array.isArray(nextRoles)||!nextRoles.length||new Set(nextRoles).size!==nextRoles.length||nextRoles.some(r=>!Object.hasOwn(permissions,r)))return {allowed:false,reason:'Invalid roles'};
const ownerChange=target.roles?.includes('owner')||nextRoles.includes('owner');
if(ownerChange&&!can(actor,'roles.manage'))return {allowed:false,reason:'Owner permission required'};
if(target.roles?.includes('owner')&&!nextRoles.includes('owner')&&(!Number.isInteger(activeOwnerCount)||activeOwnerCount<2))return {allowed:false,reason:'Cannot remove the last active owner'};
return {allowed:true};
}

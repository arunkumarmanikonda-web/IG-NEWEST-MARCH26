// Fail-closed domain gates. Inputs must be read from trusted server-side records.
// These functions do not authenticate, sign an NDA, issue a download link, or send email.
const nonempty=v=>typeof v==='string'&&v.length>0;
export function registrationReady(acceptance,current){
if(!current||!['terms','privacy','dataUse'].every(k=>nonempty(current[k])))return false;
return ['terms','privacy','dataUse'].every(k=>acceptance?.[k]?.accepted===true&&acceptance[k].version===current[k]);
}
export function canReadDossier({user,document,nda,currentPolicies,acceptance,now}){
if(!Number.isFinite(now)||user?.verified!==true||user?.status!=='active'||user?.emailVerified!==true)return false;
if(!registrationReady(acceptance,currentPolicies)||!document||document.published!==true||document.revoked===true)return false;
if(!nonempty(user.id)||!nonempty(document.id)||!nonempty(document.assetId))return false;
if(!Array.isArray(document.allowedUserIds)||!document.allowedUserIds.includes(user.id))return false;
if(document.ndaRequired===false)return document.classification==='registered';
if(document.ndaRequired!==true)return false;
if(document.classification!=='restricted'||!nonempty(document.ndaTemplateHash))return false;
return nda?.status==='completed'&&nda.providerVerified===true&&nda.signerUserId===user.id&&nda.assetId===document.assetId&&nda.templateHash===document.ndaTemplateHash&&nda.revoked!==true&&Number.isFinite(nda.completedAt)&&nda.completedAt<=now&&Number.isFinite(nda.expiresAt)&&nda.expiresAt>now;
}
export function marketingEligible({user,consent,practiceId,campaign,suppression,history,now}){
if(!Number.isFinite(now)||user?.verified!==true||user.status!=='active'||user.emailVerified!==true)return false;
if(consent?.emailMarketing!==true||consent.withdrawn===true||!nonempty(consent.policyVersion)||!Number.isFinite(consent.recordedAt)||consent.recordedAt>now)return false;
if(!nonempty(practiceId)||!Array.isArray(consent.practices)||!consent.practices.includes(practiceId))return false;
if(!suppression||suppression.unsubscribed!==false||suppression.bounced!==false||suppression.complained!==false)return false;
if(campaign?.enabled!==true||campaign.approvedRevision!==campaign.revision||!nonempty(campaign.revision)||!nonempty(campaign.unsubscribeUrl)||!campaign.unsubscribeUrl.startsWith('https://'))return false;
if(!Number.isInteger(campaign.weeklyLimit)||campaign.weeklyLimit<1||!Number.isFinite(campaign.minIntervalMs)||campaign.minIntervalMs<0)return false;
if(!history||!Number.isInteger(history.sentLast7Days)||history.sentLast7Days<0||history.sentLast7Days>=campaign.weeklyLimit)return false;
if(history.lastSentAt!==null&&(!Number.isFinite(history.lastSentAt)||history.lastSentAt>now||now-history.lastSentAt<campaign.minIntervalMs))return false;
return true;
}

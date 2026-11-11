// Delivery plan only. No provider call or persistence occurs here.
import {createHash} from 'node:crypto';
export const ENQUIRY_MAILBOX='hello@indiagully.com';
export const OFFICIAL_PHONE='+918988988988';
export const ENQUIRY_RECIPIENTS=Object.freeze(['akm@indiagully.com','pavan@indiagully.com','amit.jhingan@indiagully.com']);
const emailPattern=/^[^\s@<>\r\n]+@[^\s@<>\r\n]+\.[^\s@<>\r\n]+$/;
function text(value,name,max){if(typeof value!=='string'||!value.trim()||value.length>max)throw new Error('Invalid '+name);return value.trim();}
export function planEnquiryDelivery(input){
const id=text(input?.id,'enquiry ID',64);if(!/^[a-zA-Z0-9_-]+$/.test(id))throw new Error('Invalid enquiry ID');
const name=text(input.name,'name',100),email=text(input.email,'email',254),message=text(input.message,'message',4000),interest=text(input.interest,'interest',120);
if(!emailPattern.test(email))throw new Error('Invalid email');
const subject='India Gully enquiry: '+interest.replace(/[\r\n]/g,' ');
const body='Enquiry: '+id+'\nName: '+name+'\nEmail: '+email+'\nInterest: '+interest+'\n\n'+message;
const payloadHash=createHash('sha256').update(JSON.stringify({id,name,email,message,interest})).digest('hex');
return {id,payloadHash,notifications:ENQUIRY_RECIPIENTS.map((to,i)=>({kind:'internal',to,from:ENQUIRY_MAILBOX,replyTo:email,subject,text:body,idempotencyKey:'enquiry/'+id+'/internal/'+i})),acknowledgement:{kind:'acknowledgement',to:email,from:ENQUIRY_MAILBOX,replyTo:ENQUIRY_MAILBOX,subject:'India Gully enquiry received: '+id,text:'Thank you for contacting India Gully. Your enquiry reference is '+id+'. Our team will review your message. You can reply to this email or call +91 89889 88988.',idempotencyKey:'enquiry/'+id+'/ack'}};
}

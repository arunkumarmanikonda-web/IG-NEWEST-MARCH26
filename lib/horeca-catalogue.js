import 'server-only';
import {anonymousServerClient} from './runtime-config';
import {cmsConfigured} from './cms';
export async function horecaCatalogue(filters={}){
 if(!cmsConfigured())return {items:[],total:0,counts:{},brands:[],types:[],revision:'unconfigured'};
 const {data,error}=await anonymousServerClient().rpc('ig_horeca_catalogue',{p:filters});
 if(error)throw new Error('Catalogue is temporarily unavailable');return data;
}

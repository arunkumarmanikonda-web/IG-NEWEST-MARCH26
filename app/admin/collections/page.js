import {accountContext} from '../../../lib/supabase/server';
import CollectionsManager from '../collections-manager';
export const metadata={title:'Payment links & collections'};
export default async function CollectionsPage({searchParams}){
 const {client}=await accountContext(),params=await searchParams;
 const [context,items]=await Promise.all([client.rpc('ig_collection_manage',{p:{action:'context'}}),client.rpc('ig_collection_manage',{p:{action:'list'}})]);
 if(context.error||items.error)return <section className="workspace-card"><h2>Payment collections</h2><p role="alert">Collection access is unavailable. An active staff account and practice permissions are required.</p></section>;
 return <CollectionsManager initialContext={context.data} initialItems={items.data} initialPractice={params.practice}/>;
}

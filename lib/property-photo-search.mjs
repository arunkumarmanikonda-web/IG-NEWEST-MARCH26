const ordinary = new Set(('the and for with from near sale investment opportunity acquisition development commercial retail office hospitality heritage resort resorts hotels hotel property project residential mixed use strategic asset distress insolvency resolution plan under in at of by private limited india operations land acres square feet built key keys rooms operating luxury premium completed').split(' '));
const words = value => String(value || '').toLowerCase().normalize('NFKC').match(/[\p{L}\p{N}]+/gu) || [];
const mediaOrigins = new Set(['https://upload.wikimedia.org','https://thumb.wikimedia.org']);
const headers = {'User-Agent':'IndiaGullyPropertyStudio/1.0 (https://indiagully.com/contact)'};

export function propertySearchTerms(record) {
  const fields=record.public_data || {};
  if (fields.confidential) return [];
  const location=new Set(words([fields.city,fields.region,fields.asset_class,fields.sector].join(' ')));
  return [...new Set(words(record.title))].filter(word=>word.length>2 && !ordinary.has(word) && !location.has(word) && !/^\d+$/.test(word)).slice(0,4);
}

export async function findPropertyPhoto(record,fetcher=fetch) {
  const terms=propertySearchTerms(record);
  if (!terms.length) return null;
  const url=new URL('https://commons.wikimedia.org/w/api.php');
  url.search=new URLSearchParams({action:'query',format:'json',formatversion:'2',generator:'search',gsrnamespace:'6',gsrsearch:terms.join(' '),gsrlimit:'12',prop:'imageinfo',iiprop:'url|mime|size|extmetadata',iiurlwidth:'1280',iiextmetadatafilter:'LicenseShortName|Restrictions|AttributionRequired'}).toString();
  const deadline=AbortSignal.timeout(28000);
  const opts={headers,redirect:'error',signal:AbortSignal.any([deadline,AbortSignal.timeout(12000)])};
  const response=await fetcher(url,opts);
  if(!response.ok) return null;
  const pages=(await response.json()).query?.pages || [];
  for(const page of pages.sort((a,b)=>a.index-b.index)){
    const info=page.imageinfo?.[0],meta=info?.extmetadata;
    const license=meta?.LicenseShortName?.value;
    const title=String(page.title||'').replace(/^File:/,'').replace(/\.[^.]+$/,'').replace(/_/g,' ');
    const tokens=words(title);
    if(!terms.every(term=>tokens.includes(term)) || /\b(?:map|logo|plan|drawing|postcard|painting|portrait|engraving)\b/i.test(title)) continue;
    if(!Number.isSafeInteger(page.pageid) || !/^(CC0(?: 1\.0)?|public domain)$/i.test(license||'') || meta.Restrictions?.value || /^true$/i.test(meta.AttributionRequired?.value||'')) continue;
    if(!['image/jpeg','image/png','image/webp'].includes(info.mime) || info.width<640 || info.height<360 || info.width<info.height) continue;
    const original=info.size>0 && info.size<=5000000 ? info.url : null;
    for(const candidate of new Set([original,info.thumburl].filter(Boolean))){
      if(deadline.aborted)return null;
      try{
        const asset=new URL(candidate);
        if(!mediaOrigins.has(asset.origin) || !asset.pathname.startsWith('/wikipedia/commons/') || asset.username || asset.password)continue;
        asset.search='';
        const download=await fetcher(asset,{headers,redirect:'error',signal:AbortSignal.any([deadline,AbortSignal.timeout(10000)])});
        if(!download.ok || !/^image\/(jpeg|png|webp)(;|$)/i.test(download.headers.get('content-type')||'') || Number(download.headers.get('content-length'))>5000000)continue;
        const chunks=[];let size=0;
        for await(const chunk of download.body){size+=chunk.length;if(size>5000000)break;chunks.push(chunk);}
        if(!size || size>5000000)continue;
        return {bytes:Buffer.concat(chunks),title,pageId:page.pageid,rights:license+' · https://commons.wikimedia.org/?curid='+page.pageid};
      }catch{continue;}
    }
  }
  return null;
}

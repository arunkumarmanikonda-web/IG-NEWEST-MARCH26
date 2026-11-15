import {createCanvas, loadImage} from '@napi-rs/canvas';
import {catalogueProductPhoto, labelledCandidate} from './catalogue-media.mjs';

// The renderer reads the existing signed source in ranges. The worker receives
// one bounded page raster, never the supplier's original decoded image buffers.
export async function renderLargeCataloguePage(input, page) {
  const response = await fetch('https://india-gully.vercel.app/api/catalogue-page', {
    method: 'POST', redirect: 'error', cache: 'no-store',
    signal: AbortSignal.timeout(120000),
    headers: {'Content-Type': 'application/json', Authorization: 'Bearer '+process.env.EMAIL_WORKER_SECRET},
    body: JSON.stringify({...input, page})
  });
  if (!response.ok) throw Error('Large catalogue page renderer returned HTTP '+response.status);
  const result = await response.json();
  const artwork = await loadImage(Buffer.from(result.jpeg,'base64'));
  const scale = Math.min(1,1800/Math.max(artwork.width,artwork.height));
  const preview = createCanvas(Math.round(artwork.width*scale),Math.round(artwork.height*scale));
  preview.getContext('2d').drawImage(artwork,0,0,preview.width,preview.height);
  const candidates = [];
  for (const bounds of result.boxes) {
    const box = bounds.map((value,i)=>1000*value/(i%2 ? artwork.height : artwork.width));
    const photo = await catalogueProductPhoto(artwork,box);
    if (!photo) continue;
    const id = 'IMG'+(candidates.length+1);
    candidates.push({id,image:photo.bytes,labelled:await labelledCandidate(photo.bytes,id),source:'Supplier image on the original page'});
  }
  return {artwork,image:Buffer.from(await preview.encode('jpeg',90)),text:result.text,
    page_count:result.page_count,candidates,anchors:[]};
}

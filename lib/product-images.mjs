export function productImageBrief(product,{mode='generate',direction=''}={}){
 const title=String(product?.title||'').trim(),description=[product?.summary,product?.body].filter(Boolean).join(' ').replace(/\s+/g,' ').trim();
 if(title.length<2||description.length<12)throw new Error('Enter the product name and a useful product description before creating an image.');
 if(!['generate','enhance'].includes(mode))throw new Error('Choose image generation or enhancement');
 const purpose=mode==='enhance'?'Professionally retouch the exact product in @source. Preserve its geometry, colour, material, markings, proportions and parts. Improve only lighting, exposure, sharpness and background. Do not add or remove product features.':'Create a realistic catalogue concept of this product, following only the supplied description. Do not invent logos, certifications, extra components or technical features.';
 const finish=' Clean neutral studio background, soft natural shadow, crisp product detail, full product visible, no text overlays or watermarks. ';
 const detail='Product: '+title.slice(0,100)+'. '+description.slice(0,260)+'. ';
 return (purpose+finish+detail+String(direction).trim().slice(0,150)).slice(0,900);
}
export function productImageLabel(job){return job?.input?.product_image_mode==='enhance'?'AI-enhanced product image':'Illustrative AI-generated concept';}

export function catalogueImageCredit(data) {
 // Image provenance belongs in the staff image studio, not customer captions.
 return '';
}

export function productImageAlt(product) {
 const alt=String(product?.public_data?.image_alt||'');
 const cleaned=alt.replace(/^(?:(?:illustrative\s+)?AI[- ](?:assisted|enhanced|improved|generated)\s+(?:product\s+)?(?:image|illustration|concept)|manufacturer(?: model| product)? photograph)\s*(?:[·:|\-]\s*|$)/i,'').trim();
 return cleaned || product?.title || 'Product';
}

export function catalogueSourcePhoto(data) {
 return /^AI-(assisted|enhanced)/.test(data?.image_alt||'') && /^\/images\/catalogue\/[a-z0-9-]+\/[a-z0-9-]+-hd\.webp$/.test(data.image)
  ? data.image.replace(/-hd\.webp$/,'.webp') : '';
}

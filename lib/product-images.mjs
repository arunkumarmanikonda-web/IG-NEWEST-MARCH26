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
 if(!data?.image) return '';
 if(data.image_alt?.startsWith('AI-assisted product illustration')) return 'AI-assisted product illustration';
 if(data.image_alt?.startsWith('AI-enhanced product image')) return 'AI-enhanced product image';
 return data.image.startsWith('/images/generated/') ? 'Illustrative AI-generated concept' : '';
}

export function catalogueSourcePhoto(data) {
 return catalogueImageCredit(data) && /^\/images\/catalogue\/[a-z0-9-]+\/[a-z0-9-]+-hd\.webp$/.test(data.image)
  ? data.image.replace(/-hd\.webp$/,'.webp') : '';
}

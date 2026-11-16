import sharp from 'sharp';

// Source media is padded to a standard canvas. Public property layouts crop
// the photograph itself, leaving the archived review image intact.
export async function propertyPhotoFrame(bytes) {
  const image=sharp(bytes);
  const {width,height}=await image.metadata();
  const {data,info}=await image.trim({background:'#f2f1ea',threshold:8}).jpeg({quality:90}).toBuffer({resolveWithObject:true});
  if(info.width<100 || info.height<100 || (width-info.width<8 && height-info.height<8))return bytes;
  return data;
}

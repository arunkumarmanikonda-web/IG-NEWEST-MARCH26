import {unzipSync} from 'fflate';
export function extractArchive(bytes,mode) {
  if(bytes.length>150_000_000)throw new Error('Archive too large');
  let expanded=0, count=0;
  return unzipSync(new Uint8Array(bytes),{filter:f=>{
    if(++count>10000 || !Number.isSafeInteger(f.originalSize) || f.originalSize<0)throw new Error('Invalid archive');
    const wanted=mode==='text'
      ? /^(word\/(document|footnotes|endnotes|header\d*|footer\d*)\.xml|ppt\/slides\/slide\d+\.xml|xl\/(sharedStrings\.xml|worksheets\/sheet\d+\.xml))$/.test(f.name)
      : /^(word|ppt|xl)\/media\/[^/]+\.(png|jpe?g|webp)$/i.test(f.name)&&f.originalSize<=5_000_000;
    if(wanted)expanded+=f.originalSize;
    if(expanded>(mode==='text'?80_000_000:15_000_000))throw new Error('Expanded archive too large');
    return wanted;
  }});
}

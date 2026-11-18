const decode=b=>new TextDecoder('utf-8',{fatal:true}).decode(b);
const fail=message=>{throw new Error(message);};
// Inspect only bounded directory metadata, never inflate an untrusted archive in Edge.
export async function inspectArchive(name,size,read) {
 const tailStart=Math.max(0,size-65557),tail=await read(tailStart,size-1),view=new DataView(tail.buffer,tail.byteOffset,tail.byteLength);
 let end=-1;
 for(let i=tail.length-22;i>=0;i--)if(view.getUint32(i,true)===0x06054b50&&i+22+view.getUint16(i+20,true)===tail.length){end=i;break;}
 if(end<0)fail('Archive directory is missing or incomplete. Upload the original document.');
 const count=view.getUint16(end+10,true),bytes=view.getUint32(end+12,true),offset=view.getUint32(end+16,true);
 if(view.getUint16(end+4,true)||view.getUint16(end+6,true)||view.getUint16(end+8,true)!==count||count===65535||offset===0xffffffff||bytes===0xffffffff)
  fail('Multipart and ZIP64 archives require specialist review. Upload individual original files.');
 if(count>10000||bytes>2_000_000||offset+bytes>tailStart+end)fail('Archive directory exceeds the safe validation allowance.');
 const directory=bytes?await read(offset,offset+bytes-1):new Uint8Array();const d=new DataView(directory.buffer,directory.byteOffset,directory.byteLength);
 const names=new Set();let at=0,expanded=0;
 for(let i=0;i<count;i++){
  if(at+46>directory.length||d.getUint32(at,true)!==0x02014b50)fail('Malformed archive directory.');
  const flags=d.getUint16(at+8,true),compressed=d.getUint32(at+20,true),original=d.getUint32(at+24,true),n=d.getUint16(at+28,true),extra=d.getUint16(at+30,true),comment=d.getUint16(at+32,true),local=d.getUint32(at+42,true);
  if(at+46+n+extra+comment>directory.length||!n||local>=offset||[compressed,original,local].includes(0xffffffff))fail('Malformed archive entry.');
  const filename=decode(directory.subarray(at+46,at+46+n));const lower=filename.toLowerCase();
  if(flags&1||/^[/\\]|^[a-z]:/i.test(filename)||filename.includes('\\')||filename.split('/').includes('..')||/[\x00-\x1f]/.test(filename)||names.has(lower))fail('Encrypted, duplicated or unsafe archive entries are not accepted.');
  if(/(?:^|\/)(?:vbaproject\.bin|macros|scripts)(?:\/|$)|\.(?:exe|dll|com|scr|msi|bat|cmd|ps1|vbs|js|hta|lnk|jar|docm|xlsm|pptm)$/i.test(filename)||/\/(?:embeddings|activex)\//i.test(filename))fail('Active content or embedded executables require a clean original without macros.');
  expanded+=original;if(expanded>1_000_000_000||original>100_000_000&&original>Math.max(compressed,1)*1000)fail('Archive expansion requires specialist review.');
  names.add(lower);at+=46+n+extra+comment;
 }
 if(at!==directory.length)fail('Unexpected archive directory data.');
 const ext=name.split('.').pop().toLowerCase();
 const roots={docx:'word/document.xml',xlsx:'xl/workbook.xml',pptx:'ppt/presentation.xml'};
 if(roots[ext]&&(!names.has('[content_types].xml')||!names.has('_rels/.rels')||!names.has(roots[ext])))fail('The document package does not match its filename. Save a fresh original in the declared format.');
 if(['ods','odt','odp'].includes(ext)&&(!names.has('mimetype')||!names.has('meta-inf/manifest.xml')||!names.has('content.xml')))fail('This is not a complete OpenDocument package.');
 return true;
}
export async function inspectCompound(name,header,read,size){
 if(header.length<512)fail('Incomplete Office document.');
 const h=new DataView(header.buffer,header.byteOffset,header.byteLength);
 const shift=h.getUint16(30,true),sectorSize=2**shift;
 if(![9,12].includes(shift)||h.getUint16(28,true)!==0xfffe)fail('Invalid Office document structure.');
 const sector=h.getUint32(48,true),start=(sector+1)*sectorSize;
 if(start<sectorSize||start+sectorSize>size)fail('Office directory is outside the uploaded file.');
 const block=await read(start,start+sectorSize-1),v=new DataView(block.buffer,block.byteOffset,block.byteLength);let names=[];
 for(let i=0;i+128<=block.length;i+=128){const len=v.getUint16(i+64,true);if(len>=2&&len<=64)names.push(new TextDecoder('utf-16le').decode(block.subarray(i,i+len-2)));}
 if(names.some(n=>/VBA|_VBA_PROJECT|Macros|ObjectPool/i.test(n)))fail('Remove macros and embedded active content before uploading.');
 const expected={doc:['WordDocument'],xls:['Workbook','Book'],ppt:['PowerPoint Document']};
 if(!expected[name.split('.').pop().toLowerCase()].some(n=>names.includes(n)))fail('Legacy Office format cannot be verified safely. Save as DOCX, XLSX or PPTX and upload that original.');
 return true;
}

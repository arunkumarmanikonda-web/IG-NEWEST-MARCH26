"use client";
import {useState} from "react";
export default function BrandLogoField({value,onChange}){
 const [error,setError]=useState("");
 async function upload(event){
  const file=event.target.files[0];if(!file)return;
  try{
    if(!["image/png","image/jpeg","image/webp"].includes(file.type)||file.size>5000000)throw Error("Choose a PNG, JPEG or WebP up to 5 MB.");
    const bitmap=await createImageBitmap(file);
    try{
      const scale=Math.min(1,260/bitmap.width,96/bitmap.height),canvas=document.createElement("canvas");
      canvas.width=Math.max(1,Math.round(bitmap.width*scale));canvas.height=Math.max(1,Math.round(bitmap.height*scale));
      canvas.getContext("2d").drawImage(bitmap,0,0,canvas.width,canvas.height);
      const image=canvas.toDataURL("image/webp",0.82);
      if(!image.startsWith("data:image/webp;base64,")||image.length>28000)throw Error("Choose a smaller logo or enter its HTTPS image link.");
      onChange(image);setError("");
    }finally{bitmap.close();}
  }catch(e){setError(e.message||"The image could not be read.");}
 }
 return <div>{value&&<img src={value} alt="Current brand logo" width="115" height="48" style={{objectFit:"contain"}}/>}
  <label>Logo file<input type="file" accept="image/png,image/jpeg,image/webp" onChange={upload}/></label>
  <label>Logo path or HTTPS image URL<input type="text" value={value.startsWith("data:")?"":value} onChange={e=>onChange(e.target.value)}/></label>
  {value&&<button type="button" onClick={()=>onChange("")}>Remove logo</button>}
  {error&&<p role="alert">{error}</p>}</div>;
}

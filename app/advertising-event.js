export default function AdvertisingEvent({practice,receipt,proof}) {
  if (process.env.NEXT_PUBLIC_ADVERTISING_INSTALLED!=="true" || !practice) return null;
  const params=new URLSearchParams({event:receipt?"enquiry":"view",practice});
  if (receipt && proof) {params.set("conversion",proof.token);params.set("proof",proof.signature);}
  return <iframe title="Advertising preference check" src={"/api/advertising/event?"+params} hidden referrerPolicy="no-referrer" />;
}

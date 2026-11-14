import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

// Public CMS snapshots may be queried directly. Seal every future revision
// before publication so only the site can release its text when the time arrives.
function key(secret) {
  if (!secret || secret.length < 32) throw new Error("The website publication key is unavailable.");
  return createHash("sha256").update("India Gully website schedules\0").update(secret).digest();
}
const context = (section,version,at) => Buffer.from(JSON.stringify([section,version,at]));
export function scheduledSnapshot(section,version,content,at,current,secret) {
  const iv=randomBytes(12);
  const cipher=createCipheriv("aes-256-gcm",key(secret),iv);
  cipher.setAAD(context(section,version,at));
  const encrypted=Buffer.concat([cipher.update(JSON.stringify(content),"utf8"),cipher.final()]);
  return {format:"scheduled-section-v1",current,version,at,iv:iv.toString("base64"),text:encrypted.toString("base64"),tag:cipher.getAuthTag().toString("base64")};
}

export function effectiveSnapshot(section,version,stored,{draft=false,time=Date.now(),secret}={}) {
  if(stored.format!=="scheduled-section-v1") return {content:stored,version};
  const future=Date.parse(stored.at)>time;
  if(future && !draft) return {...stored.current,scheduled_at:stored.at};
  const decipher=createDecipheriv("aes-256-gcm",key(secret),Buffer.from(stored.iv,"base64"));
  decipher.setAAD(context(section,stored.version,stored.at));
  decipher.setAuthTag(Buffer.from(stored.tag,"base64"));
  const bytes=Buffer.concat([decipher.update(Buffer.from(stored.text,"base64")),decipher.final()]);
  return {content:JSON.parse(bytes.toString("utf8")),version:stored.version,scheduled_at:future?stored.at:null};
}

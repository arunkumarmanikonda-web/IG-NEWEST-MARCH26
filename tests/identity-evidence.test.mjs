import test from "node:test";
import assert from "node:assert/strict";
import { compareEvidence, sameDate } from "../lib/identity-evidence.mjs";
import { listingHeading } from "../lib/listing-heading.mjs";
import { createCanvas } from "@napi-rs/canvas";
import { checkEvidence } from "../lib/identity-ocr.mjs";
test("property titles retain legal initialisms and use consistent case", () => {
  assert.equal(listingHeading("THE HOTEL SITE"), "The Hotel Site");
  assert.equal(
    listingHeading("location and connections"),
    "Location and Connections",
  );
  assert.equal(
    listingHeading("CIRP and the NCLT process"),
    "CIRP and the NCLT Process",
  );
});
test("company review identifies individual mismatches", () => {
  const e = {
    kind: "company",
    legal_name: "Sample Hospitality Ltd",
    signer: "Sample Signer",
    cin: "U12345DL2017PLC123456",
    vital_date: "2017-05-12",
  };
  const a = compareEvidence(
    e,
    "incorporation",
    "Sample Hospitality Ltd · CIN U12345DL2017PLC123456 · 13/05/2017",
  );
  assert.equal(a.status, "review");
  assert.equal(a.fields["Date of incorporation"], false);
  assert.equal(
    compareEvidence(
      e,
      "resolution",
      "Sample Hospitality Ltd resolves to authorise Sample Signer",
    ).status,
    "matched",
  );
  assert(!sameDate("12/05/2018", "2017-05-12"));
});
test("reads visible identity particulars from a synthetic scanned card on first-party OCR", async () => {
  const canvas = createCanvas(1200, 450),
    ctx = canvas.getContext("2d");
  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, 1200, 450);
  ctx.fillStyle = "black";
  ctx.font = "46px sans-serif";
  ["Synthetic Person", "Date of Birth: 12/05/1988", "PAN: ABCDE1234F"].forEach(
    (line, i) => ctx.fillText(line, 44, 96 + i * 90),
  );
  const blob = new Blob([await canvas.encode("png")], { type: "image/png" });
  const r = await checkEvidence(
    {
      legal_name: "Synthetic Person",
      kind: "individual",
      vital_date: "1988-05-12",
      pan: "ABCDE1234F",
    },
    "pan",
    blob,
  );
  assert.equal(r.status, "matched", JSON.stringify(r));
  assert.equal(r.pages_read, 1);
});

test("validates a signed synthetic offline identity against a pinned certificate",async()=>{
  const {execFileSync}=await import("node:child_process");
  const {mkdtempSync,readFileSync,rmSync}=await import("node:fs");
  const {tmpdir}=await import("node:os");
  const {join}=await import("node:path");
  const {SignedXml}=await import("xml-crypto");
  const {offlineProof}=await import("../lib/offline-identity.mjs");
  const dir=mkdtempSync(join(tmpdir(),"identity-signer-"));
  try{
    const key=join(dir,"key"),cert=join(dir,"cert");
    execFileSync("openssl",["req","-new","-x509","-nodes","-newkey","rsa:2048","-keyout",key,"-out",cert,"-days","1","-subj","/CN=Synthetic QA signer"],{stdio:"ignore"});
    const sig=new SignedXml({privateKey:readFileSync(key),signatureAlgorithm:"http://www.w3.org/2001/04/xmldsig-more#rsa-sha256",canonicalizationAlgorithm:"http://www.w3.org/TR/2001/REC-xml-c14n-20010315"});
    sig.addReference({xpath:"/*",transforms:["http://www.w3.org/2000/09/xmldsig#enveloped-signature","http://www.w3.org/TR/2001/REC-xml-c14n-20010315"],digestAlgorithm:"http://www.w3.org/2001/04/xmlenc#sha256"});
    sig.computeSignature('<OfflinePaperlessKyc><UidData><Poi name="Example Person" dob="12-05-1988"/></UidData></OfflinePaperlessKyc>');
    const pem=readFileSync(cert,"utf8"),xml=sig.getSignedXml();
    assert.equal(offlineProof({legal_name:"Example Person",vital_date:"1988-05-12"},xml,pem).status,"matched");
    assert.equal(offlineProof({legal_name:"Another Person",vital_date:"1988-05-12"},xml,pem).status,"review");
    assert.throws(()=>offlineProof({legal_name:"Example Person",vital_date:"1988-05-12"},xml.replace("Example Person","Revised Person"),pem));
  }finally{rmSync(dir,{recursive:true,force:true});}
});

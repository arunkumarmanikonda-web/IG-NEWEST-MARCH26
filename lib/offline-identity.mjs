import { X509Certificate } from "node:crypto";
import { DOMParser } from "@xmldom/xmldom";
import { SignedXml } from "xml-crypto";
import { sameDate } from "./identity-evidence.mjs";

export function offlineProof(entity, xml, pinnedCert) {
  if (!pinnedCert || /<!DOCTYPE|<!ENTITY/i.test(xml))
    throw new Error("Offline identity verification unavailable");
  const cert = new X509Certificate(pinnedCert.replaceAll("\\n", "\n"));
  if (
    Date.now() < Date.parse(cert.validFrom) ||
    Date.now() > Date.parse(cert.validTo)
  )
    throw new Error("An updated signing certificate is required");
  const parse = (value) =>
    new DOMParser().parseFromString(value, "application/xml");
  const document = parse(xml),
    signatures = document.getElementsByTagNameNS(
      "http://www.w3.org/2000/09/xmldsig#",
      "Signature",
    );
  if (
    document.documentElement.tagName !== "OfflinePaperlessKyc" ||
    signatures.length !== 1
  )
    throw new Error("Invalid UIDAI record");
  const verifier = new SignedXml({
    publicCert: cert.toString(),
    getCertFromKeyInfo: () => null,
  });
  verifier.loadSignature(signatures[0]);
  if (!verifier.checkSignature(xml)) throw new Error("Invalid UIDAI signature");
  const refs = verifier.getSignedReferences();
  if (refs.length !== 1) throw new Error("Incomplete signed identity");
  const root = parse(refs[0]).documentElement,
    people = root.getElementsByTagName("Poi");
  if (root.tagName !== "OfflinePaperlessKyc" || people.length !== 1)
    throw new Error("Missing signed particulars");
  const canonical = (s) =>
    s.normalize("NFKC").trim().replace(/\s+/g, " ").toLocaleLowerCase("en-IN");
  const fields = {
    "UIDAI signature": true,
    "Legal name":
      canonical(people[0].getAttribute("name") || "") ===
      canonical(entity.legal_name),
    "Date of birth": sameDate(people[0].getAttribute("dob"), entity.vital_date),
  };
  return {
    fields,
    status: Object.values(fields).every(Boolean) ? "matched" : "review",
  };
}

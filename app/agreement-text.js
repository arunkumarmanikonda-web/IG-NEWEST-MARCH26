// Preserve the stored wording for legacy agreements and immutable receipts.
export default function AgreementText({ text, wide = false }) {
  return (
    <div className={wide ? "agreement-document wide" : "agreement-document"}>
      {(text || "").split(/\n\s*\n/).map((block, index) => {
        const [first, ...rest] = block.split("\n");
        if (/^\d+\.\s+\S/.test(first) && rest.length) {
          return <section key={index}><h4>{first}</h4><p>{rest.join("\n")}</p></section>;
        }
        return <p key={index}>{block}</p>;
      })}
    </div>
  );
}

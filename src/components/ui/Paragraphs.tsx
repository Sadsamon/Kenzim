export default function Paragraphs({ text, className = "" }: { text: string; className?: string }) {
  const parts = text.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  return (
    <div className={`space-y-3 ${className}`}>
      {parts.map((p, i) => (
        <p key={i} className="whitespace-pre-line text-[17px] leading-relaxed">{p}</p>
      ))}
    </div>
  );
}

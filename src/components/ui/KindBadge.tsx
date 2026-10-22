const kinds = {
  admin: { label: "Kenzim update", tone: "bg-primary text-white" },
  embassy: { label: "Embassy news", tone: "bg-ink text-white" },
  community: { label: "Community", tone: "bg-accent text-ink" },
} as const;

export default function KindBadge({ kind }: { kind: string }) {
  const k = kinds[kind as keyof typeof kinds] ?? kinds.admin;
  return <span className={`rounded-full px-3 py-1 text-[13px] font-semibold ${k.tone}`}>{k.label}</span>;
}

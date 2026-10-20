export default function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-sheet bg-surface p-6 text-center shadow-card">
      <h2 className="text-lg font-bold">{title}</h2>
      <p className="mt-1 text-muted">{body}</p>
    </div>
  );
}

"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

type R = { id: string; name: string; active: boolean };

export default function RetailerManager({ retailers }: { retailers: R[] }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function call(method: string, body: unknown) {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/market/retailers", { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? "Something went wrong.");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    }
    setBusy(false);
  }

  return (
    <section className="rounded-sheet bg-surface p-5 shadow-card">
      <h2 className="mb-3 text-lg font-bold">Shops</h2>
      <ul className="mb-4 divide-y divide-line">
        {retailers.map((r) => (
          <li key={r.id} className="flex items-center justify-between py-2">
            <span className={r.active ? "font-semibold" : "text-muted line-through"}>{r.name}</span>
            <button type="button" disabled={busy} onClick={() => call("PATCH", { id: r.id, active: !r.active })} className="h-11 px-3 text-sm font-semibold text-primary">
              {r.active ? "Hide" : "Show"}
            </button>
          </li>
        ))}
      </ul>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const form = e.currentTarget;
          const name = String(new FormData(form).get("name") ?? "");
          call("POST", { name }).then(() => form.reset());
        }}
        className="flex gap-3"
      >
        <input name="name" placeholder="New shop name" maxLength={60} className="h-[52px] w-full rounded-[14px] border border-line bg-surface px-4 text-base outline-none focus:border-primary" />
        <button disabled={busy} className="h-[52px] shrink-0 rounded-[14px] bg-ink px-5 font-semibold text-white">Add</button>
      </form>
      {error && <p role="alert" className="mt-2 text-sm font-medium text-primary-dark">{error}</p>}
    </section>
  );
}

"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

type Role = { key: string; name: string; held: boolean };

export default function MemberControls({
  memberId, isSelf, trusted, suspended, canSuspend, roles,
}: { memberId: string; isSelf: boolean; trusted: boolean; suspended: boolean; canSuspend: boolean; roles: Role[] }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function call(url: string, method: string, body: unknown) {
    setBusy(true);
    setError("");
    try {
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? "Something went wrong.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    }
    setBusy(false);
  }

  return (
    <div className="space-y-4">
      <section className="rounded-sheet bg-surface p-5 shadow-card">
        <h2 className="mb-1 text-lg font-bold">Roles</h2>
        <p className="mb-3 text-sm text-muted">Super Admin can do everything, including download records and assign roles. Give it to as few people as possible.</p>
        <ul className="space-y-2">
          {roles.map((r) => (
            <li key={r.key}>
              <button
                type="button"
                disabled={busy}
                onClick={() => call("/api/admin/roles", "POST", { userId: memberId, roleKey: r.key, action: r.held ? "remove" : "add" })}
                className={`flex h-[52px] w-full items-center justify-between rounded-[14px] border px-4 text-base font-semibold ${r.held ? "border-success bg-success/10 text-success" : "border-line"}`}
              >
                <span>{r.name}</span>
                <span>{r.held ? "Remove" : "Add"}</span>
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-sheet bg-surface p-5 shadow-card">
        <h2 className="mb-1 text-lg font-bold">Trusted badge</h2>
        <p className="mb-3 text-sm text-muted">For long-standing pillars of the community. It gives no extra powers.</p>
        <button
          type="button"
          disabled={busy}
          onClick={() => call(`/api/admin/members/${memberId}`, "PATCH", { trusted: !trusted })}
          className="h-[52px] w-full rounded-[14px] bg-accent font-semibold text-ink"
        >
          {trusted ? "Remove Trusted badge" : "Give Trusted badge"}
        </button>
      </section>

      {canSuspend && !isSelf && (
        <section className="rounded-sheet bg-surface p-5 shadow-card">
          <h2 className="mb-1 text-lg font-bold">Account</h2>
          <button
            type="button"
            disabled={busy}
            onClick={() => call(`/api/admin/members/${memberId}`, "PATCH", { suspended: !suspended })}
            className="h-[52px] w-full rounded-[14px] border border-primary font-semibold text-primary"
          >
            {suspended ? "Lift suspension" : "Suspend this member"}
          </button>
        </section>
      )}
      {error && <p role="alert" className="rounded-card bg-primary/10 p-3 text-sm font-medium text-primary-dark">{error}</p>}
    </div>
  );
}

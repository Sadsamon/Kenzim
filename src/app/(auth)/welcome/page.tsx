"use client";
import { useState } from "react";
import Link from "next/link";

// Placeholder copy: replace with the client's mission and history text.
const steps = [
  { title: "Welcome to Kenzim", body: "One home for the Kenyan community in Zimbabwe: news, events, people and trusted marketplace." },
  { title: "Our mission", body: "To keep our community connected, supported and proud of home, wherever life takes us." },
  { title: "Built on trust", body: "Every member is verified by our admins. Your identity documents are checked, then deleted." },
];

export default function Welcome() {
  const [i, setI] = useState(0);
  const last = i === steps.length - 1;
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col px-4 py-10">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/icons/icon-512.png" alt="Kenzim logo" width={160} height={160} className="mx-auto mt-6 rounded-sheet" />
      <div className="mt-8 flex-1 rounded-sheet bg-surface p-6 shadow-card">
        <h1 className="text-[28px] font-bold leading-tight">{steps[i].title}</h1>
        <p className="mt-3 text-lg text-muted">{steps[i].body}</p>
        <div className="mt-6 flex gap-2" aria-hidden="true">
          {steps.map((_, n) => (
            <span key={n} className={`h-2 rounded-full ${n === i ? "w-6 bg-primary" : "w-2 bg-line"}`} />
          ))}
        </div>
      </div>
      <div className="mt-6 space-y-3">
        {last ? (
          <Link href="/signup" className="flex h-[52px] items-center justify-center rounded-[14px] bg-primary font-semibold text-white active:bg-primary-dark">
            Create account
          </Link>
        ) : (
          <button onClick={() => setI(i + 1)} className="h-[52px] w-full rounded-[14px] bg-primary font-semibold text-white active:bg-primary-dark">
            Next
          </button>
        )}
        <Link href="/login" className="block text-center font-semibold text-primary">
          I already have an account
        </Link>
      </div>
    </main>
  );
}

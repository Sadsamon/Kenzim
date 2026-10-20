import Link from "next/link";
import { Lock } from "lucide-react";
import type { Me } from "@/lib/me";

export default function VerifyGate({ me, feature }: { me: Me; feature: string }) {
  const pending = me.status === "pending";
  return (
    <div className="rounded-sheet bg-surface p-6 text-center shadow-card">
      <Lock className="mx-auto text-primary" size={32} aria-hidden="true" />
      <h2 className="mt-3 text-lg font-bold">
        {pending ? "Verification in progress" : "Verify to unlock"}
      </h2>
      <p className="mt-1 text-muted">
        {pending
          ? `An admin is reviewing your details. The ${feature} opens as soon as you are approved.`
          : `The ${feature} is for verified members. Verification keeps our community safe.`}
      </p>
      {!pending && (
        <Link href="/profile" className="mt-4 inline-block font-semibold text-primary">
          See your profile
        </Link>
      )}
    </div>
  );
}

import SignupForm from "./SignupForm";

export default function SignupPage() {
  return (
    <main className="mx-auto min-h-screen max-w-md px-4 py-10">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/icons/icon-192.png" alt="Kenzim" width={56} height={56} className="rounded-card" />
      <h1 className="mt-4 text-[28px] font-bold leading-tight">Join Kenzim</h1>
      <p className="mb-6 mt-1 text-muted">Create your account. Identity verification comes next.</p>
      <div className="rounded-sheet bg-surface p-5 shadow-card">
        <SignupForm />
      </div>
    </main>
  );
}

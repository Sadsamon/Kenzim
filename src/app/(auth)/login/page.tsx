import LoginForm from "./LoginForm";

export default function LoginPage() {
  return (
    <main className="mx-auto min-h-screen max-w-md px-4 py-10">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/icons/icon-192.png" alt="Kenzim" width={56} height={56} className="rounded-card" />
      <h1 className="mt-4 text-[28px] font-bold leading-tight">Karibu back</h1>
      <p className="mb-6 mt-1 text-muted">Log in to your Kenzim account.</p>
      <div className="rounded-sheet bg-surface p-5 shadow-card">
        <LoginForm />
      </div>
    </main>
  );
}

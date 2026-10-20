type Props = {
  label: string;
  name: string;
  type?: string;
  autoComplete?: string;
  inputMode?: "text" | "email" | "tel";
  error?: string;
  hint?: string;
};

export default function Field({ label, name, type = "text", autoComplete, inputMode, error, hint }: Props) {
  return (
    <div>
      <label htmlFor={name} className="mb-1 block text-[15px] font-semibold">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        autoComplete={autoComplete}
        inputMode={inputMode}
        aria-invalid={!!error}
        className="h-[52px] w-full rounded-[14px] border border-line bg-surface px-4 text-base outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
      />
      {hint && !error && <p className="mt-1 text-sm text-muted">{hint}</p>}
      {error && <p className="mt-1 text-sm font-medium text-primary">{error}</p>}
    </div>
  );
}

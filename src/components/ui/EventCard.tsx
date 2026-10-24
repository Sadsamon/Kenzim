import Link from "next/link";
import { categoryLabel, dayNumber, fmtEventTime, monthShort } from "@/lib/dates";

type Props = {
  id: string;
  title: string;
  category: string;
  startsAt: string;
  location?: string | null;
  going?: number;
  coverUrl?: string | null;
};

export default function EventCard({ id, title, category, startsAt, location, going, coverUrl }: Props) {
  return (
    <Link href={`/events/${id}`} className="flex gap-4 overflow-hidden rounded-sheet bg-surface p-4 shadow-card">
      <div className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-card bg-primary text-white">
        <span className="text-2xl font-bold leading-none">{dayNumber(startsAt)}</span>
        <span className="text-xs font-semibold uppercase tracking-wide">{monthShort(startsAt)}</span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-semibold text-primary">{categoryLabel[category] ?? "Event"}</p>
        <h3 className="text-lg font-bold leading-snug">{title}</h3>
        <p className="text-muted">
          {fmtEventTime(startsAt)}
          {location ? ` · ${location}` : ""}
        </p>
        {typeof going === "number" && going > 0 && <p className="mt-1 text-sm font-semibold text-success">{going} going</p>}
      </div>
      {coverUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={coverUrl} alt="" className="h-16 w-16 shrink-0 rounded-card object-cover" />
      )}
    </Link>
  );
}

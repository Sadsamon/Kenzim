import { redirect } from "next/navigation";

// ID documents are no longer collected in the app.
export default function Page() {
  redirect("/admin/members");
}

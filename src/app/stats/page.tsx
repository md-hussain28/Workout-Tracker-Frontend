import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

/** Stats are now under Analytics → Stats tab. Redirect so old links work. */
export default function StatsPage() {
  redirect("/analytics");
}

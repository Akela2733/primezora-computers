import { redirect } from "next/navigation";

export default function LegacyEmailConfirmedPage() {
  redirect("/login");
}

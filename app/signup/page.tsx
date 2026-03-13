/** Signup redirect — sends visitors to /login with the sign-up tab pre-selected. */
import { redirect } from "next/navigation";

export default function SignUpPage() {
  redirect("/login?tab=sign-up");
}

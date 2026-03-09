/** Forgot-password redirect — sends visitors to /login with the forgot-password view. */
import { redirect } from "next/navigation";

export default function ForgotPasswordPage() {
  redirect("/login?view=forgot-password");
}

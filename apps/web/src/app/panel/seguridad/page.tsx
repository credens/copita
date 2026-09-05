import { currentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ChangePasswordForm } from "./change-password-form";

export default async function SeguridadPage() {
  const user = await currentUser();
  if (!user) redirect("/login");

  return (
    <div className="container" style={{ maxWidth: 480, paddingTop: 40, paddingBottom: 40 }}>
      <h1>Seguridad</h1>
      <p style={{ color: "#55504a" }}>{user.emailVerifiedAt ? "Email verificado ✓" : "Todavía no verificaste tu email."}</p>
      <ChangePasswordForm />
    </div>
  );
}

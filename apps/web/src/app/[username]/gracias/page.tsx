import Link from "next/link";

const COPY: Record<string, { title: string; body: string }> = {
  exitoso: { title: "¡Gracias por tu copita! ☕", body: "El pago se acreditó correctamente. El creador ya puede ver tu apoyo." },
  pendiente: { title: "Tu pago está pendiente", body: "Mercado Pago todavía lo está procesando — te va a llegar la confirmación por email." },
  fallido: { title: "El pago no se pudo completar", body: "Podés intentar de nuevo desde el perfil del creador." },
};

export default async function GraciasPage({ params, searchParams }: { params: Promise<{ username: string }>; searchParams: Promise<{ estado?: string; tipo?: string }> }) {
  const { username } = await params;
  const { estado, tipo } = await searchParams;
  const copy = COPY[estado ?? ""] ?? (tipo === "suscripcion" ? { title: "¡Listo!", body: "Revisá tu email para confirmar la suscripción con Mercado Pago." } : COPY.pendiente);

  return (
    <div className="container" style={{ maxWidth: 480, paddingTop: 64, paddingBottom: 64, textAlign: "center" }}>
      <div className="card">
        <h1>{copy.title}</h1>
        <p>{copy.body}</p>
        <Link href={`/${username}`} className="btn btn-primary">
          Volver al perfil
        </Link>
      </div>
    </div>
  );
}

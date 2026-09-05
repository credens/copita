import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Copita",
  description: "Invitá una copita a tus creadores favoritos.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <header className="site-header">
          <div className="container">
            <Link href="/" className="wordmark">
              ☕ copita
            </Link>
            <nav className="nav-links">
              <Link href="/explorar" className="btn">
                Explorar
              </Link>
              <Link href="/panel" className="btn btn-primary">
                Mi panel
              </Link>
            </nav>
          </div>
        </header>
        <main>{children}</main>
        <footer className="site-footer">
          <div className="container">
            <p>
              Copita — micro-mecenazgo para creadores. <Link href="/terminos">Términos</Link> · <Link href="/privacidad">Privacidad</Link> ·{" "}
              <Link href="/reembolsos">Reembolsos</Link>
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}

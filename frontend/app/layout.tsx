import type { Metadata } from "next";
import "./globals.css";
import "./orbitbase.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "OrbitBase | Launchpad as a Service",
  description: "Crea y gestiona tus tokens en la red BASE (L2) con seguridad de nivel institucional.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="min-h-screen">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

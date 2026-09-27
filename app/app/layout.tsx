import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Itagüí · BD Colaboradores",
  description: "Base de datos de colaboradores — Iglesia Itagüí IDMJI",
  openGraph: {
    title: "Itagüí · BD Colaboradores",
    description: "Base de datos de colaboradores — Iglesia Itagüí IDMJI",
    siteName: "Itagüí IDMJI",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-gray-50 text-gray-900">
        {children}
      </body>
    </html>
  );
}

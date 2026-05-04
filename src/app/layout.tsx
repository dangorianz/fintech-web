import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SGIP | Gestion de Prestamos",
  description: "Frontend para gestion de inversiones y prestamos.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}

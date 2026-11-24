import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import RegistrarServiceWorker from "@/components/RegistrarServiceWorker";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
});

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });

const URL_SITIO = process.env.NEXT_PUBLIC_SITE_URL ?? "https://melanicristine.netlify.app";

export const metadata: Metadata = {
  metadataBase: new URL(URL_SITIO),
  title: "Estudio Melani Cristine · Lashes & Brows",
  description:
    "Extensiones de pestañas, diseño de cejas, micropigmentación y cursos en San Lorenzo, Paraguay. Reservas por WhatsApp.",
  applicationName: "Melani Cristine",
  appleWebApp: { capable: true, title: "Melani Cristine", statusBarStyle: "default" },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
  },
  openGraph: {
    title: "Estudio Melani Cristine",
    description: "Más que pestañas, diseñamos confianza. Reservas por WhatsApp.",
    locale: "es_PY",
    type: "website",
    images: ["/logo.png"],
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#F7F5F2",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es-PY" className={`${cormorant.variable} ${inter.variable} antialiased`}>
      <body className="min-h-dvh">
        {children}
        <RegistrarServiceWorker />
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import { Providers } from "./providers";
import { Header } from "@/components/layout/Header";

/**
 * O DS pede HelveticaNeueCyr 300/400 com Inter logo atrás no stack, porque o
 * arquivo Light não traz glifos acentuados. Os .ttf não estão no repo, então
 * Inter 300/400 carrega a marca hoje — e continua cobrindo os acentos quando
 * a Helvetica for adicionada. Ver DESIGN.md.
 */
const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "GrowthDirect",
  description:
    "Painel GrowthDirect: campanhas e reservas dos hotéis, e os gastos do escritório.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${inter.variable} ${GeistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-background text-foreground">
        <Providers>
          <Header />
          <main className="mx-auto w-full max-w-7xl px-4 pb-20 pt-6 sm:px-6 lg:px-8">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}

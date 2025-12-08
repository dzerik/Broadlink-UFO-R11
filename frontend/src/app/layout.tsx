import type { Metadata } from "next";
import { LanguageProvider } from "@/i18n";
import "./globals.css";

export const metadata: Metadata = {
  title: "Broadlink to UFO-R11 Converter",
  description: "IR code converter from Broadlink to UFO-R11 format for SmartIR",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  );
}

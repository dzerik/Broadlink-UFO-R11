import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import { LanguageProvider } from "@/i18n";
import "./globals.css";

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin", "cyrillic"],
  display: "swap",
  variable: "--font-jetbrains-mono",
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: "BTU · Broadlink → UFO-R11",
  description: "IR code converter from Broadlink to UFO-R11 format for SmartIR",
};

// Inline-скрипт: читает сохранённый язык из localStorage и выставляет
// document.documentElement.lang до гидратации.
const LANG_INIT_SCRIPT = `try{var s=localStorage.getItem("btu-language");if(s==="ru"||s==="en")document.documentElement.lang=s;}catch(e){}`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={jetbrainsMono.variable}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: LANG_INIT_SCRIPT }} />
      </head>
      <body className="antialiased">
        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  );
}

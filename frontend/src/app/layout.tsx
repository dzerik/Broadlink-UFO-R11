import type { Metadata } from "next";
import { LanguageProvider } from "@/i18n";
import "./globals.css";

export const metadata: Metadata = {
  title: "Broadlink to UFO-R11 Converter",
  description: "IR code converter from Broadlink to UFO-R11 format for SmartIR",
};

// Inline-скрипт: читает сохранённый язык из localStorage и выставляет
// document.documentElement.lang до гидратации, чтобы SEO/скринридеры видели
// корректный атрибут, а не захардкоженный "en" из статической разметки.
const LANG_INIT_SCRIPT = `try{var s=localStorage.getItem("btu-language");if(s==="ru"||s==="en")document.documentElement.lang=s;}catch(e){}`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: LANG_INIT_SCRIPT }} />
      </head>
      <body className="antialiased">
        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  );
}

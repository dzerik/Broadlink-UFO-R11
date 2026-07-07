"use client";

import { useTranslation } from "@/i18n";
import Header from "@/components/Header";
import Tabs from "@/components/Tabs";
import ConvertForm from "@/components/ConvertForm";
import FileUpload from "@/components/FileUpload";
import TwoPanelEditor from "@/components/TwoPanelEditor";

export default function Home() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen">
      <Header />

      <main className="max-w-[1200px] mx-auto px-6 py-10">
        {/* Тезис страницы: узкий заголовок + одно ключевое предложение,
            без карточек с buzzword-фичами. */}
        <div className="mb-10 max-w-2xl">
          <h1
            className="text-[22px] font-medium mb-3 tracking-tight"
            style={{ color: "var(--color-text)" }}
          >
            {t.main.title}
          </h1>
          <p
            className="text-[14px] leading-relaxed"
            style={{ color: "var(--color-text-mute)" }}
          >
            {t.main.description}
          </p>
        </div>

        <section
          className="border p-6 mb-10"
          style={{
            borderColor: "var(--color-rule)",
            background: "var(--color-panel)",
          }}
        >
          <Tabs
            tabs={[
              {
                id: "editor",
                label: t.tabs.editor,
                content: (
                  <div className="min-h-[600px]">
                    <TwoPanelEditor />
                  </div>
                ),
              },
              {
                id: "single",
                label: t.tabs.single,
                content: <ConvertForm />,
              },
              {
                id: "file",
                label: t.tabs.file,
                content: <FileUpload />,
              },
            ]}
          />
        </section>

        <footer
          className="pt-6 border-t text-[12px] flex flex-wrap gap-x-8 gap-y-2 justify-between"
          style={{
            borderColor: "var(--color-rule)",
            color: "var(--color-text-mute)",
          }}
        >
          <div className="flex flex-wrap gap-x-6 gap-y-1">
            <span>{t.footer.compatible}</span>
            <span>·</span>
            <span>
              {t.footer.codesFrom}{" "}
              <a
                href="https://github.com/smartHomeHub/SmartIR/tree/master/codes"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:!text-[color:var(--color-amber)] transition-colors"
                style={{ color: "var(--color-text)" }}
              >
                SmartIR
              </a>
            </span>
          </div>
          <div>
            {t.footer.basedOn}{" "}
            <a
              href="https://github.com/arkservertools/broadlinktoUFOR11"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:!text-[color:var(--color-amber)] transition-colors"
              style={{ color: "var(--color-text)" }}
            >
              {t.footer.originalProject}
            </a>
          </div>
        </footer>
      </main>
    </div>
  );
}

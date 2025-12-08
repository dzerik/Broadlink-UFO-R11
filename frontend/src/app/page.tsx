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
    <div className="min-h-screen bg-gray-950">
      <Header />

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-2">{t.main.title}</h2>
          <p className="text-gray-400">{t.main.description}</p>
        </div>

        <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
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
        </div>

        <div className="mt-8 grid md:grid-cols-3 gap-6">
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
            <h3 className="text-lg font-semibold text-white mb-3">
              {t.features.editorTitle}
            </h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li className="flex gap-2">
                <span className="text-green-400">&#10003;</span>
                {t.features.editorFeature1}
              </li>
              <li className="flex gap-2">
                <span className="text-green-400">&#10003;</span>
                {t.features.editorFeature2}
              </li>
              <li className="flex gap-2">
                <span className="text-green-400">&#10003;</span>
                {t.features.editorFeature3}
              </li>
              <li className="flex gap-2">
                <span className="text-green-400">&#10003;</span>
                {t.features.editorFeature4}
              </li>
            </ul>
          </div>

          <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
            <h3 className="text-lg font-semibold text-white mb-3">
              {t.features.compressionTitle}
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">{t.options.level0}</span>
                <span className="text-gray-500">{t.features.noCompression}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">{t.options.level1}</span>
                <span className="text-gray-500">{t.features.fast}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-400 font-medium">{t.options.level2}</span>
                <span className="text-blue-400">{t.features.optimal}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">{t.options.level3}</span>
                <span className="text-gray-500">{t.features.maximum}</span>
              </div>
            </div>
          </div>

          <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
            <h3 className="text-lg font-semibold text-white mb-3">
              {t.features.outputTitle}
            </h3>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-gray-300 mb-1">{t.features.withWrapper}</p>
                <code className="text-xs text-green-400 bg-gray-800 px-2 py-1 rounded block">
                  {`{"ir_code_to_send": "..."}`}
                </code>
              </div>
              <div>
                <p className="text-gray-300 mb-1">{t.features.withoutWrapper}</p>
                <code className="text-xs text-amber-400 bg-gray-800 px-2 py-1 rounded block">
                  &quot;DF8RIhFD...&quot;
                </code>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center text-sm text-gray-500">
          <p>{t.footer.compatible}</p>
          <p className="mt-2">
            {t.footer.basedOn}{" "}
            <a
              href="https://github.com/arkservertools/broadlinktoUFOR11"
              className="text-blue-400 hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              {t.footer.originalProject}
            </a>
            {" · "}
            {t.footer.codesFrom}{" "}
            <a
              href="https://github.com/smartHomeHub/SmartIR/tree/master/codes"
              className="text-blue-400 hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              SmartIR
            </a>
          </p>
          <p className="mt-1">
            <a
              href="https://github.com/arkservertools/broadlinktoUFOR11"
              className="text-blue-400 hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              GitHub
            </a>
            {" · "}
            <a
              href="/api/docs"
              className="text-blue-400 hover:underline"
              target="_blank"
            >
              API Docs
            </a>
          </p>
        </div>
      </main>
    </div>
  );
}

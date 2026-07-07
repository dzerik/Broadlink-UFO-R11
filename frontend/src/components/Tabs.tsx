"use client";

import { useState } from "react";

interface TabsProps {
  tabs: {
    id: string;
    label: string;
    content: React.ReactNode;
  }[];
}

export default function Tabs({ tabs }: TabsProps) {
  const [activeTab, setActiveTab] = useState(tabs[0]?.id);

  return (
    <div className="w-full">
      {/* Мода отображается инструментально: MODE › a · b · c */}
      <div
        className="flex items-center gap-3 pb-3 mb-6 border-b"
        style={{ borderColor: "var(--color-rule)" }}
      >
        <span className="label">Mode</span>
        <span
          style={{ color: "var(--color-text-dim)" }}
          aria-hidden="true"
        >
          ›
        </span>
        {tabs.map((tab, i) => (
          <span key={tab.id} className="flex items-center gap-3">
            {i > 0 && (
              <span
                style={{ color: "var(--color-text-dim)" }}
                aria-hidden="true"
              >
                ·
              </span>
            )}
            <button
              onClick={() => setActiveTab(tab.id)}
              aria-pressed={activeTab === tab.id}
              className="label tracking-[0.15em] transition-colors"
              style={{
                color:
                  activeTab === tab.id
                    ? "var(--color-amber)"
                    : "var(--color-text-mute)",
              }}
            >
              {tab.label}
            </button>
          </span>
        ))}
      </div>

      <div>
        {tabs.map((tab) => (
          <div
            key={tab.id}
            className={activeTab === tab.id ? "block" : "hidden"}
          >
            {tab.content}
          </div>
        ))}
      </div>
    </div>
  );
}

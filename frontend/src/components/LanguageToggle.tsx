"use client";

import type { Language } from "@/i18n";

type LanguageToggleProps = {
  language: Language;
  label: string;
  onToggle: () => void;
};

export function LanguageToggle({ language, label, onToggle }: LanguageToggleProps) {
  const targetLanguage = language === "en" ? "PT" : "EN";

  return (
    <button
      type="button"
      className="language-toggle"
      onClick={onToggle}
      aria-label={label}
      title={label}
    >
      {targetLanguage}
    </button>
  );
}

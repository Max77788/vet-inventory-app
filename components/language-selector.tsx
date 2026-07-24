"use client";

import { useLanguage } from "@/components/language-provider";
import { Lang } from "@/lib/translations";

const labels: Record<Lang, string> = {
  en: "EN",
  uk: "UA",
  ru: "RU",
};

export function LanguageSelector() {
  const { lang, setLang, t } = useLanguage();

  return (
    <div className="flex items-center gap-2">
      <span className="hidden text-sm font-medium text-zinc-600 sm:inline">{t("language")}:</span>
      <div className="inline-flex rounded-lg border border-zinc-300 bg-white p-1 shadow-sm">
        {(["uk", "ru", "en"] as Lang[]).map((l) => (
          <button
            key={l}
            onClick={() => setLang(l)}
            aria-pressed={lang === l}
            className={`rounded-md px-3 py-1 text-sm font-medium transition ${
              lang === l
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-zinc-600 hover:bg-zinc-100"
            }`}
          >
            {labels[l]}
          </button>
        ))}
      </div>
    </div>
  );
}

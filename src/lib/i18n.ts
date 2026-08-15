import en from "@/locales/en.json";
import de from "@/locales/de.json";
import gr from "@/locales/gr.json";
import type { Locale } from "@/types";

export type TranslationKey = keyof typeof en;

const dictionaries = {
  en,
  de,
  gr,
};

export function getDictionary(locale: Locale) {
  return dictionaries[locale] || dictionaries.en;
}

export function formatEuro(amount: number, locale: Locale = "en"): string {
  // Cyprus / German standard: €6.50 / €6,50
  return new Intl.NumberFormat(locale === "de" ? "de-DE" : locale === "gr" ? "el-CY" : "en-IE", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

import type { ReactNode } from "react";
import type { Metadata, Viewport } from "next";
import { I18nProvider } from "./I18nProvider";
import PwaRegister from "@/components/PwaRegister";

import enMessages from "../../../messages/en.json";
import esMessages from "../../../messages/es.json";

type Locale = "en" | "es";

const dictionaries: Record<Locale, Record<string, any>> = {
  en: enMessages,
  es: esMessages,
};

function getSafeLocale(locale: string): Locale {
  return locale === "es" ? "es" : "en";
}

export default function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: { locale: string };
}) {
  const locale = getSafeLocale(params.locale);
  const messages = dictionaries[locale];

  return (
    <I18nProvider locale={locale} messages={messages}>
      {children}
    </I18nProvider>
  );
}

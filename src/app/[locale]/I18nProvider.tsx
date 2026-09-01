"use client";

import React, { createContext, useContext } from "react";

type Dict = Record<string, any>;

const I18nContext = createContext<{ locale: string; messages: Dict } | null>(
  null,
);

export function I18nProvider({
  locale,
  messages,
  children,
}: {
  locale: string;
  messages: Dict;
  children: React.ReactNode;
}) {
  return (
    <I18nContext.Provider value={{ locale, messages }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useT() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useT must be used inside I18nProvider");

  return (key: string) => {
    const parts = key.split(".");
    let cur: any = ctx.messages;
    for (const p of parts) cur = cur?.[p];
    return typeof cur === "string" ? cur : key;
  };
}

export function useLocale() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useLocale must be used inside I18nProvider");
  return ctx.locale;
}

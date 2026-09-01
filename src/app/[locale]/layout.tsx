export const runtime = "nodejs";

import fs from "node:fs/promises";
import path from "node:path";
import type { ReactNode } from "react";
import { I18nProvider } from "./I18nProvider";

async function loadMessages(locale: string) {
  const safe = locale === "es" ? "es" : "en";
  const filePath = path.join(process.cwd(), "messages", `${safe}.json`);
  const content = await fs.readFile(filePath, "utf-8");
  return JSON.parse(content);
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: { locale: string };
}) {
  const messages = await loadMessages(params.locale);

  return (
    <I18nProvider locale={params.locale} messages={messages}>
      {children}
    </I18nProvider>
  );
}

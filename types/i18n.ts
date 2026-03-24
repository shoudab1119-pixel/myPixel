export const LOCALES = ["en", "zh"] as const;

export type Locale = (typeof LOCALES)[number];

"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";

import {
  DEFAULT_LOCALE,
  LOCALE_STORAGE_KEY,
  getMessages,
  isLocale,
} from "@/lib/i18n/messages";
import type { Locale } from "@/types/i18n";

interface LocaleContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  messages: ReturnType<typeof getMessages>;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);
const localeListeners = new Set<() => void>();
let currentLocale: Locale = DEFAULT_LOCALE;

function readLocale() {
  if (typeof window === "undefined") {
    return DEFAULT_LOCALE;
  }

  const saved = window.localStorage.getItem(LOCALE_STORAGE_KEY);
  return saved && isLocale(saved) ? saved : DEFAULT_LOCALE;
}

function emitLocaleChange() {
  localeListeners.forEach((listener) => listener());
}

function getLocaleSnapshot() {
  if (typeof window === "undefined") {
    return DEFAULT_LOCALE;
  }

  currentLocale = readLocale();
  return currentLocale;
}

function subscribe(onChange: () => void) {
  localeListeners.add(onChange);

  if (typeof window === "undefined") {
    return () => {
      localeListeners.delete(onChange);
    };
  }

  const handleChange = () => {
    const nextLocale = readLocale();
    if (nextLocale === currentLocale) {
      return;
    }

    currentLocale = nextLocale;
    emitLocaleChange();
  };

  window.addEventListener("storage", handleChange);

  return () => {
    localeListeners.delete(onChange);
    window.removeEventListener("storage", handleChange);
  };
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const locale = useSyncExternalStore(
    subscribe,
    getLocaleSnapshot,
    () => DEFAULT_LOCALE,
  );

  useEffect(() => {
    document.documentElement.lang = locale === "zh" ? "zh-CN" : "en";
  }, [locale]);

  const value = useMemo(
    () => ({
      locale,
      setLocale: (nextLocale: Locale) => {
        currentLocale = nextLocale;
        window.localStorage.setItem(LOCALE_STORAGE_KEY, nextLocale);
        emitLocaleChange();
      },
      messages: getMessages(locale),
    }),
    [locale],
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const context = useContext(LocaleContext);

  if (!context) {
    throw new Error("useLocale must be used within LocaleProvider.");
  }

  return context;
}

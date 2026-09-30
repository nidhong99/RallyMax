import React, { createContext, useContext, useState, useEffect } from 'react';
import { InternationalizationProvider } from '@astryxdesign/core';
import { Language, translations, Translations } from '../i18n/translations';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  formatCurrency: (amount: number) => string;
  formatDateRange: (startStr: string, endStr: string) => string;
  isVietnamese: boolean;
  isEnglish: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const STORAGE_KEY = 'rallymax_language';

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'vi' || saved === 'en') return saved;
    // Default to Vietnamese as established for RallyMax
    return 'vi';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch (e) {
      console.warn('Failed to save language to localStorage:', e);
    }
  };

  // Helper translation resolver with dot notation e.g. t('nav.explore')
  const t = (path: string, params?: Record<string, string | number>): string => {
    const currentDict = translations[language] || translations.vi;
    const fallbackDict = translations.vi;

    const parts = path.split('.');
    let value: any = currentDict;

    for (const part of parts) {
      if (value && typeof value === 'object' && part in value) {
        value = value[part];
      } else {
        value = undefined;
        break;
      }
    }

    if (value === undefined) {
      let fb: any = fallbackDict;
      for (const part of parts) {
        if (fb && typeof fb === 'object' && part in fb) {
          fb = fb[part];
        } else {
          fb = undefined;
          break;
        }
      }
      value = fb;
    }

    if (typeof value !== 'string') {
      return path;
    }

    if (params) {
      let result = value;
      for (const [k, v] of Object.entries(params)) {
        result = result.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
      }
      return result;
    }

    return value;
  };

  const formatCurrency = (amount: number): string => {
    if (language === 'vi') {
      return `${amount.toLocaleString('vi-VN')} đ`;
    }
    return `${amount.toLocaleString('en-US')} VND`;
  };

  const formatDateRange = (startStr: string, endStr: string): string => {
    const startDate = new Date(startStr);
    const endDate = new Date(endStr);
    const locale = language === 'vi' ? 'vi-VN' : 'en-US';

    const timeStart = startDate.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
    const timeEnd = endDate.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
    const dayStr = startDate.toLocaleDateString(locale, { weekday: 'short', day: '2-digit', month: '2-digit' });

    return `${dayStr}, ${timeStart} - ${timeEnd}`;
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        t,
        formatCurrency,
        formatDateRange,
        isVietnamese: language === 'vi',
        isEnglish: language === 'en',
      }}
    >
      <InternationalizationProvider locale={language === 'vi' ? 'vi' : 'en'}>
        {children}
      </InternationalizationProvider>
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

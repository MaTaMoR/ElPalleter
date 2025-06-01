export interface Language {
  id: string;
  name: string;
  nativeName: string;
  isDefault: boolean;
  isActive: boolean;
}

export interface TextKey {
  id: number;
  key: string;
  category: string;
  description?: string;
  context?: string;
  maxLength?: number;
}

export interface Translation {
  textKeyId: number;
  languageId: string;
  translation: string;
  isReviewed: boolean;
  translatorNotes?: string;
}

export const DEFAULT_LANGUAGE = 'es';

export class I18nConfig {
  private static instance: I18nConfig;
  private languages: Language[] = [];
  private translations: Map<string, Map<string, string>> = new Map();

  static getInstance(): I18nConfig {
    if (!I18nConfig.instance) {
      I18nConfig.instance = new I18nConfig();
    }
    return I18nConfig.instance;
  }

  async loadTranslations(): Promise<void> {
    // Cargar traducciones desde la base de datos
    const response = await fetch('/api/translations');
    const data = await response.json();
    
    this.translations.clear();
    
    for (const item of data) {
      if (!this.translations.has(item.languageId)) {
        this.translations.set(item.languageId, new Map());
      }
      this.translations.get(item.languageId)!.set(item.key, item.translation);
    }
  }

  getTranslation(key: string, language: string = DEFAULT_LANGUAGE): string {
    const langTranslations = this.translations.get(language);
    if (langTranslations && langTranslations.has(key)) {
      return langTranslations.get(key)!;
    }
    
    // Fallback al idioma por defecto
    const defaultTranslations = this.translations.get(DEFAULT_LANGUAGE);
    if (defaultTranslations && defaultTranslations.has(key)) {
      return defaultTranslations.get(key)!;
    }
    
    // Fallback a la clave si no existe traducción
    return `[${key}]`;
  }

  isLanguageComplete(languageId: string): boolean {
    const allKeys = new Set<string>();
    const defaultTranslations = this.translations.get(DEFAULT_LANGUAGE);
    
    if (defaultTranslations) {
      defaultTranslations.forEach((_, key) => allKeys.add(key));
    }
    
    const langTranslations = this.translations.get(languageId);
    if (!langTranslations) return false;
    
    for (const key of allKeys) {
      if (!langTranslations.has(key)) {
        return false;
      }
    }
    
    return true;
  }
}
import { Injectable } from '@angular/core';
import { NativeDateAdapter, MAT_DATE_LOCALE } from '@angular/material/core';
import { TranslateService } from '@ngx-translate/core';

/**
 * Custom DateAdapter that syncs with the application's language selection
 * Ensures Material DatePickers display dates in the correct format based on language
 */
@Injectable()
export class CustomDateAdapter extends NativeDateAdapter {
  
  constructor(private translate: TranslateService) {
    super('en-US'); // Default to English
    
    // Set initial locale based on current language
    this.setLocaleBasedOnLanguage(this.translate.currentLang || 'en');
    
    // Subscribe to language changes
    this.translate.onLangChange.subscribe(event => {
      this.setLocaleBasedOnLanguage(event.lang);
    });
  }

  /**
   * Set the locale based on the selected language
   */
  private setLocaleBasedOnLanguage(lang: string): void {
    const locale = lang === 'fr' ? 'fr-FR' : 'en-US';
    this.setLocale(locale);
  }

  /**
   * Format the date for display in the input field
   * This ensures consistent formatting based on the selected language
   */
  override format(date: Date, displayFormat: Object): string {
    const currentLang = this.translate.currentLang || 'en';
    
    if (displayFormat === 'input') {
      const day = this.to2digit(date.getDate());
      const month = this.to2digit(date.getMonth() + 1);
      const year = date.getFullYear();
      
      // Return format based on language
      if (currentLang === 'fr') {
        return `${day}/${month}/${year}`; // DD/MM/YYYY for French
      } else {
        return `${month}/${day}/${year}`; // MM/DD/YYYY for English
      }
    }
    
    return super.format(date, displayFormat);
  }

  /**
   * Parse the input string to a Date object
   * Handles both DD/MM/YYYY (French) and MM/DD/YYYY (English) formats
   */
  override parse(value: any): Date | null {
    if (!value) return null;
    
    const currentLang = this.translate.currentLang || 'en';
    const str = value.trim();
    
    // Try to parse the date string based on the current language format
    const parts = str.split(/[\/-]/);
    if (parts.length === 3) {
      let day: number, month: number, year: number;
      
      if (currentLang === 'fr') {
        // French format: DD/MM/YYYY
        day = Number(parts[0]);
        month = Number(parts[1]) - 1; // Month is 0-indexed
        year = Number(parts[2]);
      } else {
        // English format: MM/DD/YYYY
        month = Number(parts[0]) - 1; // Month is 0-indexed
        day = Number(parts[1]);
        year = Number(parts[2]);
      }
      
      const date = new Date(year, month, day);
      
      // Validate the date
      if (date.getFullYear() === year && 
          date.getMonth() === month && 
          date.getDate() === day) {
        return date;
      }
    }
    
    // Fallback to default parsing
    return super.parse(value);
  }

  /**
   * Get the first day of the week based on language
   * Sunday (0) for English, Monday (1) for French
   */
  override getFirstDayOfWeek(): number {
    const currentLang = this.translate.currentLang || 'en';
    return currentLang === 'fr' ? 1 : 0; // Monday for French, Sunday for English
  }

  /**
   * Helper function to format number with leading zero
   */
  private to2digit(n: number): string {
    return ('00' + n).slice(-2);
  }
}

/**
 * Export date format configurations for different languages
 */
export const APP_DATE_FORMATS = {
  parse: {
    dateInput: 'input',
  },
  display: {
    dateInput: 'input',
    monthYearLabel: 'MMM YYYY',
    dateA11yLabel: 'LL',
    monthYearA11yLabel: 'MMMM YYYY',
  }
};
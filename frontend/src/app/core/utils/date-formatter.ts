import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Injectable({
  providedIn: 'root'
})
export class DateFormatterService {
  constructor(private translate: TranslateService) {}

  /**
   * Format a date according to the current language's date format
   * @param date - The date to format (Date, string, or undefined)
   * @returns Formatted date string or '-' if no date
   */
  formatDate(date: Date | string | undefined): string {
    if (!date) return '-';
    
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    // Check if date is valid
    if (isNaN(dateObj.getTime())) return '-';
    
    const currentLang = this.translate.currentLang || 'en';
    
    // Use Intl.DateTimeFormat with proper locale
    const locale = currentLang === 'fr' ? 'fr-FR' : 'en-US';
    
    return new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(dateObj);
  }

  /**
   * Format a datetime according to the current language's datetime format
   * @param date - The date to format (Date, string, or undefined)
   * @returns Formatted datetime string or '-' if no date
   */
  formatDateTime(date: Date | string | undefined): string {
    if (!date) return '-';
    
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    // Check if date is valid
    if (isNaN(dateObj.getTime())) return '-';
    
    const currentLang = this.translate.currentLang || 'en';
    
    // Use Intl.DateTimeFormat with proper locale
    const locale = currentLang === 'fr' ? 'fr-FR' : 'en-US';
    
    return new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }).format(dateObj);
  }

  /**
   * Format a time duration relative to now (e.g., "2 hours ago")
   * @param date - The date to compare with now
   * @returns Relative time string
   */
  formatRelativeTime(date: Date | string): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - dateObj.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) {
      return this.translate.instant('dates.justNow');
    } else if (diffInMinutes < 60) {
      const key = diffInMinutes === 1 ? 'dates.minuteAgo' : 'dates.minutesAgo';
      return this.translate.instant(key, { count: diffInMinutes });
    } else if (diffInMinutes < 1440) { // Less than 24 hours
      const hours = Math.floor(diffInMinutes / 60);
      const key = hours === 1 ? 'dates.hourAgo' : 'dates.hoursAgo';
      return this.translate.instant(key, { count: hours });
    } else {
      const days = Math.floor(diffInMinutes / 1440);
      const key = days === 1 ? 'dates.dayAgo' : 'dates.daysAgo';
      return this.translate.instant(key, { count: days });
    }
  }
}
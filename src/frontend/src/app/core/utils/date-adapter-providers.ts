import { Provider } from '@angular/core';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { CustomDateAdapter, APP_DATE_FORMATS } from './custom-date-adapter';

/**
 * Providers for configuring Angular Material DatePicker to use custom date adapter
 * This ensures date pickers respect the application's language selection
 */
export const DATE_ADAPTER_PROVIDERS: Provider[] = [
  { 
    provide: DateAdapter, 
    useClass: CustomDateAdapter 
  },
  { 
    provide: MAT_DATE_FORMATS, 
    useValue: APP_DATE_FORMATS 
  }
];

/**
 * Export for convenience when importing in modules
 */
export { CustomDateAdapter, APP_DATE_FORMATS };
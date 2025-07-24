export class ResponseDto<T> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: string[];
  timestamp: string;

  constructor(data?: T, message?: string, errors?: string[]) {
    this.success = !errors || errors.length === 0;
    this.data = data;
    this.message = message;
    this.errors = errors;
    this.timestamp = new Date().toISOString();
  }
}
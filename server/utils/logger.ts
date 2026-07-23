/**
 * Structured Logger for LiveConnect
 */

type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';

export class Logger {
  private static format(level: LogLevel, category: string, message: string, data?: unknown): string {
    const timestamp = new Date().toISOString();
    let dataString = '';
    if (data !== undefined) {
      try {
        dataString = ` | Data: ${JSON.stringify(data)}`;
      } catch {
        dataString = ' | Data: [Circular or Unserializable]';
      }
    }
    return `[${timestamp}] [${level}] [${category}] ${message}${dataString}`;
  }

  static info(category: string, message: string, data?: unknown) {
    console.log(this.format('INFO', category, message, data));
  }

  static warn(category: string, message: string, data?: unknown) {
    console.warn(this.format('WARN', category, message, data));
  }

  static error(category: string, message: string, data?: unknown) {
    console.error(this.format('ERROR', category, message, data));
  }

  static debug(category: string, message: string, data?: unknown) {
    if (process.env.NODE_ENV !== 'production') {
      console.log(this.format('DEBUG', category, message, data));
    }
  }
}

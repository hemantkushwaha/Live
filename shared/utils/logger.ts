/**
 * Reusable Log System for LiveConnect (Frontend & Backend)
 * Supports INFO, WARN, ERROR, DEBUG levels without external logging dependencies.
 */

export type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';

export class Logger {
  private static levelPriority: Record<LogLevel, number> = {
    DEBUG: 0,
    INFO: 1,
    WARN: 2,
    ERROR: 3,
  };

  private static minLevel: LogLevel = 'INFO';

  public static setLevel(level: LogLevel): void {
    Logger.minLevel = level;
  }

  private static shouldLog(level: LogLevel): boolean {
    return Logger.levelPriority[level] >= Logger.levelPriority[Logger.minLevel];
  }

  private static formatMessage(level: LogLevel, scope: string, message: string): string {
    const timestamp = new Date().toISOString();
    return `[${timestamp}] [${level}] [${scope}] ${message}`;
  }

  public static info(scope: string, message: string, ...details: unknown[]): void {
    if (!Logger.shouldLog('INFO')) return;
    const formatted = Logger.formatMessage('INFO', scope, message);
    if (details.length > 0) {
      console.log(formatted, ...details);
    } else {
      console.log(formatted);
    }
  }

  public static warn(scope: string, message: string, ...details: unknown[]): void {
    if (!Logger.shouldLog('WARN')) return;
    const formatted = Logger.formatMessage('WARN', scope, message);
    if (details.length > 0) {
      console.warn(formatted, ...details);
    } else {
      console.warn(formatted);
    }
  }

  public static error(scope: string, message: string, ...details: unknown[]): void {
    if (!Logger.shouldLog('ERROR')) return;
    const formatted = Logger.formatMessage('ERROR', scope, message);
    if (details.length > 0) {
      console.error(formatted, ...details);
    } else {
      console.error(formatted);
    }
  }

  public static debug(scope: string, message: string, ...details: unknown[]): void {
    if (!Logger.shouldLog('DEBUG')) return;
    const formatted = Logger.formatMessage('DEBUG', scope, message);
    if (details.length > 0) {
      console.debug(formatted, ...details);
    } else {
      console.debug(formatted);
    }
  }
}

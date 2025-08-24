/**
 * Centralized logging system
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: Date;
  context?: string;
  metadata?: Record<string, any>;
  userId?: string;
  sessionId?: string;
}

class Logger {
  private logLevel: LogLevel;
  private logs: LogEntry[] = [];
  private maxLogs: number = 1000;

  constructor() {
    this.logLevel = process.env.NODE_ENV === 'production' ? LogLevel.INFO : LogLevel.DEBUG;
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.logLevel;
  }

  private createLogEntry(
    level: LogLevel,
    message: string,
    context?: string,
    metadata?: Record<string, any>
  ): LogEntry {
    return {
      level,
      message,
      timestamp: new Date(),
      context,
      metadata,
      userId: this.getCurrentUserId(),
      sessionId: this.getSessionId(),
    };
  }

  private getCurrentUserId(): string | undefined {
    // Get current user ID from auth context
    if (typeof window !== 'undefined') {
      return localStorage.getItem('userId') || undefined;
    }
    return undefined;
  }

  private getSessionId(): string | undefined {
    // Get or create session ID
    if (typeof window !== 'undefined') {
      let sessionId = sessionStorage.getItem('sessionId');
      if (!sessionId) {
        sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        sessionStorage.setItem('sessionId', sessionId);
      }
      return sessionId;
    }
    return undefined;
  }

  private addLog(entry: LogEntry) {
    this.logs.push(entry);
    
    // Keep only the most recent logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Send to external logging service in production
    if (process.env.NODE_ENV === 'production' && entry.level >= LogLevel.ERROR) {
      this.sendToExternalService(entry);
    }
  }

  private async sendToExternalService(entry: LogEntry) {
    try {
      // Send to external logging service (e.g., Sentry, LogRocket, etc.)
      if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
        // Sentry integration would go here
        console.log('Would send to Sentry:', entry);
      }

      // Send to custom logging endpoint
      await fetch('/api/logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(entry),
      }).catch(() => {
        // Silently fail if logging endpoint is not available
      });
    } catch (error) {
      // Don't throw errors from logging
      console.error('Failed to send log to external service:', error);
    }
  }

  debug(message: string, context?: string, metadata?: Record<string, any>) {
    if (!this.shouldLog(LogLevel.DEBUG)) return;

    const entry = this.createLogEntry(LogLevel.DEBUG, message, context, metadata);
    this.addLog(entry);
    console.debug(`[DEBUG] ${context ? `[${context}] ` : ''}${message}`, metadata);
  }

  info(message: string, context?: string, metadata?: Record<string, any>) {
    if (!this.shouldLog(LogLevel.INFO)) return;

    const entry = this.createLogEntry(LogLevel.INFO, message, context, metadata);
    this.addLog(entry);
    console.info(`[INFO] ${context ? `[${context}] ` : ''}${message}`, metadata);
  }

  warn(message: string, context?: string, metadata?: Record<string, any>) {
    if (!this.shouldLog(LogLevel.WARN)) return;

    const entry = this.createLogEntry(LogLevel.WARN, message, context, metadata);
    this.addLog(entry);
    console.warn(`[WARN] ${context ? `[${context}] ` : ''}${message}`, metadata);
  }

  error(message: string, error?: Error, context?: string, metadata?: Record<string, any>) {
    if (!this.shouldLog(LogLevel.ERROR)) return;

    const errorMetadata = {
      ...metadata,
      ...(error && {
        errorName: error.name,
        errorMessage: error.message,
        errorStack: error.stack,
      }),
    };

    const entry = this.createLogEntry(LogLevel.ERROR, message, context, errorMetadata);
    this.addLog(entry);
    console.error(`[ERROR] ${context ? `[${context}] ` : ''}${message}`, error, metadata);
  }

  // Get recent logs for debugging
  getRecentLogs(count: number = 50): LogEntry[] {
    return this.logs.slice(-count);
  }

  // Clear logs
  clearLogs() {
    this.logs = [];
  }

  // Export logs for debugging
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  // Performance logging
  time(label: string) {
    if (typeof window !== 'undefined') {
      console.time(label);
    }
  }

  timeEnd(label: string, context?: string) {
    if (typeof window !== 'undefined') {
      console.timeEnd(label);
      this.info(`Performance: ${label} completed`, context);
    }
  }

  // API call logging
  logApiCall(
    method: string,
    url: string,
    status: number,
    duration: number,
    error?: Error
  ) {
    const metadata = {
      method,
      url,
      status,
      duration,
      ...(error && { error: error.message }),
    };

    if (status >= 400) {
      this.error(`API call failed: ${method} ${url}`, error, 'api', metadata);
    } else {
      this.info(`API call: ${method} ${url} (${status})`, 'api', metadata);
    }
  }

  // User action logging
  logUserAction(action: string, details?: Record<string, any>) {
    this.info(`User action: ${action}`, 'user', details);
  }

  // Business event logging
  logBusinessEvent(event: string, details?: Record<string, any>) {
    this.info(`Business event: ${event}`, 'business', details);
  }
}

// Create singleton instance
export const logger = new Logger();

// Convenience functions
export const log = {
  debug: (message: string, context?: string, metadata?: Record<string, any>) =>
    logger.debug(message, context, metadata),
  
  info: (message: string, context?: string, metadata?: Record<string, any>) =>
    logger.info(message, context, metadata),
  
  warn: (message: string, context?: string, metadata?: Record<string, any>) =>
    logger.warn(message, context, metadata),
  
  error: (message: string, error?: Error, context?: string, metadata?: Record<string, any>) =>
    logger.error(message, error, context, metadata),
  
  time: (label: string) => logger.time(label),
  timeEnd: (label: string, context?: string) => logger.timeEnd(label, context),
  
  apiCall: (method: string, url: string, status: number, duration: number, error?: Error) =>
    logger.logApiCall(method, url, status, duration, error),
  
  userAction: (action: string, details?: Record<string, any>) =>
    logger.logUserAction(action, details),
  
  businessEvent: (event: string, details?: Record<string, any>) =>
    logger.logBusinessEvent(event, details),
};
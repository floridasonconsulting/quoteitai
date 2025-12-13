interface ErrorLog {
  timestamp: string;
  context: string;
  message: string;
  stack?: string;
  userAgent: string;
  url: string;
  userId?: string;
  severity: "low" | "medium" | "high" | "critical";
}

export class ErrorLogger {
  private static MAX_LOGS = 100;
  private static STORAGE_KEY = "error-logs";

  static async logError(
    error: Error,
    context: string,
    severity: "low" | "medium" | "high" | "critical" = "medium",
    userId?: string
  ): Promise<void> {
    console.error(`[${context}] [${severity.toUpperCase()}]`, error);

    const errorLog: ErrorLog = {
      timestamp: new Date().toISOString(),
      context,
      message: error.message,
      stack: error.stack,
      userAgent: navigator.userAgent,
      url: window.location.href,
      userId,
      severity
    };

    try {
      const logs = this.getRecentErrors();
      logs.push(errorLog);
      localStorage.setItem(
        this.STORAGE_KEY,
        JSON.stringify(logs.slice(-this.MAX_LOGS))
      );
    } catch (e) {
      console.error("Failed to store error log:", e);
    }

    if (import.meta.env.PROD && severity === "critical") {
      try {
        await this.sendToMonitoring(errorLog);
      } catch (e) {
        console.error("Failed to send error to monitoring:", e);
      }
    }
  }

  private static async sendToMonitoring(errorLog: ErrorLog): Promise<void> {
    try {
      await fetch("/api/log-error", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(errorLog)
      });
    } catch (error) {
      console.error("Monitoring service unavailable:", error);
    }
  }

  static getRecentErrors(limit?: number): ErrorLog[] {
    try {
      const logs = JSON.parse(localStorage.getItem(this.STORAGE_KEY) || "[]");
      return limit ? logs.slice(-limit) : logs;
    } catch {
      return [];
    }
  }

  static getErrorsByContext(context: string): ErrorLog[] {
    return this.getRecentErrors().filter(log => log.context === context);
  }

  static getErrorsBySeverity(severity: ErrorLog["severity"]): ErrorLog[] {
    return this.getRecentErrors().filter(log => log.severity === severity);
  }

  static getCriticalErrors(): ErrorLog[] {
    return this.getErrorsBySeverity("critical");
  }

  static clearLogs(): void {
    localStorage.removeItem(this.STORAGE_KEY);
  }

  static getErrorStats(): {
    total: number;
    bySeverity: Record<string, number>;
    byContext: Record<string, number>;
  } {
    const errors = this.getRecentErrors();
    
    const bySeverity: Record<string, number> = {
      low: 0,
      medium: 0,
      high: 0,
      critical: 0
    };
    
    const byContext: Record<string, number> = {};

    errors.forEach(error => {
      bySeverity[error.severity]++;
      byContext[error.context] = (byContext[error.context] || 0) + 1;
    });

    return {
      total: errors.length,
      bySeverity,
      byContext
    };
  }

  static exportLogs(): string {
    const logs = this.getRecentErrors();
    const stats = this.getErrorStats();
    
    return JSON.stringify(
      {
        exportDate: new Date().toISOString(),
        stats,
        logs
      },
      null,
      2
    );
  }
}
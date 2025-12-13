export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

export class Logger {
  private level: LogLevel;

  constructor(level: string = "info") {
    switch (level.toLowerCase()) {
      case "debug":
        this.level = LogLevel.DEBUG;
        break;
      case "info":
        this.level = LogLevel.INFO;
        break;
      case "warn":
        this.level = LogLevel.WARN;
        break;
      case "error":
        this.level = LogLevel.ERROR;
        break;
      default:
        this.level = LogLevel.INFO;
    }
  }

  private formatMessage(level: string, message: string, ...args: any[]): string {
    const timestamp = new Date().toISOString();
    const formattedArgs = args.length > 0 ? " " + args.map(arg => 
      typeof arg === "object" ? JSON.stringify(arg, null, 2) : String(arg)
    ).join(" ") : "";
    return `[${timestamp}] [${level}] ${message}${formattedArgs}`;
  }

  debug(message: string, ...args: any[]) {
    if (this.level <= LogLevel.DEBUG) {
      console.log(this.formatMessage("DEBUG", message, ...args));
    }
  }

  info(message: string, ...args: any[]) {
    if (this.level <= LogLevel.INFO) {
      console.log(this.formatMessage("INFO", message, ...args));
    }
  }

  warn(message: string, ...args: any[]) {
    if (this.level <= LogLevel.WARN) {
      console.warn(this.formatMessage("WARN", message, ...args));
    }
  }

  error(message: string, ...args: any[]) {
    if (this.level <= LogLevel.ERROR) {
      console.error(this.formatMessage("ERROR", message, ...args));
    }
  }
}

// create an http logger middleware

import * as http from 'http';

let logger = {
  requestLogger: (
    req: http.IncomingMessage,
    res: http.ServerResponse,
    next?: () => void
  ): void => {
    let msg = `${new Date().toISOString()}: ${
      req.headers['user-agent']
    } - HTTP/${req.httpVersion}: ${req.method} - ${req.url} - ${
      res.statusCode
    } - ${res.statusMessage}`;
    logger.logWithColor(msg, logger.getColorForStatusCode(res.statusCode));

    if (next) {
      // audit logs using next function - queue to the next service
      next();
    }
  },

  errorLogger: (err: Error, next?: () => void): void => {
    logger.logWithColor(
      `${new Date().toISOString()}: ERROR OCCURED WITH TRACE: `,
      'warn'
    );
    logger.logWithColor(err.stack as string, 'error');

    if (next) {
      // audit logs using next function - queue to the next service
      next();
    }
  },

  logWithColor: (message: string, color: string): void => {
    let colors: Record<string, string> = {
      warn: '\x1b[33m',
      error: '\x1b[31m',
      info: '\x1b[32m',
      debug: '\x1b[34m',
    };
    console.log(colors[color] + message + '\x1b[0m');
  },

  warn: (message: string): void => {
    logger.logWithColor(message, 'warn');
  },

  error: (message: string): void => {
    logger.logWithColor(message, 'error');
  },

  info: (message: string): void => {
    logger.logWithColor(message, 'info');
  },

  debug: (message: string): void => {
    logger.logWithColor(message, 'debug');
  },

  getColorForStatusCode: (statusCode: number): string => {
    let color = 'info';
    if (statusCode >= 500) {
      color = 'error';
    }
    if (statusCode >= 400) {
      color = 'warn';
    }
    if (statusCode >= 300) {
      color = 'debug';
    }
    return color;
  },
};

export default logger;

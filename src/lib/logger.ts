// Structured logging utility to replace scattered console.logs
const isDev = process.env.NODE_ENV !== 'production';

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

function formatMessage(level: LogLevel, message: string, data?: any) {
  const timestamp = new Date().toISOString();
  // In production, we could send this to a service like Datadog or Sentry
  // For now, we'll just format it nicely for the console
  const logObj = { timestamp, level: level.toUpperCase(), message, ...(data && { data }) };
  return isDev ? `${timestamp} [${level.toUpperCase()}] ${message} ${data ? JSON.stringify(data) : ''}` : JSON.stringify(logObj);
}

export const logger = {
  info: (message: string, data?: any) => {
    console.log(formatMessage('info', message, data));
  },
  warn: (message: string, data?: any) => {
    console.warn(formatMessage('warn', message, data));
  },
  error: (messageOrError: string | any, error?: any) => {
    let message = 'Error';
    let errObj = error;
    
    if (typeof messageOrError === 'string') {
      message = messageOrError;
    } else {
      errObj = messageOrError;
      message = errObj?.message || 'Error';
    }

    console.error(formatMessage('error', message, {
      message: errObj?.message,
      stack: errObj?.stack,
      ...errObj
    }));
  },
  debug: (message: string, data?: any) => {
    if (isDev) {
      console.debug(formatMessage('debug', message, data));
    }
  }
};

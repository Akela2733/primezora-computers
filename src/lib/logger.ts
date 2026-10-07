export const logger = {
  info: (message: string, ...optionalParams: unknown[]) => {
    if (process.env.NODE_ENV !== "production") {
      console.info(message, ...optionalParams);
    }
  },
  error: (message: string, error?: unknown) => {
    if (process.env.NODE_ENV !== "production") {
      console.error(message, error);
    } else {
      console.error(message);
    }
  },
  debug: (message: string, ...optionalParams: unknown[]) => {
    if (process.env.NODE_ENV !== "production") {
      console.debug(message, ...optionalParams);
    }
  },
};

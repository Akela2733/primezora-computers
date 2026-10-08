export const logger = {
  info: (message: string, ...optionalParams: unknown[]) => {
    if (process.env.NODE_ENV !== "production") {
      console.info(message, ...optionalParams);
    }
  },

  error: (message: string, error?: unknown) => {
    if (process.env.NODE_ENV !== "production") {
      console.error(message, error);
      return;
    }

    if (error instanceof Error) {
      console.error(message, {
        name: error.name,
        message: error.message,
        stack: error.stack,
      });
      return;
    }

    console.error(message, {
      errorType: typeof error,
      error: String(error),
    });
  },

  debug: (message: string, ...optionalParams: unknown[]) => {
    if (process.env.NODE_ENV !== "production") {
      console.debug(message, ...optionalParams);
    }
  },
};
export const getErrorMessage = (error: unknown) => {
  return error instanceof Error
    ? error.message
    : typeof error === 'object' &&
        error !== null &&
        'message' in error &&
        typeof (error as { message?: unknown }).message === 'string'
      ? (error as { message: string }).message
      : JSON.stringify(error);
};

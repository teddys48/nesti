export class ApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public status: number = 400
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function formatError(code: string, message: string) {
  return {
    error: {
      code,
      message,
    },
  };
}

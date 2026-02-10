export type ApiErrorCode =
  | "NETWORK_ERROR"
  | "TIMEOUT"
  | "RATE_LIMIT"
  | "INVALID_RESPONSE"
  | "NOT_FOUND"
  | "SERVER_ERROR"
  | "VALIDATION_ERROR";

export class ApiError extends Error {
  readonly code: ApiErrorCode;
  readonly statusCode?: number;
  readonly retryable: boolean;

  constructor(
    message: string,
    code: ApiErrorCode,
    options?: { statusCode?: number; retryable?: boolean }
  ) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.statusCode = options?.statusCode;
    this.retryable = options?.retryable ?? this.isRetryableCode(code);
  }

  private isRetryableCode(code: ApiErrorCode): boolean {
    return code === "NETWORK_ERROR" || code === "TIMEOUT" || code === "RATE_LIMIT";
  }

  static fromResponse(response: Response, message?: string): ApiError {
    const statusCode = response.status;

    if (statusCode === 429) {
      return new ApiError(
        message ?? "Rate limit exceeded",
        "RATE_LIMIT",
        { statusCode, retryable: true }
      );
    }

    if (statusCode === 404) {
      return new ApiError(
        message ?? "Resource not found",
        "NOT_FOUND",
        { statusCode, retryable: false }
      );
    }

    if (statusCode >= 500) {
      return new ApiError(
        message ?? "Server error",
        "SERVER_ERROR",
        { statusCode, retryable: true }
      );
    }

    if (statusCode >= 400) {
      return new ApiError(
        message ?? "Validation error",
        "VALIDATION_ERROR",
        { statusCode, retryable: false }
      );
    }

    return new ApiError(
      message ?? `HTTP ${statusCode}`,
      "SERVER_ERROR",
      { statusCode, retryable: false }
    );
  }

  static networkError(message?: string): ApiError {
    return new ApiError(
      message ?? "Network error",
      "NETWORK_ERROR",
      { retryable: true }
    );
  }

  static timeout(message?: string): ApiError {
    return new ApiError(
      message ?? "Request timeout",
      "TIMEOUT",
      { retryable: true }
    );
  }
}

/**
 * API клиент для взаимодействия с backend.
 */

import type {
  ConvertRequest,
  ConvertResponse,
  FileConvertRequest,
  FileConvertResponse,
  HealthResponse,
  ErrorResponse,
} from "@/types";

const API_BASE = "/api";

class ApiError extends Error {
  constructor(
    public status: number,
    public detail: string,
    public errorType?: string
  ) {
    super(detail);
    this.name = "ApiError";
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorData: ErrorResponse;
    try {
      errorData = await response.json();
    } catch {
      errorData = { detail: response.statusText };
    }
    throw new ApiError(response.status, errorData.detail, errorData.error_type);
  }
  return response.json();
}

/**
 * Проверяет здоровье сервиса.
 */
export async function checkHealth(): Promise<HealthResponse> {
  const response = await fetch(`${API_BASE}/health`);
  return handleResponse<HealthResponse>(response);
}

/**
 * Конвертирует один IR код.
 */
export async function convertSingle(
  request: ConvertRequest
): Promise<ConvertResponse> {
  const response = await fetch(`${API_BASE}/convert`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });
  return handleResponse<ConvertResponse>(response);
}

/**
 * Конвертирует SmartIR JSON файл.
 */
export async function convertFile(
  request: FileConvertRequest
): Promise<FileConvertResponse> {
  const response = await fetch(`${API_BASE}/convert/file`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });
  return handleResponse<FileConvertResponse>(response);
}

export { ApiError };

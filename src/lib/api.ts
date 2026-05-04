export type ApiResult<T> = {
  data?: T;
  error?: string;
  fromMock?: boolean;
};

const API_BASE_URL = "/api";

export async function requestApi<T>(
  path: string,
  options?: RequestInit,
): Promise<ApiResult<T>> {
  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const message = await readErrorMessage(response);
      return {
        error: message || `HTTP ${response.status}`,
      };
    }

    return { data: (await response.json()) as T };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "No se pudo conectar con el backend",
    };
  }
}

export function getApiBaseUrl() {
  return "Next.js API routes (/api)";
}

async function readErrorMessage(response: Response) {
  const text = await response.text();

  try {
    const data = JSON.parse(text);
    return typeof data.error === "string" ? data.error : text;
  } catch {
    return text;
  }
}

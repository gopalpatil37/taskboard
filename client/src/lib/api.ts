type ApiSuccess<T> = {
  success: true;
  data: T;
};

type ApiFailure = {
  success: false;
  error: {
    code: string;
    message: string;
  };
};

type ApiEnvelope<T> = ApiSuccess<T> | ApiFailure;

export class ApiError extends Error {
  readonly code: string;
  readonly status: number | undefined;

  constructor(message: string, code: string, status?: number) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
  }
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL.replace(/\/+$/, "");

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isApiFailure(value: unknown): value is ApiFailure {
  if (!isRecord(value) || value.success !== false || !isRecord(value.error)) {
    return false;
  }

  return (
    typeof value.error.code === "string" &&
    typeof value.error.message === "string"
  );
}

function isApiSuccess<T>(value: unknown): value is ApiSuccess<T> {
  return isRecord(value) && value.success === true && "data" in value;
}

async function request<T>(
  method: "GET" | "POST" | "PATCH" | "DELETE",
  path: string,
  body?: unknown,
): Promise<T> {
  if (!API_BASE_URL) {
    throw new ApiError(
      "VITE_API_BASE_URL is not configured.",
      "CONFIGURATION_ERROR",
    );
  }

  const headers: HeadersInit = { Accept: "application/json" };
  let serializedBody: string | undefined;

  if (body !== undefined) {
    try {
      serializedBody = JSON.stringify(body);
    } catch {
      throw new ApiError(
        "Request body could not be serialized as JSON.",
        "INVALID_REQUEST_BODY",
      );
    }

    if (serializedBody === undefined) {
      throw new ApiError(
        "Request body could not be serialized as JSON.",
        "INVALID_REQUEST_BODY",
      );
    }

    headers["Content-Type"] = "application/json";
  }

  let response: Response;
  try {
    response = await fetch(
      `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`,
      {
        method,
        headers,
        body: serializedBody,
        credentials: "include",
      },
    );
  } catch {
    throw new ApiError(
      "Unable to connect to the server. Check your connection and try again.",
      "NETWORK_ERROR",
    );
  }

  let responseText: string;
  try {
    responseText = await response.text();
  } catch {
    throw new ApiError(
      "Could not read the response from the server.",
      "NETWORK_ERROR",
      response.status,
    );
  }

  let payload: unknown;
  try {
    if (!responseText.trim()) {
      throw new SyntaxError("Response body is empty.");
    }
    payload = JSON.parse(responseText) as unknown;
  } catch {
    if (!response.ok) {
      throw new ApiError(
        `Request failed with status ${response.status}.`,
        "HTTP_ERROR",
        response.status,
      );
    }

    throw new ApiError(
      "The server returned an invalid JSON response.",
      "INVALID_RESPONSE",
      response.status,
    );
  }

  if (!response.ok) {
    if (isApiFailure(payload)) {
      throw new ApiError(
        payload.error.message,
        payload.error.code,
        response.status,
      );
    }

    throw new ApiError(
      `Request failed with status ${response.status}.`,
      "HTTP_ERROR",
      response.status,
    );
  }

  const envelope: ApiEnvelope<T> | undefined = isApiSuccess<T>(payload)
    ? payload
    : isApiFailure(payload)
      ? payload
      : undefined;

  if (!envelope) {
    throw new ApiError(
      "The server returned an unexpected response.",
      "INVALID_RESPONSE",
      response.status,
    );
  }

  if (!envelope.success) {
    throw new ApiError(
      envelope.error.message,
      envelope.error.code,
      response.status,
    );
  }

  return envelope.data;
}

/**
 * Calls backend routes and returns the `data` field from successful responses.
 * Pass route paths such as `/api/projects`; the base URL is added automatically.
 */
export const api = {
  /** Fetches a resource, for example `api.get<Project[]>("/api/projects")`. */
  get<T>(path: string): Promise<T> {
    return request<T>("GET", path);
  },

  /** Creates a resource or submits an action, such as `POST /api/projects`. */
  post<TResponse, TBody = unknown>(
    path: string,
    body?: TBody,
  ): Promise<TResponse> {
    return request<TResponse>("POST", path, body);
  },

  /** Partially updates a resource, such as `PATCH /api/tasks/123`. */
  patch<TResponse, TBody = unknown>(
    path: string,
    body: TBody,
  ): Promise<TResponse> {
    return request<TResponse>("PATCH", path, body);
  },

  /** Deletes a resource, such as `DELETE /api/tasks/123`. */
  delete<T>(path: string): Promise<T> {
    return request<T>("DELETE", path);
  },
};

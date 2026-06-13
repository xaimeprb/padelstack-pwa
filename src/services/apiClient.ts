import { auth } from "./firebase";

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

function normalizeApiBaseUrl(value: string) {
  const withoutTrailingSlash = value.trim().replace(/\/+$/, "");
  return withoutTrailingSlash.replace(/\/api\/v1$/i, "");
}

const API_PREFIX = "/api/v1";

function normalizeApiPath(path: string) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const withoutApiPrefix = normalizedPath.replace(/^\/api\/v1(?=\/|$)/i, "");
  return `${API_PREFIX}${withoutApiPrefix}`;
}

const configuredApiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "";
export const apiBaseUrl = normalizeApiBaseUrl(configuredApiBaseUrl);

if (import.meta.env.DEV) {
  if (configuredApiBaseUrl.trim() && configuredApiBaseUrl.trim().replace(/\/+$/, "") !== apiBaseUrl) {
    console.warn("[PADELSTACK PWA] VITE_API_BASE_URL no debe incluir /api/v1; se ha normalizado.");
  }
  console.info("[PADELSTACK PWA] API base URL:", apiBaseUrl || "VITE_API_BASE_URL sin configurar");
}

type RequestOptions = RequestInit & {
  auth?: boolean;
};

async function parseError(response: Response) {
  try {
    const payload = await response.json();
    return payload?.message ?? payload?.error ?? response.statusText;
  } catch {
    return response.statusText;
  }
}

/**
 * Ejecuta una peticion contra la API Spring usando Firebase ID token cuando procede.
 */
export async function apiRequest<T>(path: string, init: RequestOptions = {}): Promise<T> {
  if (!apiBaseUrl) {
    throw new ApiError("VITE_API_BASE_URL no esta configurada.", 0);
  }

  const headers = new Headers(init.headers);
  const shouldAuthenticate = init.auth !== false;
  const isFormData = init.body instanceof FormData;

  if (!isFormData && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (shouldAuthenticate) {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new ApiError("Sesion no valida.", 401);
    }
    headers.set("Authorization", `Bearer ${await currentUser.getIdToken()}`);
  }

  let response: Response;
  try {
    response = await fetch(`${apiBaseUrl}${normalizeApiPath(path)}`, {
      ...init,
      headers,
    });
  } catch (error) {
    console.error("[PADELSTACK PWA] API request failed", error);
    throw new ApiError("No se pudo conectar con la API. Comprueba tu conexion o intentalo de nuevo.", 0);
  }

  if (!response.ok) {
    throw new ApiError(await parseError(response), response.status);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const text = await response.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

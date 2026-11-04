import * as SecureStore from 'expo-secure-store';

const SERVER_URL_KEY = 'server_url';
const REQUEST_TIMEOUT_MS = 20_000;

/** `network`: could not reach the server. `server`: it answered with an error and a message. */
export class ApiError extends Error {
  constructor(
    message: string,
    readonly kind: 'network' | 'server',
    readonly status = 0,
  ) {
    super(message);
  }
}

export function normaliseServerUrl(input: string): string {
  const trimmed = input.trim().replace(/\/+$/, '');
  const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  const url = new URL(withScheme);
  if (url.protocol !== 'https:') throw new Error('The server must use https://');
  return url.origin;
}

export const getServerUrl = () => SecureStore.getItemAsync(SERVER_URL_KEY);
export const saveServerUrl = (url: string) => SecureStore.setItemAsync(SERVER_URL_KEY, url);

/**
 * Calls a Frappe method. The login session lives in the platform cookie jar, so nothing secret is
 * kept in JS and nothing about a request body (faces, signatures) is ever logged.
 * A `guest` call sends no cookies: kiosk requests prove themselves by signature, and a stale admin
 * cookie would only make the server demand a CSRF token.
 */
export async function callMethod<T>(
  method: string,
  args: Record<string, unknown> = {},
  verb: 'GET' | 'POST' = 'POST',
  options: { guest?: boolean } = {},
): Promise<T> {
  const base = await getServerUrl();
  if (!base) throw new ApiError('Server is not configured', 'server');

  const query = verb === 'GET' ? `?${toQuery(args)}` : '';
  const response = await send(
    `${base}/api/method/${method}${query}`,
    {
      method: verb,
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: verb === 'POST' ? JSON.stringify(args) : undefined,
    },
    options.guest ? 'omit' : 'include',
  );
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new ApiError(serverMessage(body) ?? `Server error (${response.status})`, 'server', response.status);
  return body.message as T;
}

async function send(url: string, init: RequestInit, credentials: 'omit' | 'include'): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, credentials, signal: controller.signal });
  } catch {
    throw new ApiError('Cannot reach the server. Check your connection and the server address.', 'network');
  } finally {
    clearTimeout(timer);
  }
}

function toQuery(args: Record<string, unknown>): string {
  return Object.entries(args)
    .filter(([, value]) => value !== undefined && value !== null)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
    .join('&');
}

/** Frappe puts the user-facing text in `_server_messages`, a JSON list of JSON strings. */
export function serverMessage(body: any): string | null {
  try {
    const messages = JSON.parse(body?._server_messages ?? '[]') as string[];
    const text = messages.map((m) => JSON.parse(m).message as string).filter(Boolean).join(' ');
    return text ? text.replace(/<[^>]*>/g, '') : null;
  } catch {
    return null;
  }
}

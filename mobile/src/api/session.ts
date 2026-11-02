import { ApiError, callMethod, getServerUrl } from './http';

/** The logged-in Frappe user, or null when there is no live session (Frappe reports "Guest"). */
export async function currentUser(): Promise<string | null> {
  try {
    const user = await callMethod<string>('frappe.auth.get_logged_user', {}, 'GET');
    return user && user !== 'Guest' ? user : null;
  } catch (error) {
    if (error instanceof ApiError && error.kind === 'server') return null;
    throw error;
  }
}

export async function login(username: string, password: string): Promise<void> {
  const base = await getServerUrl();
  if (!base) throw new ApiError('Server is not configured', 'server');
  let response: Response;
  try {
    response = await fetch(`${base}/api/method/login`, {
      method: 'POST',
      credentials: 'include',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({ usr: username.trim(), pwd: password }),
    });
  } catch {
    throw new ApiError('Cannot reach the server. Check your connection and the server address.', 'network');
  }
  if (!response.ok) {
    throw new ApiError(response.status === 401 ? 'Wrong email or password.' : `Login failed (${response.status}).`, 'server', response.status);
  }
}

export async function logout(): Promise<void> {
  await callMethod('logout').catch(() => undefined);
}

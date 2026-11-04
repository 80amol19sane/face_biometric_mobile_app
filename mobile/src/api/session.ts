import { ApiError, callMethod, getServerUrl } from './http';

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

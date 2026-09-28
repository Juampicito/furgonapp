import type { AuthResponse, Role } from './types';
export const rolePaths: Record<Role, string> = {
  ADMIN: 'admin',
  FURGONISTA: 'furgonista',
  APODERADO: 'apoderado',
  COLEGIO: 'colegio',
};
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}
export async function api<T = void>(path: string, method = 'GET', body?: unknown): Promise<T> {
  const token = typeof window !== 'undefined' ? sessionStorage.getItem('furgon-token') : null;
  const isForm = body instanceof FormData;
  const response = await fetch(`/api${path}`, {
    method,
    headers: {
      ...(token && !path.startsWith('/auth/') ? { Authorization: `Bearer ${token}` } : {}),
      ...(!isForm && body !== undefined ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body === undefined ? undefined : isForm ? body : JSON.stringify(body),
    cache: 'no-store',
  });
  if (!response.ok) {
    const error: { message?: string; errors?: string[] } = await response.json().catch(() => ({}));
    throw new ApiError(
      error.errors?.join(' · ') ||
        error.message ||
        (response.status === 401
          ? 'Tu sesión expiró. Vuelve a ingresar.'
          : 'No se pudo completar la operación.'),
      response.status,
    );
  }
  const text = await response.text();
  return text ? (JSON.parse(text) as T) : (undefined as T);
}
export async function login(email: string, password: string) {
  const data = await api<AuthResponse>('/auth/login', 'POST', { email: email.trim(), password });
  sessionStorage.setItem('furgon-token', data.token);
  return rolePaths[data.user.role];
}
export async function register(body: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: Exclude<Role, 'ADMIN'>;
}) {
  const data = await api<AuthResponse>('/auth/register', 'POST', {
    ...body,
    email: body.email.trim(),
  });
  sessionStorage.setItem('furgon-token', data.token);
  return rolePaths[data.user.role];
}
export function logout() {
  sessionStorage.removeItem('furgon-token');
  window.location.href = '/';
}
export async function uploadImage(file: File) {
  const data = new FormData();
  data.append('file', file);
  return (await api<{ id: string }>('/media', 'POST', data)).id;
}
export async function downloadDocument(id: string, filename: string) {
  const response = await fetch(`/api/documents/${id}/content`, {
    headers: { Authorization: `Bearer ${sessionStorage.getItem('furgon-token')}` },
  });
  if (!response.ok) throw new Error('No se pudo descargar el documento.');
  const url = URL.createObjectURL(await response.blob());
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

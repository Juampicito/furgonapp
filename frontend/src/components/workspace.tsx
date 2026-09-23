'use client';
import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { api, ApiError, logout, rolePaths } from '@/lib/api';
import type { Workspace } from '@/lib/types';
interface WorkspaceContext {
  data: Workspace;
  refresh: () => Promise<void>;
  run: (job: () => Promise<unknown>, success?: string) => Promise<boolean>;
  busy: boolean;
}
const Context = createContext<WorkspaceContext | null>(null);
export function useWorkspace() {
  const context = useContext(Context);
  if (!context) throw new Error('Workspace requerido');
  return context;
}
export function WorkspaceProvider({
  rolePath,
  children,
}: {
  rolePath: string;
  children: ReactNode;
}) {
  const [data, setData] = useState<Workspace | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<{ text: string; error: boolean } | null>(null);
  const refresh = useCallback(async () => {
    const next = await api<Workspace>('/workspace');
    if (rolePaths[next.user.role] !== rolePath) {
      window.location.replace(`/${rolePaths[next.user.role]}`);
      return;
    }
    setData(next);
    setError('');
  }, [rolePath]);
  useEffect(() => {
    refresh().catch((e) => setError(e.message));
  }, [refresh]);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 7000);
    return () => clearTimeout(timer);
  }, [toast]);
  const run = async (job: () => Promise<unknown>, success = 'Cambios guardados') => {
    if (busy) return false;
    setBusy(true);
    try {
      await job();
      await refresh();
      setToast({ text: success, error: false });
      return true;
    } catch (e) {
      setToast({ text: e instanceof Error ? e.message : 'Ocurrió un error.', error: true });
      if (e instanceof ApiError && e.status === 401) setError(e.message);
      return false;
    } finally {
      setBusy(false);
    }
  };
  if (error)
    return (
      <main className="connection-state">
        <h1>No pudimos abrir tu espacio</h1>
        <p>{error}</p>
        <p>Comprueba que el backend esté iniciado.</p>
        <button
          className="button primary"
          onClick={() => refresh().catch((e) => setError(e.message))}
        >
          Reintentar
        </button>
        <button className="button secondary" onClick={logout}>
          Volver al acceso
        </button>
      </main>
    );
  if (!data)
    return (
      <div className="loading" aria-label="Cargando panel">
        <div className="skeleton" />
        <div className="skeleton" />
        <div className="skeleton" />
        <p>Preparando tu espacio…</p>
      </div>
    );
  return (
    <Context.Provider value={{ data, refresh, run, busy }}>
      {children}
      {toast && (
        <div
          role={toast.error ? 'alert' : 'status'}
          className={`toast ${toast.error ? 'error' : ''}`}
        >
          {toast.text}
          <button aria-label="Cerrar mensaje" onClick={() => setToast(null)}>
            ×
          </button>
        </div>
      )}
    </Context.Provider>
  );
}

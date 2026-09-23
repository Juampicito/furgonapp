'use client';
import { useState } from 'react';
import { api } from '@/lib/api';
import { useWorkspace } from '@/components/workspace';
import { Button, Field } from '@/components/ui';
import type { User } from '@/lib/types';
export function ProfileForm({ user, onDone }: { user?: User; onDone?: () => void }) {
  const { data, run, busy } = useWorkspace();
  const current = user ?? data.user;
  const [form, setForm] = useState(current);
  const field = (
    key: 'firstName' | 'lastName' | 'rut' | 'phone' | 'email' | 'address',
    label: string,
    type = 'text',
  ) => (
    <Field label={label}>
      <input
        required={key !== 'address'}
        type={type}
        maxLength={key === 'phone' ? 30 : key === 'rut' ? 20 : 100}
        value={form[key] ?? ''}
        onChange={(e) => setForm({ ...form, [key]: e.target.value })}
      />
    </Field>
  );
  return (
    <form
      className="panel form-panel"
      onSubmit={async (e) => {
        e.preventDefault();
        if (
          await run(() => api(`/users/${current.id}`, 'PUT', form), 'Datos personales actualizados')
        )
          onDone?.();
      }}
    >
      <div className="panel-title">
        <h3>Datos personales</h3>
        <p>Tu información de contacto para coordinar cada viaje.</p>
      </div>
      <div className="form-grid">
        {field('firstName', 'Nombre')}
        {field('lastName', 'Apellido')}
        {field('rut', 'RUT')}
        {field('phone', 'Teléfono', 'tel')}
        {field('email', 'Correo electrónico', 'email')}
        {field('address', 'Dirección')}
      </div>
      <div className="form-footer">
        <Button disabled={busy} type="submit">
          Guardar datos
        </Button>
      </div>
    </form>
  );
}

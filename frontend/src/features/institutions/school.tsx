'use client';
import { useState, type CSSProperties } from 'react';
import { GraduationCap, Palette, Users, MapPin } from 'lucide-react';
import { api, uploadImage } from '@/lib/api';
import { contrastText } from '@/lib/format';
import type { Institution } from '@/lib/types';
import { useWorkspace } from '@/components/workspace';
import { Button, Field, Stat, DriverCard } from '@/components/ui';
export function SchoolPanel() {
  const { data, run, busy } = useWorkspace();
  const institution = data.institutions.find((i) => i.ownerId === data.user.id);
  const [form, setForm] = useState<Omit<Institution, 'id' | 'ownerId'>>(
    institution ?? {
      name: '',
      rbd: '',
      address: '',
      region: 'Región Metropolitana',
      commune: 'Macul',
      phone: '',
      email: data.user.email,
      description: '',
      logoId: null,
      primaryColor: '#178A45',
      secondaryColor: '#FFFFFF',
    },
  );
  const field = (
    key: 'name' | 'rbd' | 'address' | 'region' | 'commune' | 'phone' | 'email',
    label: string,
  ) => (
    <Field label={label}>
      <input
        required={key !== 'rbd'}
        type={key === 'email' ? 'email' : 'text'}
        value={form[key] ?? ''}
        onChange={(e) => setForm({ ...form, [key]: e.target.value })}
      />
    </Field>
  );
  const theme = {
    '--institution-primary': form.primaryColor,
    '--institution-secondary': form.secondaryColor,
    '--on-primary': contrastText(form.primaryColor),
    '--on-secondary': contrastText(form.secondaryColor),
  } as CSSProperties;
  return (
    <>
      <div className="stats-grid three">
        <Stat
          label="Tu comunidad"
          value={data.drivers.length}
          foot="Furgonistas asociados"
          icon={<Users size={20} />}
        />
        <Stat
          label="Establecimiento"
          value={form.commune || '—'}
          foot="Región Metropolitana"
          icon={<MapPin size={20} />}
        />
        <Stat
          label="Identidad institucional"
          value="Tu estilo"
          foot="Una experiencia compartida"
          icon={<Palette size={20} />}
        />
      </div>
      <div className="school-layout">
        <form
          className="panel form-panel"
          onSubmit={async (e) => {
            e.preventDefault();
            await run(
              () =>
                api(
                  institution ? `/institutions/${institution.id}` : '/institutions',
                  institution ? 'PUT' : 'POST',
                  form,
                ),
              'Institución y tema guardados',
            );
          }}
        >
          <div className="panel-title">
            <h3>Información de la institución</h3>
            <p>Así te encontrarán las familias de tu comunidad.</p>
          </div>
          <div className="form-grid">
            {field('name', 'Nombre del establecimiento')}
            {field('rbd', 'RBD (opcional)')}
            {field('address', 'Dirección')}
            {field('region', 'Región')}
            {field('commune', 'Comuna')}
            {field('phone', 'Teléfono')}
            {field('email', 'Correo electrónico')}
          </div>
          <Field label="Descripción">
            <textarea
              rows={3}
              maxLength={2000}
              value={form.description ?? ''}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </Field>
          <h3 className="subheading">Identidad visual</h3>
          <div className="form-grid">
            <Field label="Color principal">
              <div className="color-input">
                <input
                  type="color"
                  value={form.primaryColor}
                  onChange={(e) => setForm({ ...form, primaryColor: e.target.value })}
                />
                <code>{form.primaryColor}</code>
              </div>
            </Field>
            <Field label="Color secundario">
              <div className="color-input">
                <input
                  type="color"
                  value={form.secondaryColor}
                  onChange={(e) => setForm({ ...form, secondaryColor: e.target.value })}
                />
                <code>{form.secondaryColor}</code>
              </div>
            </Field>
          </div>
          <Field label="Logo institucional · PNG o JPEG">
            <input
              type="file"
              accept="image/png,image/jpeg"
              disabled={busy}
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (file)
                  await run(async () => {
                    const logoId = await uploadImage(file);
                    setForm((f) => ({ ...f, logoId }));
                  }, 'Logo cargado. Guarda la institución para aplicarlo.');
              }}
            />
          </Field>
          <div className="form-footer">
            <Button type="submit" disabled={busy}>
              Guardar institución
            </Button>
          </div>
        </form>
        <aside>
          <div className="panel theme-preview" style={theme}>
            <div className="preview-label">
              <Palette size={16} /> VISTA PREVIA EN VIVO
            </div>
            <div className="school-banner">
              {form.logoId ? (
                <img src={`/api/media/${form.logoId}`} alt="Logo institucional" />
              ) : (
                <GraduationCap size={45} />
              )}
              <h2>{form.name || 'Tu institución'}</h2>
              <p>El camino a tu colegio empieza aquí.</p>
            </div>
            <div className="preview-body">
              <h3>Hola, familia 👋</h3>
              <p>Encuentra transporte para tu comunidad.</p>
              <span className="institution-chip">Tu institución seleccionada</span>
              <Button>Buscar transporte</Button>
            </div>
          </div>
          <div className="soft-note">
            <ShieldNote />
            Los colores se aplican a la experiencia del apoderado. El texto ajusta su contraste
            automáticamente.
          </div>
        </aside>
      </div>
      <div className="section-title">
        <div>
          <h2>Furgonistas de tu comunidad</h2>
          <p>Transportistas asociados a tu establecimiento.</p>
        </div>
        <span className="count-pill">{data.drivers.length} furgonistas</span>
      </div>
      <div className="driver-grid">
        {data.drivers.map((d) => (
          <DriverCard key={d.id} driver={d} />
        ))}
      </div>
    </>
  );
}
function ShieldNote() {
  return <Palette size={23} />;
}

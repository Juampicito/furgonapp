'use client';
import { useState } from 'react';
import {
  BusFront,
  Users,
  FileCheck2,
  Clock3,
  Check,
  Upload,
  MapPin,
  ShieldCheck,
  ArrowRight,
  Download,
} from 'lucide-react';
import Link from 'next/link';
import { api, uploadImage, downloadDocument } from '@/lib/api';
import { useWorkspace } from '@/components/workspace';
import { Stat, Badge, Button, Field, Capacity, Avatar } from '@/components/ui';
import { communes, labels } from '@/lib/format';
import type { DocumentType, Vehicle } from '@/lib/types';
import { ProfileForm } from '@/features/profile/profile-form';
import { QuotesPanel } from '@/features/quotes/quotes';
const documentTypes: DocumentType[] = [
  'LICENCIA',
  'ANTECEDENTES',
  'HABILITACION_MENORES',
  'FOTO_CONDUCTOR',
  'FOTO_VEHICULO',
];
export function DriverOverview() {
  const { data } = useWorkspace();
  const driver = data.drivers[0];
  if (!driver) return null;
  const vehicle = driver.vehicle;
  const pending = data.quotes.filter((q) =>
    ['SOLICITADA', 'EN_REVISION'].includes(q.status),
  ).length;
  return (
    <>
      <div className="overview-banner">
        <div>
          <span className="eyebrow">CADA VIAJE CUENTA</span>
          <h2>Tu comunidad se mueve contigo.</h2>
          <p>Todo lo que necesitas para acompañar a tus familias.</p>
          <Link className="text-link" href="/furgonista/perfil">
            Administrar mi perfil <ArrowRight size={17} />
          </Link>
        </div>
        <div className="banner-art">
          <BusFront size={105} strokeWidth={1.1} />
          <span className="art-orbit" />
        </div>
      </div>
      <div className="stats-grid">
        <Stat
          label="Cupos disponibles"
          value={vehicle?.available ?? 0}
          foot={`De ${vehicle?.capacity ?? 0} asientos totales`}
          icon={<Users size={20} />}
        />
        <Stat
          label="Solicitudes pendientes"
          value={pending}
          foot="Familias esperando tu respuesta"
          icon={<Clock3 size={20} />}
        />
        <Stat
          label="Contratos activos"
          value={data.contracts.length}
          foot="Un lugar reservado para cada viaje"
          icon={<FileCheck2 size={20} />}
        />
        <Stat
          label="Ofertas aceptadas"
          value={data.quotes.filter((q) => q.status === 'ACEPTADA').length}
          foot="Acuerdos confirmados"
          icon={<Check size={20} />}
        />
      </div>
      <div className="driver-overview-grid">
        <article className="panel my-vehicle">
          <div className="panel-title row-between">
            <h3>Mi furgón</h3>
            <Link href="/furgonista/perfil">Editar</Link>
          </div>
          <div className="my-vehicle-body">
            {vehicle?.photoId && (
              <img src={`/api/media/${vehicle.photoId}`} alt="Mi vehículo escolar" />
            )}
            <div>
              <h2>
                {vehicle?.brand} {vehicle?.model}
              </h2>
              <p>
                {vehicle?.color} · {vehicle?.manufactureYear}
              </p>
              <span className="plate">{vehicle?.plate ?? 'Sin vehículo'}</span>
              {driver.status === 'APROBADO' ? (
                <p className="success-label">
                  <ShieldCheck size={17} /> Furgón aprobado por el sistema
                </p>
              ) : (
                <Badge status={driver.status} />
              )}
              {vehicle && <Capacity vehicle={vehicle} />}
            </div>
          </div>
        </article>
        <article className="panel coverage-summary">
          <span className="small-icon">
            <MapPin size={22} />
          </span>
          <h3>Mi área de cobertura</h3>
          <p>Región Metropolitana</p>
          <div className="tags">
            {driver.communes.map((c) => (
              <span key={c}>{c}</span>
            ))}
          </div>
          <Link className="text-link" href="/furgonista/cobertura">
            Administrar cobertura <ArrowRight size={15} />
          </Link>
        </article>
      </div>
      <QuotesPanel compact />
    </>
  );
}
export function DriverSetup({ initialStep = 0 }: { initialStep?: number }) {
  const { data, run, busy } = useWorkspace();
  const driver = data.drivers[0];
  const [step, setStep] = useState(initialStep);
  if (!driver) return null;
  return (
    <>
      <div className="setup-heading">
        <div>
          <h2>Tu perfil, listo para el camino</h2>
          <p>Completa la información y solicita una revisión del equipo.</p>
        </div>
        <Badge status={driver.status} />
      </div>
      <div className="steps">
        {['Datos personales', 'Mi vehículo', 'Documentación', 'Área de cobertura'].map(
          (label, i) => (
            <button key={label} className={step === i ? 'active' : ''} onClick={() => setStep(i)}>
              <span>{i + 1}</span>
              {label}
            </button>
          ),
        )}
      </div>
      {step === 0 && (
        <>
          <ProfileForm onDone={() => setStep(1)} />
          <DriverPhoto />
        </>
      )}
      {step === 1 && (
        <VehicleForm vehicle={driver.vehicle} driverId={driver.id} onDone={() => setStep(2)} />
      )}
      {step === 2 && <Documents />}
      {step === 3 && <CoverageForm />}
      <div className="panel verification-callout">
        <ShieldCheck size={30} />
        <div>
          <h3>Verificación del perfil</h3>
          <p>
            Una vez completados los cuatro pasos, un administrador podrá revisar tus documentos y
            aprobar tu perfil. La revisión la realiza el equipo de administración.
          </p>
        </div>
        <Button
          disabled={busy}
          onClick={() =>
            run(
              () => api(`/drivers/${driver.id}/submit`, 'POST'),
              'Perfil enviado a revisión. Ingresa como administrador para aprobarlo.',
            )
          }
        >
          Solicitar revisión
        </Button>
      </div>
    </>
  );
}
function DriverPhoto() {
  const { data, run, busy } = useWorkspace();
  const driver = data.drivers[0];
  const [bio, setBio] = useState(driver.bio ?? '');
  return (
    <div className="panel form-panel">
      <h3>Tu presentación</h3>
      <div className="photo-upload">
        <Avatar photoId={driver.photoId} initials={driver.initials} large />
        <Field label="Foto de perfil · PNG o JPEG">
          <input
            type="file"
            accept="image/png,image/jpeg"
            disabled={busy}
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (file)
                await run(async () => {
                  const photoId = await uploadImage(file);
                  await api(`/drivers/${driver.id}`, 'PUT', { bio, photoId });
                }, 'Fotografía de perfil actualizada');
            }}
          />
        </Field>
      </div>
      <Field label="Acerca de tu servicio">
        <textarea maxLength={2000} rows={3} value={bio} onChange={(e) => setBio(e.target.value)} />
      </Field>
      <Button
        disabled={busy}
        onClick={() =>
          run(() => api(`/drivers/${driver.id}`, 'PUT', { bio, photoId: driver.photoId }))
        }
      >
        Guardar presentación
      </Button>
    </div>
  );
}
function VehicleForm({
  vehicle,
  driverId,
  onDone,
}: {
  vehicle: Vehicle | null;
  driverId: string;
  onDone: () => void;
}) {
  const { run, busy } = useWorkspace();
  const [form, setForm] = useState<Omit<Vehicle, 'id' | 'occupied' | 'available'>>(
    vehicle ?? {
      plate: '',
      brand: '',
      model: '',
      manufactureYear: 2022,
      color: 'Blanco',
      capacity: 20,
      photoId: null,
    },
  );
  return (
    <form
      className="panel form-panel"
      onSubmit={async (e) => {
        e.preventDefault();
        if (
          await run(() => api(`/drivers/${driverId}/vehicle`, 'PUT', form), 'Vehículo actualizado')
        )
          onDone();
      }}
    >
      <div className="panel-title">
        <h3>Datos de tu vehículo</h3>
        <p>La capacidad determina cuántos contratos puedes mantener activos.</p>
      </div>
      <div className="form-grid">
        {(['plate', 'brand', 'model', 'color'] as const).map((key, i) => (
          <Field key={key} label={['Patente', 'Marca', 'Modelo', 'Color'][i]}>
            <input
              required
              value={form[key]}
              onChange={(e) => setForm({ ...form, [key]: e.target.value })}
            />
          </Field>
        ))}
        <Field label="Año">
          <input
            type="number"
            min={1980}
            max={2030}
            required
            value={form.manufactureYear}
            onChange={(e) => setForm({ ...form, manufactureYear: Number(e.target.value) })}
          />
        </Field>
        <Field label="Capacidad total de pasajeros">
          <input
            type="number"
            min={1}
            max={60}
            required
            value={form.capacity}
            onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) })}
          />
        </Field>
      </div>
      <div className="photo-upload">
        {form.photoId && (
          <img
            className="vehicle-thumb"
            alt="Fotografía del furgón"
            src={`/api/media/${form.photoId}`}
          />
        )}
        <Field label="Fotografía del furgón · PNG o JPEG">
          <input
            type="file"
            accept="image/png,image/jpeg"
            disabled={busy}
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (file)
                await run(async () => {
                  const photoId = await uploadImage(file);
                  setForm((f) => ({ ...f, photoId }));
                }, 'Fotografía cargada. Guarda el vehículo para aplicarla.');
            }}
          />
        </Field>
      </div>
      <p className="soft-note">
        Cambiar los datos del vehículo requiere una nueva revisión del perfil.
      </p>
      <div className="form-footer">
        <Button disabled={busy}>Guardar vehículo y continuar</Button>
      </div>
    </form>
  );
}
export function Documents() {
  const { data, run, busy } = useWorkspace();
  const driver = data.drivers[0];
  return (
    <div className="panel form-panel">
      <div className="panel-title">
        <h3>Documentación</h3>
        <p>
          Archivos privados, disponibles solo para ti y el administrador. Máximo 5 MB por archivo.
        </p>
      </div>
      <div className="document-list">
        {documentTypes.map((type) => {
          const doc = data.documents?.find((d) => d.type === type);
          return (
            <div className="document-row" key={type}>
              <span className="small-icon">
                <FileCheck2 size={23} />
              </span>
              <div className="document-name">
                <h4>{labels[type]}</h4>
                <small>{doc?.filename ?? 'Aún no has subido este documento'}</small>
                {doc?.reviewNote && <p className="review-note">Revisión: {doc.reviewNote}</p>}
              </div>
              {doc && <Badge status={doc.status} />}
              {doc && (
                <button
                  className="icon-button"
                  aria-label={`Descargar ${labels[type]}`}
                  onClick={() =>
                    run(() => downloadDocument(doc.id, doc.filename), 'Documento descargado')
                  }
                >
                  <Download size={19} />
                </button>
              )}
              <label className={`button secondary upload-button ${busy ? 'disabled' : ''}`}>
                <Upload size={16} /> {doc ? 'Reemplazar' : 'Subir'}
                <input
                  type="file"
                  disabled={busy}
                  aria-label={`Subir ${labels[type]}`}
                  accept={
                    type.startsWith('FOTO_') ? 'image/png,image/jpeg' : '.pdf,image/png,image/jpeg'
                  }
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const form = new FormData();
                      form.append('file', file);
                      form.append('type', type);
                      await run(
                        () => api(`/drivers/${driver.id}/documents`, 'POST', form),
                        'Documento recibido. Pendiente de revisión.',
                      );
                      e.target.value = '';
                    }
                  }}
                />
              </label>
            </div>
          );
        })}
      </div>
    </div>
  );
}
export function CoverageForm() {
  const { data, run, busy } = useWorkspace();
  const driver = data.drivers[0];
  const [selected, setSelected] = useState(driver.communes);
  const [schools, setSchools] = useState(driver.institutionIds);
  const [region, setRegion] = useState('Región Metropolitana');
  return (
    <form
      className="panel form-panel"
      onSubmit={async (e) => {
        e.preventDefault();
        await run(
          () =>
            api(`/drivers/${driver.id}/coverage`, 'PUT', {
              region,
              communes: selected,
              institutionIds: schools,
            }),
          'Cobertura actualizada',
        );
      }}
    >
      <div className="panel-title">
        <h3>Área de cobertura</h3>
        <p>Selecciona las comunas y los colegios que puedes atender.</p>
      </div>
      <Field label="Región">
        <input required value={region} onChange={(e) => setRegion(e.target.value)} />
      </Field>
      <h4>Comunas de trabajo</h4>
      <div className="checkbox-grid">
        {communes.map((c) => (
          <label className={selected.includes(c) ? 'checked' : ''} key={c}>
            <input
              type="checkbox"
              checked={selected.includes(c)}
              onChange={(e) =>
                setSelected(e.target.checked ? [...selected, c] : selected.filter((x) => x !== c))
              }
            />
            {c}
          </label>
        ))}
      </div>
      <h4>Instituciones atendidas</h4>
      <div className="checkbox-grid">
        {data.institutions.map((i) => (
          <label key={i.id} className={schools.includes(i.id) ? 'checked' : ''}>
            <input
              type="checkbox"
              checked={schools.includes(i.id)}
              onChange={(e) =>
                setSchools(
                  e.target.checked ? [...schools, i.id] : schools.filter((x) => x !== i.id),
                )
              }
            />
            {i.name}
          </label>
        ))}
      </div>
      <div className="form-footer">
        <Button disabled={busy}>Guardar cobertura</Button>
      </div>
    </form>
  );
}

'use client';
import { useState } from 'react';
import {
  Users,
  BusFront,
  FileCheck2,
  GraduationCap,
  Download,
  Check,
  X,
  Pencil,
} from 'lucide-react';
import { useWorkspace } from '@/components/workspace';
import { Button, Stat, Badge, Modal, Field, Capacity, Empty } from '@/components/ui';
import { api, downloadDocument } from '@/lib/api';
import { labels, date } from '@/lib/format';
import type { DriverDocument, User } from '@/lib/types';
import { ProfileForm } from '@/features/profile/profile-form';
import { QuotesPanel, ContractsPanel } from '@/features/quotes/quotes';
export function AdminPanel({ section }: { section: string }) {
  const { data, run, busy } = useWorkspace();
  const [review, setReview] = useState<DriverDocument | null>(null);
  const [note, setNote] = useState('');
  const [edit, setEdit] = useState<User | null>(null);
  const [toggle, setToggle] = useState<User | null>(null);
  const [filter, setFilter] = useState('');
  const docs = (data.documents ?? []).filter((d) => !filter || d.driverId === filter);
  const pending = data.documents?.filter((d) => d.status === 'PENDIENTE').length ?? 0;
  if (section === 'cotizaciones') return <QuotesPanel />;
  if (section === 'contratos') return <ContractsPanel />;
  return (
    <>
      {section === 'inicio' && (
        <>
          <div className="stats-grid">
            <Stat
              label="Usuarios"
              value={data.users?.length ?? 0}
              foot="Cuentas en la plataforma"
              icon={<Users size={20} />}
            />
            <Stat
              label="Furgonistas"
              value={data.drivers.length}
              foot={`${data.drivers.filter((d) => d.status === 'APROBADO').length} perfiles aprobados`}
              icon={<BusFront size={20} />}
            />
            <Stat
              label="Por revisar"
              value={pending}
              foot="Documentos pendientes"
              icon={<FileCheck2 size={20} />}
            />
            <Stat
              label="Instituciones"
              value={data.institutions.length}
              foot="Comunidades conectadas"
              icon={<GraduationCap size={20} />}
            />
          </div>
          <div className="soft-note">
            <ShieldText />
            La aprobación de documentos en esta versión es manual y simulada. No se consultan
            registros gubernamentales.
          </div>
        </>
      )}
      {['inicio', 'furgonistas', 'vehiculos', 'cupos'].includes(section) && (
        <>
          <div className="section-title">
            <div>
              <h2>Furgonistas y capacidad</h2>
              <p>Revisa los perfiles y supervisa los cupos de cada vehículo.</p>
            </div>
          </div>
          <div className="table-wrap panel">
            <table>
              <thead>
                <tr>
                  <th>Furgonista</th>
                  <th>Vehículo</th>
                  <th>Estado</th>
                  <th>Cupos</th>
                  <th>Revisión del perfil</th>
                </tr>
              </thead>
              <tbody>
                {data.drivers.map((d) => (
                  <tr key={d.id}>
                    <td>
                      <strong>{d.name}</strong>
                      <small>{d.communes.join(' · ')}</small>
                    </td>
                    <td>
                      {d.vehicle?.brand} {d.vehicle?.model}
                      <small>{d.vehicle?.plate}</small>
                    </td>
                    <td>
                      <Badge status={d.status} />
                    </td>
                    <td>{d.vehicle && <Capacity vehicle={d.vehicle} />}</td>
                    <td>
                      <div className="actions">
                        <Button
                          variant="secondary"
                          disabled={busy}
                          onClick={() =>
                            run(
                              () => api(`/admin/drivers/${d.id}`, 'PATCH', { status: 'APROBADO' }),
                              'Perfil aprobado',
                            )
                          }
                        >
                          Aprobar
                        </Button>
                        <Button
                          variant="ghost"
                          disabled={busy}
                          onClick={() =>
                            run(
                              () =>
                                api(`/admin/drivers/${d.id}`, 'PATCH', {
                                  status: 'RECHAZADO',
                                  reason: 'Perfil rechazado en revisión administrativa',
                                }),
                              'Perfil rechazado',
                            )
                          }
                        >
                          Rechazar
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
      {['inicio', 'documentos'].includes(section) && (
        <>
          <div className="section-title">
            <div>
              <h2>Revisión documental</h2>
              <p>Los archivos privados solo son visibles para su dueño y administración.</p>
            </div>
            <select
              aria-label="Filtrar documentos por furgonista"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="">Todos los furgonistas</option>
              {data.drivers.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
          <div className="table-wrap panel">
            <table>
              <thead>
                <tr>
                  <th>Documento</th>
                  <th>Furgonista</th>
                  <th>Estado</th>
                  <th>Actualizado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {docs.map((d) => (
                  <tr key={d.id}>
                    <td>
                      <strong>{labels[d.type]}</strong>
                      <small>{d.filename}</small>
                    </td>
                    <td>{data.drivers.find((x) => x.id === d.driverId)?.name}</td>
                    <td>
                      <Badge status={d.status} />
                    </td>
                    <td>{date(d.updatedAt)}</td>
                    <td>
                      <div className="actions">
                        <button
                          className="icon-button"
                          title="Descargar documento"
                          aria-label={`Descargar ${d.filename}`}
                          onClick={() =>
                            run(() => downloadDocument(d.id, d.filename), 'Documento descargado')
                          }
                        >
                          <Download size={17} />
                        </button>
                        <Button
                          variant="secondary"
                          onClick={() => {
                            setReview(d);
                            setNote(d.reviewNote ?? '');
                          }}
                        >
                          Revisar
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
      {['usuarios', 'apoderados'].includes(section) && (
        <>
          <div className="section-title">
            <h2>{section === 'apoderados' ? 'Apoderados' : 'Usuarios del sistema'}</h2>
          </div>
          <div className="table-wrap panel">
            <table>
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Contacto</th>
                  <th>Rol</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {data.users
                  ?.filter((u) => section !== 'apoderados' || u.role === 'APODERADO')
                  .map((u) => (
                    <tr key={u.id}>
                      <td>
                        <strong>
                          {u.firstName} {u.lastName}
                        </strong>
                        <small>{u.rut}</small>
                      </td>
                      <td>
                        {u.email}
                        <small>{u.phone}</small>
                      </td>
                      <td>{u.role}</td>
                      <td>
                        <Badge status={u.active ? 'ACTIVO' : 'RECHAZADO'}>
                          {u.active ? 'Activa' : 'Desactivada'}
                        </Badge>
                      </td>
                      <td>
                        <div className="actions">
                          <button
                            aria-label={`Editar ${u.firstName}`}
                            className="icon-button"
                            onClick={() => setEdit(u)}
                          >
                            <Pencil size={17} />
                          </button>
                          <Button
                            variant="secondary"
                            disabled={busy || u.id === data.user.id}
                            onClick={() => setToggle(u)}
                          >
                            {u.active ? 'Desactivar' : 'Activar'}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </>
      )}
      {section === 'colegios' && (
        <>
          <h2 className="subheading">Instituciones</h2>
          <div className="institution-grid">
            {data.institutions.map((i) => (
              <div className="panel institution-card" key={i.id}>
                <h3>{i.name}</h3>
                <p>
                  {i.commune} · {i.address}
                </p>
                <p>{i.email}</p>
                <div className="tags">
                  <span style={{ background: i.primaryColor, width: 35, height: 25 }} />
                  <span style={{ background: i.secondaryColor, width: 35, height: 25 }} />
                </div>
              </div>
            ))}
          </div>
        </>
      )}
      {review && (
        <Modal title="Revisar documento" onClose={() => setReview(null)}>
          <h3>{labels[review.type]}</h3>
          <p>{data.drivers.find((d) => d.id === review.driverId)?.name}</p>
          <Field label="Observación de la revisión">
            <textarea
              maxLength={255}
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </Field>
          <div className="modal-actions">
            {(['RECHAZADO', 'PENDIENTE', 'APROBADO'] as const).map((status) => (
              <Button
                key={status}
                disabled={busy}
                variant={
                  status === 'APROBADO'
                    ? 'primary'
                    : status === 'RECHAZADO'
                      ? 'danger'
                      : 'secondary'
                }
                onClick={async () => {
                  if (
                    await run(
                      () => api(`/admin/documents/${review.id}`, 'PATCH', { status, note }),
                      'Revisión guardada',
                    )
                  )
                    setReview(null);
                }}
              >
                {status === 'APROBADO' ? (
                  <Check size={16} />
                ) : status === 'RECHAZADO' ? (
                  <X size={16} />
                ) : null}
                {status === 'APROBADO'
                  ? 'Aprobar'
                  : status === 'RECHAZADO'
                    ? 'Rechazar'
                    : 'Pendiente'}
              </Button>
            ))}
          </div>
        </Modal>
      )}
      {edit && (
        <Modal title="Editar usuario" onClose={() => setEdit(null)}>
          <ProfileForm key={edit.id} user={edit} onDone={() => setEdit(null)} />
        </Modal>
      )}
      {toggle && (
        <Modal
          title={`${toggle.active ? 'Desactivar' : 'Activar'} cuenta`}
          onClose={() => setToggle(null)}
        >
          <p>
            La cuenta de {toggle.firstName} {toggle.lastName}{' '}
            {toggle.active
              ? 'perderá acceso al sistema y, si es furgonista, dejará de aparecer en las búsquedas.'
              : 'recuperará el acceso al sistema.'}
          </p>
          <div className="modal-actions">
            <Button variant="secondary" onClick={() => setToggle(null)}>
              Volver
            </Button>
            <Button
              disabled={busy}
              onClick={async () => {
                if (
                  await run(
                    () =>
                      api(`/admin/users/${toggle.id}/active`, 'PATCH', { active: !toggle.active }),
                    'Estado de la cuenta actualizado',
                  )
                )
                  setToggle(null);
              }}
            >
              Confirmar
            </Button>
          </div>
        </Modal>
      )}
    </>
  );
}
function ShieldText() {
  return <FileCheck2 size={22} />;
}

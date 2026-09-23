'use client';
import { useState } from 'react';
import { Check, FileCheck2, ArrowUpRight, MessageSquare, Phone, Mail } from 'lucide-react';
import { useWorkspace } from '@/components/workspace';
import { Button, Badge, Empty, Modal, Field } from '@/components/ui';
import { api } from '@/lib/api';
import { money, date } from '@/lib/format';
import type { Quote } from '@/lib/types';
export function QuotesPanel({ compact = false }: { compact?: boolean }) {
  const { data, run, busy } = useWorkspace();
  const [selected, setSelected] = useState<Quote | null>(null);
  const [price, setPrice] = useState(78000);
  const [accept, setAccept] = useState<Quote | null>(null);
  const [reject, setReject] = useState<Quote | null>(null);
  const isDriver = data.user.role === 'FURGONISTA';
  const isGuardian = data.user.role === 'APODERADO';
  const pending = data.quotes.filter((q) =>
    ['SOLICITADA', 'EN_REVISION', 'OFERTA_ENVIADA'].includes(q.status),
  );
  const quotes = compact ? pending.slice(0, 4) : data.quotes;
  return (
    <>
      <div className="section-title">
        <div>
          <h2>{compact ? 'Solicitudes recientes' : 'Mis cotizaciones'}</h2>
          <p>
            {isDriver
              ? 'Cada solicitud, una nueva familia en tu camino.'
              : 'Sigue tus solicitudes y elige el mejor viaje.'}
          </p>
        </div>
        <span className="count-pill">{pending.length} pendientes</span>
      </div>
      {quotes.length === 0 ? (
        <Empty title="Todo al día">
          {isDriver
            ? 'Las nuevas solicitudes de las familias aparecerán aquí.'
            : 'Tus cotizaciones aparecerán aquí cuando contactes a un furgonista.'}
        </Empty>
      ) : (
        <div className="quote-list">
          {quotes.map((q) => (
            <article className="panel quote-card" key={q.id}>
              <div className="quote-heading">
                <span className="quote-icon">
                  <MessageSquare size={22} />
                </span>
                <div>
                  <h3>{isDriver ? q.guardianName : q.driverName}</h3>
                  <p>
                    {q.institutionName} · {q.commune}
                  </p>
                </div>
                <Badge status={q.status} />
              </div>
              <div className="quote-details">
                <div>
                  <small>Origen del viaje</small>
                  <strong>{q.address}</strong>
                </div>
                <div>
                  <small>Estimado FurgonApp · simulado</small>
                  <strong>
                    {money(q.suggestedPrice)} <span>/ mes</span>
                  </strong>
                </div>
                <div>
                  <small>Oferta del furgonista</small>
                  <strong>
                    {q.offeredPrice ? money(q.offeredPrice) : 'Por confirmar'}{' '}
                    {q.offeredPrice ? <span>/ mes</span> : null}
                  </strong>
                </div>
              </div>
              {isDriver && (
                <div className="contact-row">
                  <a href={`tel:${q.guardianPhone}`}>
                    <Phone size={14} />
                    {q.guardianPhone}
                  </a>
                  <a href={`mailto:${q.guardianEmail}`}>
                    <Mail size={14} />
                    {q.guardianEmail}
                  </a>
                </div>
              )}
              <div className="quote-footer">
                <span className="muted">Solicitada el {date(q.createdAt)}</span>
                <div className="actions">
                  {['SOLICITADA', 'EN_REVISION', 'OFERTA_ENVIADA'].includes(q.status) &&
                    (isDriver || isGuardian) && (
                      <Button variant="ghost" disabled={busy} onClick={() => setReject(q)}>
                        {isGuardian && q.status !== 'OFERTA_ENVIADA'
                          ? 'Cancelar solicitud'
                          : 'Rechazar'}
                      </Button>
                    )}
                  {isDriver && q.status === 'SOLICITADA' && (
                    <Button
                      variant="secondary"
                      disabled={busy}
                      onClick={() =>
                        run(() => api(`/quotes/${q.id}/review`, 'POST'), 'Solicitud en revisión')
                      }
                    >
                      Revisar
                    </Button>
                  )}
                  {isDriver && ['SOLICITADA', 'EN_REVISION'].includes(q.status) && (
                    <Button
                      disabled={busy}
                      onClick={() => {
                        setSelected(q);
                        setPrice(q.suggestedPrice);
                      }}
                    >
                      Enviar oferta <ArrowUpRight size={16} />
                    </Button>
                  )}
                  {isGuardian && q.status === 'OFERTA_ENVIADA' && (
                    <Button disabled={busy} onClick={() => setAccept(q)}>
                      <Check size={17} /> Aceptar oferta
                    </Button>
                  )}
                  {q.status === 'ACEPTADA' && (
                    <span className="success-label">
                      <FileCheck2 size={16} /> Contrato activo · cupo reservado
                    </span>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
      {selected && (
        <Modal title="Enviar una oferta" onClose={() => setSelected(null)}>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (
                await run(
                  () => api(`/quotes/${selected.id}/offer`, 'POST', { monthlyPrice: price }),
                  'Oferta enviada al apoderado',
                )
              )
                setSelected(null);
            }}
          >
            <p>
              Para {selected.guardianName} · {selected.institutionName}
            </p>
            <div className="estimate">
              <small>Valor sugerido FurgonApp</small>
              <strong>{money(selected.suggestedPrice)} / mes</strong>
            </div>
            <Field label="Tu oferta mensual (CLP)">
              <input
                type="number"
                required
                min={1}
                step={1}
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
              />
            </Field>
            <p className="muted">
              Máximo permitido:{' '}
              {money(selected.suggestedPrice * (1 + data.maxPriceDeviationPercentage / 100))} (
              {data.maxPriceDeviationPercentage}% sobre el valor sugerido).
            </p>
            <div className="modal-actions">
              <Button variant="secondary" type="button" onClick={() => setSelected(null)}>
                Volver
              </Button>
              <Button disabled={busy}>Enviar oferta</Button>
            </div>
          </form>
        </Modal>
      )}
      {accept && (
        <Modal title="Confirma tu próximo viaje" onClose={() => setAccept(null)}>
          <p>
            Al aceptar la oferta de <strong>{accept.driverName}</strong>, reservaremos un cupo y
            crearemos tu contrato.
          </p>
          <div className="estimate">
            <small>Valor mensual acordado</small>
            <strong>{money(accept.offeredPrice ?? 0)}</strong>
          </div>
          <p className="muted">
            No se realizará ningún cobro. El sistema de pagos está pendiente de implementación.
          </p>
          <div className="modal-actions">
            <Button variant="secondary" onClick={() => setAccept(null)}>
              Volver
            </Button>
            <Button
              disabled={busy}
              onClick={async () => {
                if (
                  await run(
                    () => api(`/quotes/${accept.id}/accept`, 'POST'),
                    'Oferta aceptada. Contrato activo y cupo reservado.',
                  )
                )
                  setAccept(null);
              }}
            >
              <Check size={17} /> Confirmar aceptación
            </Button>
          </div>
        </Modal>
      )}
      {reject && (
        <Modal title="¿Cerrar esta cotización?" onClose={() => setReject(null)}>
          <p>La solicitud quedará cerrada. Si lo necesitas, podrás iniciar una nueva cotización.</p>
          <div className="modal-actions">
            <Button variant="secondary" onClick={() => setReject(null)}>
              Volver
            </Button>
            <Button
              variant="danger"
              disabled={busy}
              onClick={async () => {
                if (
                  await run(() => api(`/quotes/${reject.id}/reject`, 'POST'), 'Cotización cerrada')
                )
                  setReject(null);
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
export function ContractsPanel() {
  const { data } = useWorkspace();
  return (
    <>
      <div className="section-title">
        <div>
          <h2>Contratos activos</h2>
          <p>Un acuerdo claro, un cupo reservado.</p>
        </div>
      </div>
      {!data.contracts.length ? (
        <Empty title="Tu próximo viaje está por comenzar">
          Al aceptar una oferta, el contrato aparecerá aquí.
        </Empty>
      ) : (
        <div className="contract-grid">
          {data.contracts.map((c) => (
            <article className="panel contract-card" key={c.id}>
              <div className="row-between">
                <FileCheck2 size={27} className="green" />
                <Badge status={c.status} />
              </div>
              <h3>{data.user.role === 'FURGONISTA' ? c.guardianName : c.driverName}</h3>
              <p>{c.institutionName}</p>
              <strong className="contract-price">
                {money(c.monthlyPrice)} <small>/ mes</small>
              </strong>
              <div className="contract-foot">
                <span>
                  <Check size={16} /> 1 cupo reservado
                </span>
                <small>Desde {date(c.createdAt)}</small>
              </div>
              <p className="payment-note">Pago pendiente de implementación</p>
            </article>
          ))}
        </div>
      )}
    </>
  );
}

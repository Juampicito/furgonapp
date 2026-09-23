'use client';
import {
  useEffect,
  useRef,
  useId,
  cloneElement,
  isValidElement,
  type ReactNode,
  type ButtonHTMLAttributes,
} from 'react';
import { X, ShieldCheck, BusFront, ArrowRight, Inbox } from 'lucide-react';
import { labels, money } from '@/lib/format';
import type { Driver, Vehicle } from '@/lib/types';
export function Button({
  children,
  variant = 'primary',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
}) {
  return (
    <button className={`button ${variant}`} {...props}>
      {children}
    </button>
  );
}
export function Badge({ status, children }: { status?: string; children?: ReactNode }) {
  return (
    <span
      className={`badge ${status === 'APROBADO' || status === 'ACTIVO' || status === 'ACEPTADA' ? 'positive' : status?.includes('RECHAZ') || status === 'CANCELADA' ? 'negative' : 'pending'}`}
    >
      {children || labels[status || ''] || status}
    </span>
  );
}
export function Empty({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="empty">
      <Inbox size={34} />
      <h3>{title}</h3>
      <div>{children}</div>
    </div>
  );
}
export function Stat({
  label,
  value,
  foot,
  icon,
}: {
  label: string;
  value: ReactNode;
  foot: string;
  icon: ReactNode;
}) {
  return (
    <div className="stat">
      <div className="stat-top">
        <span>{label}</span>
        <span className="stat-icon">{icon}</span>
      </div>
      <strong>{value}</strong>
      <small>{foot}</small>
    </div>
  );
}
export function Avatar({
  photoId,
  initials,
  large = false,
}: {
  photoId?: string | null;
  initials: string;
  large?: boolean;
}) {
  return (
    <div className={`avatar ${large ? 'large' : ''}`}>
      {photoId ? <img src={`/api/media/${photoId}`} alt="" /> : initials}
    </div>
  );
}
export function Capacity({ vehicle }: { vehicle: Vehicle }) {
  return (
    <div className="capacity">
      <div>
        <span>
          {vehicle.occupied} de {vehicle.capacity} ocupados
        </span>
        <strong>{vehicle.available} disponibles</strong>
      </div>
      <progress max={vehicle.capacity} value={vehicle.occupied} aria-label="Cupos ocupados" />
    </div>
  );
}
export function DriverCard({
  driver,
  onSelect,
  suggestedPrice,
}: {
  driver: Driver;
  onSelect?: () => void;
  suggestedPrice?: number;
}) {
  return (
    <article className="driver-card">
      <div className="driver-head">
        <Avatar photoId={driver.photoId} initials={driver.initials} />
        <div>
          <h3>{driver.name}</h3>
          <span className="muted">Transporte escolar</span>
        </div>
        <ShieldCheck size={21} className="green" />
      </div>
      <div className="vehicle-preview">
        {driver.vehicle?.photoId ? (
          <img
            alt={`Furgón ${driver.vehicle.brand} ${driver.vehicle.model}`}
            src={`/api/media/${driver.vehicle.photoId}`}
          />
        ) : (
          <BusFront size={60} />
        )}
        <span>
          {driver.vehicle?.brand} {driver.vehicle?.model}
        </span>
      </div>
      <div className="driver-info">
        <Badge status={driver.status} />
        <p>{driver.communes.join(' · ')}</p>
        {driver.vehicle && <Capacity vehicle={driver.vehicle} />}
        {suggestedPrice !== undefined && (
          <div className="card-price">
            <small>Valor sugerido · simulado</small>
            <strong>
              {money(suggestedPrice)} <span>/ mes</span>
            </strong>
          </div>
        )}
        {onSelect && (
          <Button variant="secondary" onClick={onSelect}>
            Ver perfil y cotizar <ArrowRight size={16} />
          </Button>
        )}
      </div>
    </article>
  );
}
export function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);
  return (
    <dialog
      className="modal"
      ref={ref}
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
      aria-label={title}
    >
      <div className="modal-head">
        <h2>{title}</h2>
        <button className="icon-button" onClick={onClose} aria-label="Cerrar">
          <X size={20} />
        </button>
      </div>
      {children}
    </dialog>
  );
}
export function Field({ label, children }: { label: string; children: ReactNode }) {
  const labelId = useId();
  return (
    <label className="field">
      <span id={labelId}>{label}</span>
      {isValidElement<{ 'aria-labelledby'?: string }>(children) &&
      typeof children.type === 'string' &&
      ['input', 'select', 'textarea'].includes(children.type)
        ? cloneElement(children, { 'aria-labelledby': labelId })
        : children}
    </label>
  );
}

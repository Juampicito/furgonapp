'use client';
import { useState } from 'react';
import Link from 'next/link';
import {
  BusFront,
  LayoutDashboard,
  Users,
  GraduationCap,
  FileCheck2,
  MessageSquare,
  Bell,
  MapPin,
  LogOut,
  ChevronDown,
  Menu,
  X,
  RefreshCw,
  ShieldCheck,
  UserRound,
  ArrowUpRight,
  Armchair,
} from 'lucide-react';
import { useWorkspace } from './workspace';
import { Avatar, Button, Empty } from './ui';
import { api, logout, rolePaths } from '@/lib/api';
import { date } from '@/lib/format';
import type { Role } from '@/lib/types';
import {
  DriverOverview,
  DriverSetup,
  Documents,
  CoverageForm,
} from '@/features/drivers/driver-panel';
import { GuardianPanel } from '@/features/guardians/guardian-panel';
import { SchoolPanel } from '@/features/institutions/school';
import { QuotesPanel, ContractsPanel } from '@/features/quotes/quotes';
import { ProfileForm } from '@/features/profile/profile-form';
import { AdminPanel } from '@/features/admin/admin-panel';
const nav = {
  ADMIN: [
    ['inicio', 'Vista general', LayoutDashboard],
    ['usuarios', 'Usuarios', Users],
    ['furgonistas', 'Furgonistas', BusFront],
    ['apoderados', 'Apoderados', UserRound],
    ['colegios', 'Colegios', GraduationCap],
    ['vehiculos', 'Vehículos', BusFront],
    ['documentos', 'Documentación', FileCheck2],
    ['cotizaciones', 'Cotizaciones', MessageSquare],
    ['contratos', 'Contratos', FileCheck2],
    ['cupos', 'Cupos', Armchair],
  ],
  FURGONISTA: [
    ['inicio', 'Vista general', LayoutDashboard],
    ['perfil', 'Mi perfil y vehículo', BusFront],
    ['documentos', 'Documentación', FileCheck2],
    ['cobertura', 'Área de cobertura', MapPin],
    ['cotizaciones', 'Cotizaciones', MessageSquare],
    ['contratos', 'Contratos', FileCheck2],
  ],
  APODERADO: [
    ['inicio', 'Mis instituciones', GraduationCap],
    ['cotizaciones', 'Mis cotizaciones', MessageSquare],
    ['contratos', 'Mis contratos', FileCheck2],
    ['perfil', 'Mi perfil', UserRound],
  ],
  COLEGIO: [
    ['inicio', 'Mi institución', GraduationCap],
    ['perfil', 'Mi cuenta', UserRound],
  ],
} as const;
const roleNames: Record<Role, string> = {
  ADMIN: 'Administrador',
  FURGONISTA: 'Furgonista',
  APODERADO: 'Apoderado',
  COLEGIO: 'Colegio',
};
export function Dashboard({ section }: { section: string }) {
  const { data, run, busy } = useWorkspace();
  const [menu, setMenu] = useState(false);
  const role = data.user.role;
  const root = `/${rolePaths[role]}`;
  const unread = data.notifications.filter((n) => !n.read).length;
  const active = nav[role].find((item) => item[0] === section);
  const title =
    section === 'notificaciones' ? 'Notificaciones' : (active?.[1] ?? 'Página no encontrada');
  const content = () => {
    if (section === 'notificaciones') return <Notifications />;
    if (!active)
      return (
        <Empty title="Esta sección no existe">
          <Link href={root}>Volver al inicio</Link>
        </Empty>
      );
    if (role === 'ADMIN') return <AdminPanel section={section} />;
    if (section === 'cotizaciones') return <QuotesPanel />;
    if (section === 'contratos') return <ContractsPanel />;
    if (role === 'FURGONISTA') {
      if (section === 'inicio') return <DriverOverview />;
      if (section === 'perfil') return <DriverSetup />;
      if (section === 'documentos') return <Documents />;
      if (section === 'cobertura') return <CoverageForm />;
    }
    if (section === 'perfil') return <ProfileForm />;
    if (role === 'COLEGIO') return <SchoolPanel />;
    return <GuardianPanel />;
  };
  return (
    <div className="app-shell">
      {menu && (
        <button className="sidebar-scrim" aria-label="Cerrar menú" onClick={() => setMenu(false)} />
      )}
      <aside className={`sidebar ${menu ? 'open' : ''}`}>
        <Link href={root} className="brand">
          <span className="brand-icon">
            <BusFront size={24} />
          </span>
          Furgon<span>App</span>
          <i />
        </Link>
        <div className="workspace-label">
          <span>
            {role === 'ADMIN' ? <ShieldCheck size={16} /> : <BusFront size={16} />}
            {roleNames[role]}
          </span>
          <ChevronDown size={15} />
        </div>
        <span className="nav-caption">MI ESPACIO</span>
        <nav>
          {nav[role].map(([path, label, Icon]) => (
            <Link
              key={path}
              onClick={() => setMenu(false)}
              className={section === path ? 'active' : ''}
              href={`${root}${path === 'inicio' ? '' : `/${path}`}`}
            >
              <Icon size={19} />
              {label}
              {path === 'cotizaciones' &&
                data.quotes.some((q) => ['SOLICITADA', 'OFERTA_ENVIADA'].includes(q.status)) && (
                  <span className="nav-dot" />
                )}
            </Link>
          ))}
          <Link
            className={section === 'notificaciones' ? 'active' : ''}
            href={`${root}/notificaciones`}
            onClick={() => setMenu(false)}
          >
            <Bell size={19} />
            Notificaciones{unread > 0 && <span className="nav-number">{unread}</span>}
          </Link>
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-note">
            <ShieldCheck size={22} />
            <strong>Juntos, en cada trayecto.</strong>
            <p>Un espacio para conectar a tu comunidad.</p>
          </div>
          <button className="switch-role" onClick={logout}>
            <LogOut size={17} />
            Cambiar de perfil
            <ArrowUpRight size={15} />
          </button>
          <div className="sidebar-user">
            <Avatar initials={`${data.user.firstName[0]}${data.user.lastName[0]}`} />
            <div>
              <strong>
                {data.user.firstName} {data.user.lastName}
              </strong>
              <small>{roleNames[role]} · Demo</small>
            </div>
          </div>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <div>
            <button
              className="icon-button mobile-menu"
              onClick={() => setMenu(!menu)}
              aria-label="Abrir menú"
            >
              {menu ? <X size={21} /> : <Menu size={21} />}
            </button>
            <span className="breadcrumb">
              Mi espacio <span>/</span> <strong>{title}</strong>
            </span>
          </div>
          <div className="topbar-actions">
            <span className="demo-pill">
              <span /> Modo demo
            </span>
            <button
              className="icon-button"
              aria-label="Actualizar panel"
              disabled={busy}
              onClick={() => run(async () => {}, 'Panel actualizado')}
            >
              <RefreshCw size={18} />
            </button>
            <Link
              href={`${root}/notificaciones`}
              className="notification-button"
              aria-label={`Notificaciones: ${unread} sin leer`}
            >
              <Bell size={21} />
              {unread > 0 && <i />}
            </Link>
            <Avatar initials={`${data.user.firstName[0]}${data.user.lastName[0]}`} />
          </div>
        </header>
        <main className="dashboard-content">
          <div className="page-heading">
            <div>
              <span className="eyebrow">
                {role === 'ADMIN' ? 'EL PULSO DE TU COMUNIDAD' : 'QUÉ BUENO TENERTE POR AQUÍ'}
              </span>
              <h1>
                {section === 'inicio'
                  ? role === 'COLEGIO'
                    ? 'Tu institución, más conectada'
                    : `Hola, ${data.user.firstName} 👋`
                  : title}
              </h1>
              <p>
                {section === 'inicio'
                  ? 'Todo listo para seguir acompañando cada viaje.'
                  : 'Organiza tu día con toda la información a mano.'}
              </p>
            </div>
            <span className="today">
              {new Intl.DateTimeFormat('es-CL', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
              }).format(new Date())}
            </span>
          </div>
          {content()}
          <footer className="dashboard-footer">
            <span>FurgonApp · Conectamos tu comunidad</span>
            <span>Primera edición / Demo</span>
          </footer>
        </main>
      </div>
    </div>
  );
}
function Notifications() {
  const { data, run, busy } = useWorkspace();
  return (
    <>
      {!data.notifications.length ? (
        <Empty title="No tienes notificaciones">
          Las novedades de tus solicitudes aparecerán aquí.
        </Empty>
      ) : (
        <div className="notification-list">
          {[...data.notifications]
            .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
            .map((n) => (
              <article className={`panel notification-card ${!n.read ? 'unread' : ''}`} key={n.id}>
                <span className="small-icon">
                  <Bell size={21} />
                </span>
                <div>
                  <h3>{n.title}</h3>
                  <p>{n.message}</p>
                  <small>{date(n.createdAt)}</small>
                </div>
                {!n.read && (
                  <Button
                    variant="secondary"
                    disabled={busy}
                    onClick={() =>
                      run(() => api(`/notifications/${n.id}/read`, 'POST'), 'Notificación leída')
                    }
                  >
                    Marcar leída
                  </Button>
                )}
              </article>
            ))}
        </div>
      )}
    </>
  );
}

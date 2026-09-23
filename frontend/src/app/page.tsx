'use client';
import { useEffect, useState } from 'react';
import {
  ArrowRight,
  BusFront,
  GraduationCap,
  HeartHandshake,
  ShieldCheck,
  MapPin,
  Check,
  LoaderCircle,
} from 'lucide-react';
import { api, login } from '@/lib/api';
import type { Role } from '@/lib/types';
const roles = [
  {
    role: 'APODERADO' as Role,
    title: 'Soy apoderado',
    description: 'Un viaje seguro para quienes más quieres.',
    icon: HeartHandshake,
    label: 'Entrar como Apoderado',
  },
  {
    role: 'FURGONISTA' as Role,
    title: 'Soy furgonista',
    description: 'Tu servicio, tus rutas y tus familias, en un lugar.',
    icon: BusFront,
    label: 'Entrar como Furgonista',
  },
  {
    role: 'COLEGIO' as Role,
    title: 'Soy un colegio',
    description: 'Conecta tu comunidad con un mejor transporte.',
    icon: GraduationCap,
    label: 'Entrar como Colegio',
  },
  {
    role: 'ADMIN' as Role,
    title: 'Administración',
    description: 'Acompaña y supervisa toda la plataforma.',
    icon: ShieldCheck,
    label: 'Entrar como Administrador',
  },
];
export default function Home() {
  const [busy, setBusy] = useState<Role | null>(null);
  const [error, setError] = useState('');
  const [demo, setDemo] = useState<boolean | null>(null);
  useEffect(() => {
    api<{ demo: boolean }>('/auth/config')
      .then((r) => setDemo(r.demo))
      .catch(() =>
        setError('No se pudo conectar con el backend. Inícialo y vuelve a cargar esta página.'),
      );
  }, []);
  const enter = async (role: Role) => {
    setBusy(role);
    setError('');
    try {
      window.location.href = `/${await login(role)}`;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo ingresar');
      setBusy(null);
    }
  };
  return (
    <main className="welcome">
      <header className="welcome-nav">
        <a href="/" className="brand">
          <span className="brand-icon">
            <BusFront size={24} />
          </span>
          Furgon<span>App</span>
          <i />
        </a>
        <span className="demo-pill">
          <span /> Entorno de demostración
        </span>
      </header>
      <div className="welcome-body">
        <section className="welcome-intro">
          <span className="eyebrow">CONECTAMOS CAMINOS, ACERCAMOS FAMILIAS</span>
          <h1>
            Un buen viaje
            <br />
            empieza <em>aquí.</em>
          </h1>
          <p>
            El transporte escolar de tu comunidad,
            <br className="desktop-only" /> más simple, cercano y organizado.
          </p>
          <div className="welcome-illustration" aria-hidden="true">
            <div className="road road-one" />
            <div className="road road-two" />
            <span className="map-marker marker-school">
              <GraduationCap size={29} />
            </span>
            <span className="map-marker marker-home">
              <HeartHandshake size={26} />
            </span>
            <div className="bus-art">
              <BusFront size={82} strokeWidth={1.3} />
              <span>FurgonApp</span>
            </div>
            <div className="floating-proof">
              <span>
                <Check size={18} />
              </span>
              Conectados en cada trayecto
            </div>
            <span className="map-dot dot-one" />
            <span className="map-dot dot-two" />
          </div>
          <div className="welcome-benefits">
            <span>
              <ShieldCheck size={17} /> Perfiles revisados
            </span>
            <span>
              <MapPin size={17} /> Tu comunidad, más cerca
            </span>
          </div>
        </section>
        <section className="access">
          <span className="eyebrow">TU ESPACIO EN FURGONAPP</span>
          <h2>¿Cómo quieres ingresar?</h2>
          <p>Elige un perfil y explora la experiencia.</p>
          <div className="access-roles">
            {roles.map(({ role, title, description, icon: Icon, label }) => (
              <button
                key={role}
                aria-label={label}
                className="access-card"
                disabled={!!busy || demo !== true}
                onClick={() => enter(role)}
              >
                <span className={`access-icon ${role.toLowerCase()}`}>
                  <Icon size={25} />
                </span>
                <span>
                  <strong>{title}</strong>
                  <small>{description}</small>
                </span>
                {busy === role ? (
                  <LoaderCircle className="spin" size={20} />
                ) : (
                  <ArrowRight size={20} />
                )}
              </button>
            ))}
          </div>
          {error && (
            <div role="alert" className="inline-error">
              {error}
            </div>
          )}
          {demo === false && (
            <div className="inline-error">
              El acceso de desarrollo está deshabilitado. Inicia el backend con el perfil demo para
              recorrer esta versión.
            </div>
          )}
          <div className="demo-note">
            <ShieldCheck size={18} />
            <p>
              <strong>Un espacio para explorar.</strong>
              <br />
              Accesos temporales con datos de prueba. Las verificaciones son simuladas y no se
              realizan cobros.
            </p>
          </div>
        </section>
      </div>
      <footer className="welcome-footer">
        <span>Hecho para acompañar a tu comunidad.</span>
        <span>FurgonApp · Primera edición</span>
      </footer>
    </main>
  );
}

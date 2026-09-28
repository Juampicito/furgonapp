'use client';
import { useState } from 'react';
import {
  BusFront,
  GraduationCap,
  HeartHandshake,
  ShieldCheck,
  ArrowRight,
  Eye,
  EyeOff,
} from 'lucide-react';
import { login, register } from '@/lib/api';
import { Button, Field } from '@/components/ui';
import type { Role } from '@/lib/types';

export default function Home() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [role, setRole] = useState<Exclude<Role, 'ADMIN'>>('APODERADO');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
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
        <span className="auth-header-note">Tu comunidad, más cerca</span>
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
          </div>
          <div className="welcome-benefits">
            <span>
              <ShieldCheck size={17} /> Tu cuenta personal
            </span>
            <span>
              <HeartHandshake size={17} /> Tu comunidad escolar
            </span>
          </div>
        </section>
        <section className="access auth-access">
          <div className="auth-tabs" aria-label="Acceso a la plataforma">
            <button
              type="button"
              aria-pressed={mode === 'login'}
              onClick={() => {
                setMode('login');
                setError('');
                setPassword('');
              }}
            >
              Iniciar sesión
            </button>
            <button
              type="button"
              aria-pressed={mode === 'register'}
              onClick={() => {
                setMode('register');
                setError('');
                setPassword('');
                setConfirmation('');
              }}
            >
              Crear cuenta
            </button>
          </div>
          <span className="eyebrow">TU ESPACIO EN FURGONAPP</span>
          <h2>{mode === 'login' ? 'Qué bueno verte de nuevo' : 'Empieza a conectar'}</h2>
          <p>
            {mode === 'login'
              ? 'Ingresa con tu correo y contraseña.'
              : 'Crea tu cuenta y completa tu perfil para comenzar.'}
          </p>
          <form
            className="auth-form"
            onSubmit={async (e) => {
              e.preventDefault();
              setError('');
              if (mode === 'register' && password !== confirmation) {
                setError('Las contraseñas no coinciden.');
                return;
              }
              setBusy(true);
              try {
                const destination =
                  mode === 'login'
                    ? await login(email, password)
                    : await register({ email, password, firstName, lastName, role });
                window.location.assign('/' + destination);
              } catch (error) {
                setError(error instanceof Error ? error.message : 'No se pudo ingresar.');
                setBusy(false);
              }
            }}
          >
            {mode === 'register' && (
              <>
                <Field label="Tipo de cuenta">
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as Exclude<Role, 'ADMIN'>)}
                  >
                    <option value="APODERADO">Apoderado</option>
                    <option value="FURGONISTA">Furgonista</option>
                    <option value="COLEGIO">Colegio</option>
                  </select>
                </Field>
                <div className="auth-names">
                  <Field label="Nombre">
                    <input
                      required
                      maxLength={100}
                      autoComplete="given-name"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                    />
                  </Field>
                  <Field label="Apellido">
                    <input
                      required
                      maxLength={100}
                      autoComplete="family-name"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                    />
                  </Field>
                </div>
              </>
            )}
            <Field label="Correo electrónico">
              <input
                type="email"
                required
                maxLength={254}
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </Field>
            <div className="auth-password">
              <Field label="Contraseña">
                <input
                  type={visible ? 'text' : 'password'}
                  required
                  minLength={mode === 'register' ? 12 : undefined}
                  maxLength={72}
                  autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </Field>
              <button
                type="button"
                className="icon-button"
                aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                onClick={() => setVisible(!visible)}
              >
                {visible ? <EyeOff size={19} /> : <Eye size={19} />}
              </button>
            </div>
            {mode === 'register' && (
              <>
                <small className="muted">
                  Usa al menos 12 caracteres. Puedes utilizar una frase larga.
                </small>
                <Field label="Confirmar contraseña">
                  <input
                    type={visible ? 'text' : 'password'}
                    required
                    minLength={12}
                    maxLength={72}
                    autoComplete="new-password"
                    value={confirmation}
                    onChange={(e) => setConfirmation(e.target.value)}
                  />
                </Field>
                {role === 'FURGONISTA' && (
                  <p className="soft-note">
                    Antes de recibir solicitudes tendrás que completar tus datos, registrar tu
                    vehículo y enviar tus documentos a revisión.
                  </p>
                )}
                {role === 'COLEGIO' && (
                  <p className="soft-note">
                    Después de registrarte, completa los datos de tu institución en tu panel.
                  </p>
                )}
              </>
            )}
            {error && (
              <div role="alert" className="inline-error">
                {error}
              </div>
            )}
            <Button disabled={busy}>
              {busy ? 'Un momento…' : mode === 'login' ? 'Ingresar' : 'Registrarme'}
              <ArrowRight size={18} />
            </Button>
          </form>
        </section>
      </div>
      <footer className="welcome-footer">
        <span>Hecho para acompañar a tu comunidad.</span>
        <span>FurgonApp</span>
      </footer>
    </main>
  );
}

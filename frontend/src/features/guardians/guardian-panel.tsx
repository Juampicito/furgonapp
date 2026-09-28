'use client';
import { useRef, useState, type CSSProperties } from 'react';
import {
  Search,
  GraduationCap,
  Plus,
  ArrowRight,
  MapPin,
  ShieldCheck,
  Check,
  BusFront,
  FileCheck2,
  Heart,
} from 'lucide-react';
import { useWorkspace } from '@/components/workspace';
import { Button, Stat, Empty, Modal, DriverCard, Avatar, Capacity, Field } from '@/components/ui';
import { api } from '@/lib/api';
import { contrastText, labels, money } from '@/lib/format';
import { PickupMap } from '@/components/pickup-map';
import type { PickupLocation } from '@/lib/google-maps';
import type { Driver, Institution } from '@/lib/types';
export function GuardianPanel() {
  const { data, run, busy } = useWorkspace();
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<Institution | null>(null);
  const [remove, setRemove] = useState<Institution | null>(null);
  const saved = data.institutions.filter((i) => data.savedInstitutionIds?.includes(i.id));
  const available = data.institutions.filter(
    (i) =>
      !data.savedInstitutionIds?.includes(i.id) &&
      `${i.name} ${i.commune}`.toLocaleLowerCase().includes(query.toLocaleLowerCase()),
  );
  if (selected)
    return (
      <InstitutionSpace
        institution={data.institutions.find((i) => i.id === selected.id) ?? selected}
        onBack={() => setSelected(null)}
      />
    );
  return (
    <>
      <div className="overview-banner guardian-banner">
        <div>
          <span className="eyebrow">CERCA DE LO QUE MÁS IMPORTA</span>
          <h2>El próximo viaje empieza en tu colegio.</h2>
          <p>Encuentra a los furgonistas de tu comunidad y viaja con tranquilidad.</p>
          <a href="#buscar-colegio" className="text-link">
            Encontrar mi institución <ArrowRight size={17} />
          </a>
        </div>
        <div className="banner-art">
          <GraduationCap size={115} strokeWidth={1.1} />
        </div>
      </div>
      <div className="stats-grid three">
        <Stat
          label="Mis instituciones"
          value={saved.length}
          foot="Tu comunidad en un solo lugar"
          icon={<GraduationCap size={20} />}
        />
        <Stat
          label="Cotizaciones abiertas"
          value={
            data.quotes.filter((q) =>
              ['SOLICITADA', 'EN_REVISION', 'OFERTA_ENVIADA'].includes(q.status),
            ).length
          }
          foot="Sigue el estado de tus solicitudes"
          icon={<BusFront size={20} />}
        />
        <Stat
          label="Viajes confirmados"
          value={data.contracts.length}
          foot="Contratos con cupo reservado"
          icon={<FileCheck2 size={20} />}
        />
      </div>
      <div className="section-title">
        <div>
          <h2>Mis instituciones</h2>
          <p>Selecciona un colegio para encontrar transporte.</p>
        </div>
        <Heart size={20} className="muted" />
      </div>
      {!saved.length ? (
        <Empty title="Tu comunidad te espera">
          Busca y guarda una institución para comenzar. Puedes agregar más de una.
        </Empty>
      ) : (
        <div className="institution-grid">
          {saved.map((i) => (
            <article className="panel institution-card" key={i.id}>
              <div className="institution-top" style={{ borderColor: i.primaryColor }}>
                {i.logoId ? (
                  <img alt={`Logo ${i.name}`} src={`/api/media/${i.logoId}`} />
                ) : (
                  <GraduationCap size={38} />
                )}
                <span className="saved-label">
                  <Check size={14} /> Guardada
                </span>
              </div>
              <h3>{i.name}</h3>
              <p>
                <MapPin size={15} />
                {i.commune}
              </p>
              <div className="row-between">
                <Button variant="secondary" onClick={() => setSelected(i)}>
                  Entrar al colegio <ArrowRight size={16} />
                </Button>
                <button
                  className="icon-button"
                  title="Quitar institución"
                  aria-label={`Quitar ${i.name}`}
                  onClick={() => setRemove(i)}
                >
                  ×
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
      <section className="panel institution-search" id="buscar-colegio">
        <div className="panel-title">
          <h3>Encuentra tu institución</h3>
          <p>Un mismo espacio para todos los colegios de tu familia.</p>
        </div>
        <div className="search-input">
          <Search size={19} />
          <input
            aria-label="Buscar institución"
            placeholder="Busca por nombre del colegio o comuna…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="school-results">
          {available.map((i) => (
            <div className="school-result" key={i.id}>
              <span className="small-icon">
                <GraduationCap size={23} />
              </span>
              <div>
                <h4>{i.name}</h4>
                <small>
                  {i.commune} · {i.region}
                </small>
              </div>
              <Button
                variant="secondary"
                disabled={busy}
                onClick={() =>
                  run(
                    () => api(`/guardians/me/institutions/${i.id}`, 'POST'),
                    'Institución guardada',
                  )
                }
              >
                <Plus size={16} /> Guardar institución
              </Button>
            </div>
          ))}
          {!available.length && (
            <p className="muted">No hay más instituciones que coincidan con tu búsqueda.</p>
          )}
        </div>
      </section>
      {remove && (
        <Modal title="¿Quitar institución?" onClose={() => setRemove(null)}>
          <p>
            {remove.name} dejará de aparecer en tus instituciones guardadas. Tus contratos se
            conservarán.
          </p>
          <div className="modal-actions">
            <Button variant="secondary" onClick={() => setRemove(null)}>
              Volver
            </Button>
            <Button
              variant="danger"
              disabled={busy}
              onClick={async () => {
                if (
                  await run(
                    () => api(`/guardians/me/institutions/${remove.id}`, 'DELETE'),
                    'Institución quitada',
                  )
                )
                  setRemove(null);
              }}
            >
              Quitar institución
            </Button>
          </div>
        </Modal>
      )}
    </>
  );
}
function InstitutionSpace({
  institution,
  onBack,
}: {
  institution: Institution;
  onBack: () => void;
}) {
  const { run, busy } = useWorkspace();
  const [pickup, setPickup] = useState<PickupLocation | null>(null);
  const pickupVersion = useRef(0);
  const [results, setResults] = useState<Driver[] | null>(null);
  const [suggestedPrice, setSuggestedPrice] = useState<number | undefined>();
  const [selected, setSelected] = useState<Driver | null>(null);
  const [searched, setSearched] = useState({ address: '', commune: '' });
  const theme = {
    '--institution-primary': institution.primaryColor,
    '--institution-secondary': institution.secondaryColor,
    '--on-primary': contrastText(institution.primaryColor),
    '--on-secondary': contrastText(institution.secondaryColor),
  } as CSSProperties;
  return (
    <section style={theme} className="institution-space">
      <button className="back-link" onClick={onBack}>
        ← Mis instituciones
      </button>
      <div className="institution-hero">
        <div>
          {institution.logoId ? (
            <img src={`/api/media/${institution.logoId}`} alt="Logo del colegio" />
          ) : (
            <GraduationCap size={50} />
          )}
          <span className="eyebrow">TU COMUNIDAD, TU CAMINO</span>
          <h2>{institution.name}</h2>
          <p>Un viaje seguro empieza con una buena conexión.</p>
        </div>
        <span className="institution-chip">
          <MapPin size={15} />
          {institution.commune}
        </span>
      </div>
      <form
        className="panel trip-search"
        onSubmit={async (e) => {
          e.preventDefault();
          if (!pickup) return;
          const { address, commune } = pickup;
          const version = pickupVersion.current;
          await run(async () => {
            const query = `institutionId=${institution.id}&commune=${encodeURIComponent(commune)}`;
            const [found, estimate] = await Promise.all([
              api<Driver[]>(`/search/drivers?${query}`),
              api<{ suggestedPrice: number }>(`/pricing/estimate?${query}`),
            ]);
            if (version !== pickupVersion.current) return;
            setResults(found);
            setSuggestedPrice(estimate.suggestedPrice);
            setSearched({ address, commune });
          }, 'Búsqueda actualizada');
        }}
      >
        <div className="panel-title">
          <h3>¿Desde dónde viajará el estudiante?</h3>
          <p>
            Busca tu dirección en Google Maps y revisa el punto de recogida. Buscaremos furgonistas
            con cobertura en esa comuna.
          </p>
        </div>
        <PickupMap
          onChange={(location) => {
            pickupVersion.current++;
            setPickup(location);
            setResults(null);
            setSelected(null);
          }}
        />
        <div className="pickup-actions">
          <Button disabled={busy || !pickup}>
            <Search size={18} /> Buscar furgonistas
          </Button>
        </div>
      </form>
      {results === null ? (
        <Empty title="Busquemos tu próximo viaje">
          Selecciona una dirección de Google Maps para ver furgonistas compatibles.
        </Empty>
      ) : (
        <>
          <div className="section-title">
            <div>
              <h2>Furgonistas para tu familia</h2>
              <p>Aprobados, con cupos y cobertura en {searched.commune}.</p>
            </div>
            <span className="count-pill">{results.length} disponibles</span>
          </div>
          {results.length ? (
            <div className="driver-grid">
              {results.map((d) => (
                <DriverCard
                  key={d.id}
                  driver={d}
                  suggestedPrice={suggestedPrice}
                  onSelect={() => setSelected(d)}
                />
              ))}
            </div>
          ) : (
            <Empty title="No encontramos furgonistas disponibles">
              Prueba otra comuna o vuelve más adelante.
            </Empty>
          )}
        </>
      )}
      {selected && (
        <Modal title="Conoce a tu furgonista" onClose={() => setSelected(null)}>
          <div className="public-profile">
            <div className="driver-head">
              <Avatar photoId={selected.photoId} initials={selected.initials} large />
              <div>
                <h2>{selected.name}</h2>
                <p className="success-label">
                  <ShieldCheck size={17} /> Furgón aprobado por el sistema
                </p>
              </div>
            </div>
            <p>{selected.bio}</p>
            {suggestedPrice !== undefined && (
              <div className="estimate">
                <small>Valor sugerido FurgonApp · estimación simulada</small>
                <strong>{money(suggestedPrice)} / mes</strong>
              </div>
            )}
            {selected.vehicle && (
              <>
                <div className="public-vehicle">
                  {selected.vehicle.photoId && (
                    <img alt="Vehículo escolar" src={`/api/media/${selected.vehicle.photoId}`} />
                  )}
                  <div>
                    <h3>
                      {selected.vehicle.brand} {selected.vehicle.model}
                    </h3>
                    <p>
                      {selected.vehicle.color} · {selected.vehicle.manufactureYear}
                    </p>
                    <p>Patente {selected.vehicle.plate}</p>
                  </div>
                </div>
                <Capacity vehicle={selected.vehicle} />
              </>
            )}
            <h4>Trabaja en</h4>
            <div className="tags">
              {selected.communes.map((c) => (
                <span key={c}>{c}</span>
              ))}
            </div>
            <h4>Verificaciones del sistema</h4>
            <div className="verified-list">
              {selected.verifiedDocuments.map((t) => (
                <p key={t}>
                  <Check size={16} /> {labels[t]} verificada
                </p>
              ))}
            </div>
            <p className="muted">
              Documentos revisados manualmente por administración. Los documentos completos son
              privados.
            </p>
            <div className="soft-note">
              Al solicitar una cotización verás el valor sugerido por FurgonApp. El furgonista podrá
              responder con una oferta mensual.
            </div>
            <Button
              disabled={busy}
              onClick={async () => {
                if (
                  await run(
                    () =>
                      api('/quotes', 'POST', {
                        driverId: selected.id,
                        institutionId: institution.id,
                        address: searched.address,
                        commune: searched.commune,
                      }),
                    'Cotización solicitada. Revisa el valor sugerido en Mis cotizaciones.',
                  )
                )
                  setSelected(null);
              }}
            >
              Solicitar cotización <ArrowRight size={17} />
            </Button>
          </div>
        </Modal>
      )}
    </section>
  );
}

'use client';
import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { searchInstitutions } from '@/lib/institution-search';
import { GraduationCap, MapPin, Search } from 'lucide-react';
import { loadGoogleMaps } from '@/lib/google-maps';
import type { Institution } from '@/lib/types';
import { Button } from '@/components/ui';

export function hasInstitutionLocation(i: Institution) {
  return !!i.placeId && typeof i.latitude === 'number' && Number.isFinite(i.latitude) &&
    typeof i.longitude === 'number' && Number.isFinite(i.longitude);
}

export function InstitutionMap({ institutions, selectedIds, onChoose, actionLabel, selectedActionLabel, busy = false }: {
  institutions: Institution[];
  selectedIds: string[];
  onChoose: (institution: Institution) => void;
  actionLabel: string;
  selectedActionLabel: string;
  busy?: boolean;
}) {
  const host = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [suggesting, setSuggesting] = useState(false);
  const [activeSuggestion, setActiveSuggestion] = useState(-1);
  const suggestionsId = useId();
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const markers = useRef(new Map<string, google.maps.marker.AdvancedMarkerElement>());
  const [markersReady, setMarkersReady] = useState(0);
  const results = useMemo(() => searchInstitutions(institutions, query), [institutions, query]);
  const suggestions = results.slice(0, 8);
  const suggestionsOpen = suggesting && !!query.trim();
  function focusInstitution(institution: Institution) {
    setQuery(institution.name);
    setFocusedId(institution.id);
    setSuggesting(false);
    setActiveSuggestion(-1);
  }
  const located = useMemo(() => institutions.filter(hasInstitutionLocation), [institutions]);
  const focused = institutions.find(i => i.id === focusedId);

  useEffect(() => {
    let disposed = false;
    const fail = () => setError('Google Maps no está disponible. Revisa la conexión o inténtalo de nuevo.');
    window.addEventListener('furgon-maps-error', fail);
    async function setup() {
      try {
        const response = await fetch('/maps-config');
        if (!response.ok) throw new Error('No se pudo cargar la configuración del mapa.');
        const { key } = await response.json();
        if (!key) throw new Error('Google Maps pendiente de activación. Falta configurar la clave del servicio.');
        await loadGoogleMaps(key);
        const { Map } = await google.maps.importLibrary('maps') as google.maps.MapsLibrary;
        if (!disposed && host.current) setMap(new Map(host.current, {
          center: { lat: -33.4489, lng: -70.6693 }, zoom: 10, mapId: 'DEMO_MAP_ID',
          streetViewControl: false, mapTypeControl: false, gestureHandling: 'cooperative',
        }));
      } catch (failure) {
        if (!disposed) setError(failure instanceof Error ? failure.message : 'No se pudo cargar el mapa.');
      }
    }
    void setup();
    return () => { disposed = true; window.removeEventListener('furgon-maps-error', fail); };
  }, []);

  useEffect(() => {
    if (!map) return;
    let disposed = false;
    const created: google.maps.marker.AdvancedMarkerElement[] = [];
    const listeners: google.maps.MapsEventListener[] = [];
    const cleanups: (() => void)[] = [];
    const info = new google.maps.InfoWindow();
    async function populate() {
      const { AdvancedMarkerElement } = await google.maps.importLibrary('marker') as google.maps.MarkerLibrary;
      if (disposed) return;
      for (const i of located) {
        const pin = document.createElement('button');
        pin.type = 'button';
        pin.className = 'institution-pin';
        pin.setAttribute('aria-label', `Ubicar ${i.name}`);
        pin.title = i.name;
        pin.textContent = '🎓';
        const marker = new AdvancedMarkerElement({ map, position: { lat: i.latitude!, lng: i.longitude! }, title: i.name, content: pin });
        markers.current.set(i.id, marker);
        created.push(marker);
        const show = () => {
          const content = document.createElement('div');
          const name = document.createElement('strong');
          name.textContent = i.name;
          const address = document.createElement('p');
          address.textContent = i.address;
          content.append(name, address);
          info.setContent(content);
          info.open({ map, anchor: marker, shouldFocus: false });
        };
        const hide = () => info.close();
        const select = () => { setFocusedId(i.id); show(); };
        pin.addEventListener('mouseenter', show);
        pin.addEventListener('mouseleave', hide);
        pin.addEventListener('focus', show);
        pin.addEventListener('blur', hide);
        pin.addEventListener('click', select);
        cleanups.push(() => {
          pin.removeEventListener('mouseenter', show); pin.removeEventListener('mouseleave', hide);
          pin.removeEventListener('focus', show); pin.removeEventListener('blur', hide); pin.removeEventListener('click', select);
        });
        listeners.push(marker.addListener('click', select));
      }
      setMarkersReady(version => version + 1);
    }
    void populate().catch(() => { if (!disposed) setError('No se pudieron cargar los marcadores. Puedes seleccionar una institución en la lista.'); });
    return () => {
      disposed = true; info.close(); listeners.forEach(l => l.remove()); cleanups.forEach(clean => clean());
      created.forEach(m => { m.map = null; }); markers.current.clear();
    };
  }, [map, located]);

  useEffect(() => {
    if (!map || !markersReady) return;
    const targets = focused ? [focused].filter(hasInstitutionLocation) : results.filter(hasInstitutionLocation);
    for (const i of located) {
      const pin = markers.current.get(i.id)?.content as HTMLButtonElement | undefined;
      if (pin) {
        pin.classList.toggle('selected', selectedIds.includes(i.id));
        pin.classList.toggle('dimmed', !!query && !results.some(r => r.id === i.id));
      }
    }
    if (targets.length === 1) {
      map.setCenter({ lat: targets[0].latitude!, lng: targets[0].longitude! });
      map.setZoom(16);
    } else if (targets.length > 1) {
      const bounds = new google.maps.LatLngBounds();
      targets.forEach(i => bounds.extend({ lat: i.latitude!, lng: i.longitude! }));
      map.fitBounds(bounds, 55);
    }
  }, [map, markersReady, results, focused, query, selectedIds, located]);

  return (
    <div className="institution-directory">
      <div className="institution-search" onBlur={e => { if (!e.currentTarget.contains(e.relatedTarget)) setSuggesting(false); }}>
      <div className="search-input">
        <Search size={19} />
        <input role="combobox" aria-label="Buscar institución por nombre" aria-autocomplete="list" aria-expanded={suggestionsOpen}
          aria-controls={suggestionsId} aria-activedescendant={suggestionsOpen && activeSuggestion >= 0 ? `${suggestionsId}-${activeSuggestion}` : undefined}
          autoComplete="off" placeholder="Escribe el nombre de tu institución…" value={query}
          onFocus={() => setSuggesting(true)}
          onChange={e => { setQuery(e.target.value); setFocusedId(null); setSuggesting(true); setActiveSuggestion(-1); }}
          onKeyDown={e => {
            if (e.key === 'Escape') { setSuggesting(false); setActiveSuggestion(-1); }
            if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
              e.preventDefault(); setSuggesting(true);
              setActiveSuggestion(index => suggestions.length ? (index + (e.key === 'ArrowDown' ? 1 : -1) + suggestions.length) % suggestions.length : -1);
            }
            if (e.key === 'Enter' && suggestionsOpen && suggestions.length) { e.preventDefault(); focusInstitution(suggestions[Math.max(0, activeSuggestion)]); }
          }} />
      </div>
      {suggestionsOpen && <div id={suggestionsId} role="listbox" aria-label="Colegios sugeridos" className="institution-suggestions">
        {suggestions.map((i, index) => <button type="button" role="option" id={`${suggestionsId}-${index}`} aria-selected={index === activeSuggestion}
          key={i.id} onMouseDown={e => e.preventDefault()} onClick={() => focusInstitution(i)}>
          <strong>{i.name}</strong><small>{i.commune} · {i.address}</small>
        </button>)}
        {!suggestions.length && <p role="status">No encontramos ese colegio. Prueba con una parte de su nombre.</p>}
      </div>}
      </div>
      <div className="institution-directory-map">
        <div ref={host} aria-label="Mapa de instituciones inscritas" style={{ height: '100%', width: '100%' }} />
        {(!map || error) && <div className="map-placeholder"><MapPin size={30} /><p role={error ? 'alert' : 'status'}>{error || 'Cargando instituciones en Google Maps…'}</p></div>}
      </div>
      <p className="muted">Busca por nombre para enfocar el mapa. Pasa el mouse sobre un marcador para ver la institución, o tócalo para seleccionarla.</p>
      <p role="status" className="muted">{results.length} instituciones encontradas · {located.length} ubicadas en el mapa.</p>
      {focused && <div className="institution-focused">
        <strong>{focused.name}</strong><p>{focused.address}</p>
        <Button type="button" disabled={busy} onClick={() => onChoose(focused)}>{selectedIds.includes(focused.id) ? selectedActionLabel : actionLabel}</Button>
      </div>}
      <div className="school-results institution-directory-results">
        {results.map(i => <div className="school-result" key={i.id}>
          <GraduationCap size={24} aria-hidden="true" />
          <div><h4>{i.name}</h4><small>{i.commune} · {i.address}</small>
            {!hasInstitutionLocation(i) && <p className="muted">El colegio debe confirmar su ubicación para aparecer en el mapa.</p>}
            {selectedIds.includes(i.id) && <small className="success-label">Seleccionada</small>}
          </div>
          <div className="institution-result-actions">
            {hasInstitutionLocation(i) && <Button type="button" variant="ghost" onClick={() => setFocusedId(i.id)}>Ver en mapa</Button>}
            <Button type="button" variant="secondary" disabled={busy} onClick={() => onChoose(i)}>{selectedIds.includes(i.id) ? selectedActionLabel : actionLabel}</Button>
          </div>
        </div>)}
        {!results.length && <p className="muted">No hay instituciones con ese nombre. Prueba con otra parte del nombre.</p>}
      </div>
    </div>
  );
}

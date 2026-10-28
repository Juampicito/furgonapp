'use client';
import { useEffect, useRef, useState } from 'react';
import { loadGoogleMaps } from '@/lib/google-maps';
import { Button } from '@/components/ui';
import type { TerritoryPoint } from '@/lib/types';

export function TerritoryMap({ value, onChange, onReady, disabled = false }: {
  value: TerritoryPoint[]; onChange: (points: TerritoryPoint[]) => void; onReady: (ready: boolean) => void; disabled?: boolean;
}) {
  const host = useRef<HTMLDivElement>(null);
  const polygon = useRef<google.maps.Polygon | null>(null);
  const change = useRef(onChange); change.current = onChange;
  const points = useRef(value); points.current = value;
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [drawing, setDrawing] = useState(value.length < 3);
  const [error, setError] = useState('');
  const syncing = useRef(false);
  const tutorial = useRef<HTMLVideoElement>(null);
  useEffect(() => { onReady(!!map && !error && !drawing && value.length >= 3 && value.length <= 100); }, [map, error, drawing, value.length, onReady]);

  useEffect(() => {
    let disposed = false;
    const fail = () => setError('No se pudo cargar Google Maps. Revisa la conexión para dibujar tu zona.');
    window.addEventListener('furgon-maps-error', fail);
    void (async () => {
      try {
        const response = await fetch('/maps-config');
        if (!response.ok) throw new Error('No se pudo cargar la configuración del mapa.');
        const { key } = await response.json();
        if (!key) throw new Error('Falta configurar Google Maps para dibujar tu zona.');
        await loadGoogleMaps(key);
        const { Map } = await google.maps.importLibrary('maps') as google.maps.MapsLibrary;
        if (!disposed && host.current) setMap(new Map(host.current, { center: { lat: -33.49, lng: -70.60 }, zoom: 13,
          streetViewControl: false, mapTypeControl: false, gestureHandling: 'cooperative', disableDoubleClickZoom: true }));
      } catch (failure) { if (!disposed) setError(failure instanceof Error ? failure.message : 'No se pudo cargar el mapa.'); }
    })();
    return () => { disposed = true; window.removeEventListener('furgon-maps-error', fail); };
  }, []);

  useEffect(() => {
    if (!map) return;
    const path = new google.maps.MVCArray(points.current.map(p => new google.maps.LatLng(p.latitude, p.longitude)));
    const shape = new google.maps.Polygon({ map,
      fillColor: '#2563eb', fillOpacity: 0.25, strokeColor: '#2563eb', strokeWeight: 3 });
    shape.setPath(path);
    polygon.current = shape;
    if (points.current.length) {
      const bounds = new google.maps.LatLngBounds();
      points.current.forEach(p => bounds.extend({ lat: p.latitude, lng: p.longitude }));
      map.fitBounds(bounds, 45);
    }
    const update = () => {
      if (!syncing.current) change.current(path.getArray().map(p => ({ latitude: p.lat(), longitude: p.lng() })));
    };
    const listeners = ['insert_at', 'set_at', 'remove_at'].map(event => path.addListener(event, update));
    return () => { listeners.forEach(l => l.remove()); shape.setMap(null); polygon.current = null; };
  }, [map]);

  useEffect(() => {
    const shape = polygon.current;
    if (!shape) return;
    const path = shape.getPath();
    const current = path.getArray().map(p => ({ latitude: p.lat(), longitude: p.lng() }));
    if (JSON.stringify(current) !== JSON.stringify(value)) {
      syncing.current = true;
      path.clear(); value.forEach(p => path.push(new google.maps.LatLng(p.latitude, p.longitude)));
      syncing.current = false;
    }
    shape.setOptions({ editable: !drawing && !disabled, clickable: !drawing, draggable: !drawing && !disabled });
    map?.setOptions({ draggableCursor: drawing ? 'crosshair' : null });
  }, [map, value, drawing, disabled]);

  useEffect(() => {
    if (!map || !drawing || disabled) return;
    const listener = map.addListener('click', (event: google.maps.MapMouseEvent) => {
      if (!event.latLng || points.current.length >= 100) return;
      change.current([...points.current, { latitude: event.latLng.lat(), longitude: event.latLng.lng() }]);
    });
    return () => listener.remove();
  }, [map, drawing, disabled]);

  return <section className="territory-editor" aria-label="Delimitar zona de trabajo">
    <details className="territory-tutorial" onToggle={e => { if (!e.currentTarget.open) tutorial.current?.pause(); }}>
      <summary>¿No sabes cómo hacerlo? Mira este video</summary>
      <p>Escucha el tutorial paso a paso para marcar los bordes, ajustar la zona azul, seleccionar colegios y guardar tu cobertura.</p>
      <video ref={tutorial} controls playsInline preload="none" poster="/tutoriales/zona-de-trabajo.png" aria-label="Video: cómo delimitar tu zona de trabajo">
        <source src="/tutoriales/zona-de-trabajo.webm" type="video/webm" />
        Tu navegador no puede reproducir el video. <a href="/tutoriales/zona-de-trabajo.webm">Descargar el tutorial</a>
      </video>
      <p className="muted">Paso a paso: marca al menos 3 puntos → Terminar dibujo → ajusta los bordes → selecciona colegios → Guardar cobertura.</p>
    </details>
    <p>{drawing ? 'Toca el mapa para marcar los bordes de tu zona. Agrega al menos 3 puntos y pulsa Terminar dibujo.' : 'Arrastra los puntos blancos para ajustar el borde. Puedes mover toda el área azul o agregar puntos en los bordes.'}</p>
    <div className="territory-controls">
      {drawing ? <Button type="button" disabled={disabled || value.length < 3} onClick={() => setDrawing(false)}>Terminar dibujo</Button>
        : <Button type="button" disabled={disabled || !map || !!error} onClick={() => setDrawing(true)}>Agregar puntos</Button>}
      <Button type="button" variant="ghost" disabled={disabled || !value.length} onClick={() => onChange(value.slice(0, -1))}>Deshacer último punto</Button>
      <Button type="button" variant="ghost" disabled={disabled || !value.length} onClick={() => { onChange([]); setDrawing(true); }}>Borrar zona y dibujar otra</Button>
    </div>
    <div className="territory-map" ref={host} aria-label="Mapa para dibujar zona de trabajo" />
    {error && <p role="alert">{error}</p>}
    <p role="status">{value.length} puntos · {value.length > 100 ? 'Reduce la zona a un máximo de 100 puntos' : value.length < 3 ? 'Zona pendiente de delimitar' : drawing ? 'Termina el dibujo antes de guardar' : 'Zona azul lista para guardar'}</p>
  </section>;
}

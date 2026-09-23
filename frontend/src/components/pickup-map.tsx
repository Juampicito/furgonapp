'use client';
import { useEffect, useRef, useState } from 'react';
import { MapPin } from 'lucide-react';
import { communeFromComponents, loadGoogleMaps, type PickupLocation } from '@/lib/google-maps';

export function PickupMap({ onChange }: { onChange: (location: PickupLocation | null) => void }) {
  const inputHost = useRef<HTMLDivElement>(null);
  const mapHost = useRef<HTMLDivElement>(null);
  const change = useRef(onChange);
  change.current = onChange;
  const [status, setStatus] = useState('Cargando Google Maps…');
  const [ready, setReady] = useState(false);
  const [location, setLocation] = useState<PickupLocation | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let disposed = false;
    let sequence = 0;
    let widget: google.maps.places.PlaceAutocompleteElement | undefined;
    let marker: google.maps.marker.AdvancedMarkerElement | undefined;
    const invalidate = () => {
      sequence++;
      setLocation(null);
      change.current(null);
      if (marker) marker.map = null;
    };
    const authFailure = () => {
      invalidate();
      setError(
        'Google Maps no está disponible. Revisa la conexión, la clave y las APIs habilitadas.',
      );
    };
    window.addEventListener('furgon-maps-error', authFailure);
    async function setup() {
      try {
        const response = await fetch('/maps-config');
        if (!response.ok) throw new Error('No se pudo cargar la configuración del mapa.');
        const { key } = await response.json();
        if (disposed) return;
        if (!key) {
          setStatus('Google Maps pendiente de activación. Falta configurar la clave del servicio.');
          return;
        }
        await loadGoogleMaps(key);
        const [{ Map }, { PlaceAutocompleteElement }, { AdvancedMarkerElement }] =
          await Promise.all([
            google.maps.importLibrary('maps') as Promise<google.maps.MapsLibrary>,
            google.maps.importLibrary('places') as Promise<google.maps.PlacesLibrary>,
            google.maps.importLibrary('marker') as Promise<google.maps.MarkerLibrary>,
          ]);
        if (disposed || !mapHost.current || !inputHost.current) return;
        const map = new Map(mapHost.current, {
          center: { lat: -33.4489, lng: -70.6693 },
          zoom: 11,
          mapId: 'DEMO_MAP_ID',
          mapTypeControl: false,
          streetViewControl: false,
          gestureHandling: 'cooperative',
        });
        marker = new AdvancedMarkerElement({ title: 'Punto de recogida' });
        widget = new PlaceAutocompleteElement({ includedRegionCodes: ['cl'] });
        widget.placeholder = 'Escribe calle, número y comuna';
        widget.setAttribute('aria-label', 'Dirección de recogida');
        widget.addEventListener('input', invalidate);
        widget.addEventListener('gmp-error', () => {
          invalidate();
          setError('Google no pudo buscar la dirección. Revisa la conexión o inténtalo de nuevo.');
        });
        widget.addEventListener('gmp-select', async (event) => {
          invalidate();
          const request = sequence;
          setError('');
          setStatus('Buscando la dirección seleccionada…');
          try {
            const place = (
              event as google.maps.places.PlacePredictionSelectEvent
            ).placePrediction.toPlace();
            await place.fetchFields({
              fields: ['formattedAddress', 'location', 'addressComponents'],
            });
            if (disposed || request !== sequence) return;
            const commune = communeFromComponents(place.addressComponents || []);
            if (!place.location || !place.formattedAddress || !commune)
              throw new Error('Selecciona una dirección más completa, con calle, número y comuna.');
            const pickup = {
              address: place.formattedAddress,
              commune,
              placeId: place.id,
              ...place.location.toJSON(),
            };
            marker!.position = place.location;
            marker!.map = map;
            map.setCenter(place.location);
            map.setZoom(17);
            setLocation(pickup);
            change.current(pickup);
            setStatus('Dirección seleccionada en Google Maps');
          } catch (failure) {
            if (!disposed && request === sequence)
              setError(
                failure instanceof Error ? failure.message : 'No se pudo obtener la dirección.',
              );
          }
        });
        inputHost.current.replaceChildren(widget);
        setReady(true);
        setStatus('Selecciona una sugerencia de Google para ubicar la recogida.');
      } catch (failure) {
        if (!disposed)
          setError(failure instanceof Error ? failure.message : 'No se pudo cargar Google Maps.');
      }
    }
    void setup();
    return () => {
      window.removeEventListener('furgon-maps-error', authFailure);
      disposed = true;
      sequence++;
      widget?.remove();
      if (marker) marker.map = null;
    };
  }, []);

  return (
    <div className="pickup-search">
      <div className="field">
        <span>Dirección de recogida</span>
        <div ref={inputHost} />
      </div>
      <div className="pickup-map" style={{ position: 'relative' }}>
        <div ref={mapHost} aria-label="Mapa del punto de recogida" style={{ height: '100%', width: '100%' }} />
        {!ready && (
          <div className="map-placeholder" style={{ position: 'absolute', inset: 0 }}>
            <MapPin size={36} />
            <p>{error || status}</p>
          </div>
        )}
      </div>
      {ready && (
        <p className="muted" role="status">
          {status}
        </p>
      )}
      {error && <p role="alert">{error}</p>}
      {location && (
        <div className="pickup-confirmed">
          <MapPin size={20} />
          <div>
            <strong>{location.address}</strong>
            <p>Comuna: {location.commune}</p>
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${location.lat},${location.lng}&query_place_id=${encodeURIComponent(location.placeId)}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Ver en Google Maps ↗
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

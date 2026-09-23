let loading: Promise<void> | undefined;

export function loadGoogleMaps(key: string): Promise<void> {
  if (loading) return loading;
  loading = new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    const globals = window as unknown as Record<string, unknown>;
    const timer = window.setTimeout(() => fail(), 20000);
    const fail = () => {
      window.clearTimeout(timer);
      window.dispatchEvent(new Event('furgon-maps-error'));
      reject(
        new Error(
          'No se pudo conectar con Google Maps. Revisa la conexión y la configuración de la clave.',
        ),
      );
    };
    globals.gm_authFailure = fail;
    globals.furgonMapsReady = () => {
      window.clearTimeout(timer);
      resolve();
    };
    script.src = `https://maps.googleapis.com/maps/api/js?${new URLSearchParams({ key, v: 'weekly', language: 'es', region: 'CL', loading: 'async', callback: 'furgonMapsReady' })}`;
    script.async = true;
    script.onerror = fail;
    document.head.append(script);
  });
  return loading;
}

export type PickupLocation = {
  address: string;
  commune: string;
  placeId: string;
  lat: number;
  lng: number;
};

export function communeFromComponents(components: google.maps.places.AddressComponent[]): string {
  // Chile's commune is normally administrative_area_level_3; never use province/region.
  for (const type of ['administrative_area_level_3', 'sublocality_level_1', 'locality']) {
    const component = components.find((part) => part.types.includes(type));
    if (component?.longText) return component.longText;
  }
  return '';
}

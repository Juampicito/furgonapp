import type { Page } from '@playwright/test';

// Controlled Google boundary for automated tests; never loaded by application code.
export async function mockMaps(page: Page) {
  await page.route('**/maps-config', (route) =>
    route.fulfill({ json: { key: 'test-browser-key' } }),
  );
  await page.route('https://maps.googleapis.com/maps/api/js?**', (route) =>
    route.fulfill({
      contentType: 'application/javascript',
      body: `
    class Autocomplete extends HTMLElement {
      connectedCallback() {
        const root = this.attachShadow({mode:'open'});
        root.innerHTML = '<input aria-label="Dirección de recogida"><button type="button">Seleccionar dirección de prueba</button>';
        root.querySelector('button').onclick = () => {
          const event = new Event('gmp-select');
          event.placePrediction = { toPlace: () => ({ id: 'test-place', formattedAddress: 'Los Plátanos 1234, Macul, Chile', location: { toJSON: () => ({lat:-33.49,lng:-70.60}) }, addressComponents: [{longText:'Macul',types:['administrative_area_level_3']},{longText:'Santiago',types:['locality']}], fetchFields: async () => {} }) };
          this.dispatchEvent(event);
        };
      }
    }
    customElements.define('test-place-autocomplete', Autocomplete);
    window.google = { maps: { importLibrary: async name => name === 'maps' ? { Map: class { constructor(host) { host.replaceChildren(document.createElement('div')); host.dataset.mapLoaded = 'true'; } setCenter() {} setZoom() {} } } : name === 'places' ? {PlaceAutocompleteElement: Autocomplete} : {AdvancedMarkerElement: class {}} } };
    window.furgonMapsReady();
  `,
    }),
  );
}

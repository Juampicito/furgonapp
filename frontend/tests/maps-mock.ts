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
        root.querySelector('input').setAttribute('aria-label', this.getAttribute('aria-label') || 'Dirección de recogida');
        root.querySelector('button').onclick = () => {
          const event = new Event('gmp-select');
          event.placePrediction = { toPlace: () => ({ id: 'test-place', formattedAddress: 'Los Plátanos 1234, Macul, Chile', location: { toJSON: () => ({lat:-33.49,lng:-70.60}) }, addressComponents: [{longText:'Macul',types:['administrative_area_level_3']},{longText:'Región Metropolitana',types:['administrative_area_level_1']},{longText:'Santiago',types:['locality']}], fetchFields: async () => {} }) };
          this.dispatchEvent(event);
        };
      }
    }
    customElements.define('test-place-autocomplete', Autocomplete);
    class TestMap {
      constructor(host) { this.host = host; host.replaceChildren(document.createElement('div')); host.dataset.mapLoaded = 'true'; }
      setCenter(position) { this.host.dataset.center = JSON.stringify(position); } setZoom() {} fitBounds() {} setOptions() {}
      addListener(event, handler) {
        const buttons = [];
        if(event === 'click') [[-33.51,-70.62],[-33.51,-70.58],[-33.47,-70.58],[-33.47,-70.62]].forEach(([lat,lng],i) => {
          const button=document.createElement('button');button.type='button';button.textContent='Punto de zona '+(i+1);
          button.onclick=()=>handler({latLng:new LatLng(lat,lng)});this.host.append(button);buttons.push(button);
        });
        return {remove(){buttons.forEach(b=>b.remove());}};
      }
    }
    class LatLng { constructor(lat,lng){this.latitude=lat;this.longitude=lng;} lat(){return this.latitude;} lng(){return this.longitude;} }
    class Path {
      constructor(points=[]){this.points=points;this.listeners={};} getArray(){return this.points.slice();}
      addListener(event,fn){(this.listeners[event]??=[]).push(fn);return {remove:()=>{this.listeners[event]=this.listeners[event].filter(f=>f!==fn);}};}
      emit(event){(this.listeners[event]||[]).forEach(fn=>fn());} clear(){this.points=[];this.emit('remove_at');}
      push(point){this.points.push(point);this.emit('insert_at');}
    }
    class Polygon {
      constructor(options){this.map=options.map;this.path=options.paths?.length ? new Path(options.paths.map(p=>new LatLng(p.lat,p.lng))) : undefined;}
      setPath(path){this.path=path;}
      getPath(){return this.path;} setOptions(options){this.map.host.dataset.editable=String(options.editable);this.map.host.dataset.territory=JSON.stringify(this.path.getArray().map(p=>({latitude:p.lat(),longitude:p.lng()})));} setMap(){}
    }
    class InfoWindow { setContent(content) { this.content = content; } open({map}) { this.close(); map.host.append(this.content); } close() { this.content?.remove(); } }
    class Marker { constructor(options = {}) { Object.assign(this, options); if (this.content && this.map) this.map.host.append(this.content); } addListener() { return {remove(){}}; } }
    window.google = { maps: { Polygon, MVCArray: Path, LatLng, InfoWindow, LatLngBounds: class { extend(){return this;} }, importLibrary: async name => name === 'maps' ? { Map: TestMap } : name === 'places' ? {PlaceAutocompleteElement: Autocomplete} : {AdvancedMarkerElement: Marker} } };
    window.furgonMapsReady();
  `,
    }),
  );
}

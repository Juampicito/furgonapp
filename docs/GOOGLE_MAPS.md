# Activar Google Maps

La búsqueda utiliza Maps JavaScript API y el widget oficial de Places API (New). Las sugerencias se limitan a Chile. Al seleccionar una, se obtiene la dirección completa, coordenadas, Place ID y comuna; el mapa muestra el marcador y la búsqueda de furgonistas usa esa comuna. Las cotizaciones conservan la dirección y comuna elegidas. La cobertura sigue siendo por comuna, no por distancia de conducción; el precio continúa siendo estimado por el servicio demo.

## Probar sin datos de facturación

Google ofrece una **Maps Demo Key** para prototipos, con cuotas y sin datos de facturación. Su documentación incluye mapas, marcadores, Place Class y Places API (New), sin contenido generado por usuarios. No sirve para producción.

1. Abre https://developers.google.com/maps/documentation/javascript/demo-key y pulsa **Get a Demo Key**.
2. Inicia sesión con tu cuenta Google y revisa y acepta los términos si estás de acuerdo.
3. Copia la clave en `frontend/.env.local`, en la línea `GOOGLE_MAPS_BROWSER_KEY=tu_clave`. El archivo vacío ya está preparado y se excluye de Git.
4. Reinicia el frontend y prueba una dirección. La consulta real sigue pendiente hasta realizar este paso. Si la cuota se agota, Google pausa el uso hasta el día siguiente.

## Crear la clave estándar para producción

1. Abre https://console.cloud.google.com/ y crea un proyecto, por ejemplo `FurgonApp`.
2. Vincula una cuenta de facturación. Google requiere facturación para estas APIs y cobra según uso; revisa sus tarifas y establece cuotas. Las alertas de presupuesto no detienen automáticamente el gasto.
3. En **APIs y servicios → Biblioteca**, habilita **Maps JavaScript API** y **Places API (New)**.
4. En **APIs y servicios → Credenciales → Crear credenciales → Clave de API**, crea una clave para navegador.
5. Edita la clave. En **Restricciones de aplicaciones**, elige **Sitios web** y agrega `http://127.0.0.1:3000/*` y `http://localhost:3000/*`. En producción agrega solo tu dominio autorizado.
6. En **Restricciones de API**, permite únicamente **Maps JavaScript API** y **Places API (New)**. Guarda los cambios.
7. Copia `frontend/.env.local.example` a `frontend/.env.local` y completa `GOOGLE_MAPS_BROWSER_KEY=tu_clave`. Este archivo se excluye de Git. La clave de navegador es visible para el cliente por diseño; sus restricciones son necesarias. No uses una clave privada de servidor.
8. Reinicia el frontend (`npm run start` dentro de `frontend`; detén antes la instancia existente). No hace falta recompilar: `/maps-config` lee la clave en el servidor en tiempo de ejecución.

Con Docker, configura `GOOGLE_MAPS_BROWSER_KEY` en el `.env` raíz y recrea el servicio frontend.

## Comprobar

Entra como Apoderado → Entrar al colegio → escribe calle, número y comuna → selecciona una sugerencia. Comprueba el marcador y la comuna, y pulsa Buscar furgonistas. Al editar de nuevo la dirección se invalida la selección y se borran los resultados anteriores. Si no hay clave o falla Google, la búsqueda queda deshabilitada y muestra el motivo.

La integración no solicita la ubicación del dispositivo. El mapa utiliza `DEMO_MAP_ID` para el marcador avanzado; se puede sustituir por un Map ID propio para personalizar el estilo.

## Validación y límites

Las pruebas automatizadas simulan únicamente la frontera de Google para verificar selección, comuna, invalidación y fallos sin cargos. Además, el 23 de septiembre de 2026 se comprobó el servicio real con la clave configurada por el propietario: Google Places respondió correctamente al autocompletado de Avenida Macul y a la consulta de detalles; se mostró el marcador en Macul y la búsqueda devolvió dos furgonistas. No se creó ninguna cotización. La dirección no se considera una acreditación de domicilio y el servidor sigue aplicando sus reglas de cobertura y cupos.

Documentación oficial: https://developers.google.com/maps/documentation/javascript/place-autocomplete-new y https://developers.google.com/maps/documentation/javascript/get-api-key

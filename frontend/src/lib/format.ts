export const money = (n: number) =>
  new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  }).format(n);
export const date = (value: string) =>
  new Intl.DateTimeFormat('es-CL', { day: 'numeric', month: 'short' }).format(new Date(value));
export const labels: Record<string, string> = {
  INCOMPLETO: 'Perfil incompleto',
  PENDIENTE_VERIFICACION: 'En verificación',
  APROBADO: 'Aprobado',
  RECHAZADO: 'Rechazado',
  PENDIENTE: 'Pendiente',
  SOLICITADA: 'Nueva solicitud',
  EN_REVISION: 'En revisión',
  OFERTA_ENVIADA: 'Oferta recibida',
  ACEPTADA: 'Aceptada',
  RECHAZADA: 'Rechazada',
  CANCELADA: 'Cancelada',
  ACTIVO: 'Activo',
  LICENCIA: 'Licencia de conducir',
  ANTECEDENTES: 'Certificado de antecedentes',
  HABILITACION_MENORES: 'Habilitación para trabajar con menores',
  FOTO_CONDUCTOR: 'Fotografía del conductor',
  FOTO_VEHICULO: 'Fotografía del vehículo',
};
export const communes = [
  'Macul',
  'Ñuñoa',
  'La Florida',
  'Peñalolén',
  'Maipú',
  'Santiago',
  'Providencia',
  'La Reina',
];
function luminance(hex: string) {
  const rgb = hex
    .replace('#', '')
    .match(/.{2}/g)
    ?.map((v) => parseInt(v, 16) / 255) ?? [0, 0, 0];
  const [r, g, b] = rgb.map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
export function contrastText(hex: string) {
  const background = luminance(hex);
  const whiteContrast = 1.05 / (background + 0.05);
  const darkContrast = (background + 0.05) / (luminance('#111827') + 0.05);
  if (darkContrast >= 4.5 && darkContrast >= whiteContrast) return '#111827';
  return whiteContrast >= 4.5 ? '#FFFFFF' : '#000000';
}

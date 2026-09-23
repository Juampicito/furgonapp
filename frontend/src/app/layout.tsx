import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {
  title: 'FurgonApp · Un buen viaje empieza aquí',
  description: 'Encuentra y gestiona transporte escolar para tu comunidad.',
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}

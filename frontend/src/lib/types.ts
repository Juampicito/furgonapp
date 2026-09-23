export type Role = 'ADMIN' | 'FURGONISTA' | 'APODERADO' | 'COLEGIO';
export type ProfileStatus = 'INCOMPLETO' | 'PENDIENTE_VERIFICACION' | 'APROBADO' | 'RECHAZADO';
export type DocumentStatus = 'PENDIENTE' | 'APROBADO' | 'RECHAZADO';
export type DocumentType =
  'LICENCIA' | 'ANTECEDENTES' | 'HABILITACION_MENORES' | 'FOTO_CONDUCTOR' | 'FOTO_VEHICULO';
export type QuoteStatus =
  'SOLICITADA' | 'EN_REVISION' | 'OFERTA_ENVIADA' | 'ACEPTADA' | 'RECHAZADA' | 'CANCELADA';
export interface User {
  id: string;
  email: string;
  role: Role;
  firstName: string;
  lastName: string;
  rut: string;
  phone: string;
  address: string;
  active: boolean;
}
export interface Vehicle {
  id: string;
  plate: string;
  brand: string;
  model: string;
  manufactureYear: number;
  color: string;
  capacity: number;
  photoId: string | null;
  occupied: number;
  available: number;
}
export interface Driver {
  id: string;
  userId: string;
  name: string;
  initials: string;
  status: ProfileStatus;
  photoId: string | null;
  bio: string;
  vehicle: Vehicle | null;
  communes: string[];
  institutionIds: string[];
  verifiedDocuments: DocumentType[];
}
export interface Institution {
  id: string;
  ownerId: string;
  name: string;
  rbd: string;
  address: string;
  region: string;
  commune: string;
  phone: string;
  email: string;
  description: string;
  logoId: string | null;
  primaryColor: string;
  secondaryColor: string;
}
export interface DriverDocument {
  id: string;
  driverId: string;
  type: DocumentType;
  status: DocumentStatus;
  filename: string;
  reviewNote: string | null;
  updatedAt: string;
}
export interface Quote {
  id: string;
  guardianId: string;
  driverId: string;
  institutionId: string;
  address: string;
  commune: string;
  suggestedPrice: number;
  offeredPrice: number | null;
  status: QuoteStatus;
  createdAt: string;
  guardianName: string;
  guardianPhone: string;
  guardianEmail: string;
  driverName: string;
  institutionName: string;
}
export interface Contract {
  id: string;
  quoteId: string;
  driverId: string;
  institutionId: string;
  monthlyPrice: number;
  status: 'ACTIVO' | 'CANCELADO';
  createdAt: string;
  guardianName: string;
  driverName: string;
  institutionName: string;
  paymentStatus: string;
}
export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  quoteId: string | null;
  read: boolean;
  createdAt: string;
}
export interface Workspace {
  user: User;
  institutions: Institution[];
  drivers: Driver[];
  documents?: DriverDocument[];
  users?: User[];
  savedInstitutionIds?: string[];
  quotes: Quote[];
  contracts: Contract[];
  notifications: Notification[];
  maxPriceDeviationPercentage: number;
}
export interface AuthResponse {
  token: string;
  user: User;
}

import { notFound } from 'next/navigation';
import { WorkspaceProvider } from '@/components/workspace';
import { Dashboard } from '@/components/dashboard';
export default async function Page({
  params,
}: {
  params: Promise<{ role: string; section?: string[] }>;
}) {
  const { role, section } = await params;
  if (!['admin', 'furgonista', 'apoderado', 'colegio'].includes(role)) notFound();
  return (
    <WorkspaceProvider rolePath={role}>
      <Dashboard section={section?.[0] ?? 'inicio'} />
    </WorkspaceProvider>
  );
}

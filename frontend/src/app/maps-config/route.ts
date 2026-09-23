import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export function GET() {
  // Browser key: restrict HTTP referrers and APIs in Google Cloud. Never use a server key here.
  return NextResponse.json(
    { key: process.env.GOOGLE_MAPS_BROWSER_KEY || '' },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}

import { deleteTokenServer } from '@/lib/token-server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  await deleteTokenServer();

  return NextResponse.json({ message: 'Logged out' });
}

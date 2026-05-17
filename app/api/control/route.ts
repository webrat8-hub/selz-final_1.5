import { NextResponse } from 'next/server';
import { createClient } from '@vercel/kv';

// Trik cerdas: ngebaca KV_URL atau STORAGE_URL biar gak sensitif salah nama prefix di Vercel
const kv = createClient({
  url: process.env.KV_REST_API_URL || process.env.STORAGE_REST_API_URL || '',
  token: process.env.KV_REST_API_TOKEN || process.env.STORAGE_REST_API_TOKEN || '',
});

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(request: Request) {
  try {
    const { action } = await request.json();

    // 1. Cek status Lock Web
    const isLocked = await kv.get('yaemiko_web_locked');
    if (isLocked === true) {
      return NextResponse.json({ status: 'locked', message: 'Website sedang dikunci oleh Selz!' }, { status: 403 });
    }

    // 2. Logika pencatatan Attack / Fitur Kurang Limit
    if (action === 'attack') {
      let currentLimit = await kv.get<number>('yaemiko_bug_limit');
      
      // Jika database kosong (pertama kali), set default ke 5
      if (currentLimit === null || currentLimit === undefined) {
        currentLimit = 5;
        await kv.set('yaemiko_bug_limit', 5);
      }

      if (currentLimit <= 0) {
        return NextResponse.json({ status: 'limit_empty', message: 'Limit harian habis!' }, { status: 429 });
      }

      // Potong limit 1 poin
      const newLimit = currentLimit - 1;
      await kv.set('yaemiko_bug_limit', newLimit);

      return NextResponse.json({ status: 'success', remainingLimit: newLimit });
    }

    // Default return jika status check biasa
    const currentLimit = await kv.get<number>('yaemiko_bug_limit') ?? 5;
    return NextResponse.json({ status: 'ready', remainingLimit: currentLimit });

  } catch (error) {
    return NextResponse.json({ status: 'error', message: 'Database Connection Error' }, { status: 500 });
  }
}

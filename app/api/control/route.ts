import { NextResponse } from 'next/server';

// Saklar wajib buat matiin cache Next.js/Vercel biar data selalu real-time
export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function runRedis(command: string[]) {
  try {
    const url = "https://leg-consonant-unblemished-95778.upstash.io";
    const token = "jUk8Nw2m7bOcfrxjpkAwA825ncyYyWP2";
    
    // Di sini kita tambahin cache: 'no-store' biar dia selalu nembak database asli
    const res = await fetch(`${url}/${command.join('/')}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store'
    });
    const data = await res.json();
    return data.result;
  } catch (err) {
    console.error("Gagal baca database di API Control:", err);
    return null;
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const action = body.action;

    // 1. Cek status Lock Web (Anti Cache)
    const isLocked = await runRedis(['GET', 'yaemiko_web_locked']);
    if (isLocked === 'true') {
      return NextResponse.json({ status: 'locked', message: 'Website dikunci oleh Selz!' }, { status: 403 });
    }

    // 2. Logika pencatatan Attack
    if (action === 'attack') {
      let currentLimit = await runRedis(['GET', 'yaemiko_bug_limit']);
      
      if (currentLimit === null) {
        await runRedis(['SET', 'yaemiko_bug_limit', '5']);
        currentLimit = '5';
      }

      let limitNum = parseInt(currentLimit);

      if (limitNum <= 0) {
        return NextResponse.json({ status: 'limit_empty', message: 'Limit harian habis!' }, { status: 429 });
      }

      const newLimit = limitNum - 1;
      await runRedis(['SET', 'yaemiko_bug_limit', newLimit.toString()]);

      return NextResponse.json({ status: 'success', remainingLimit: newLimit });
    }

    // JALUR UTAMA: Saat dashboard web di-refresh, dia bakal kesini buat nanya sisa limit
    const currentLimit = await runRedis(['GET', 'yaemiko_bug_limit']);
    const finalLimit = currentLimit !== null ? parseInt(currentLimit) : 5;

    return NextResponse.json({ status: 'ready', remainingLimit: finalLimit });

  } catch (error) {
    // Kalau eror, kasih fallback aman angka 5 biar web gak eror 500
    return NextResponse.json({ status: 'ready', remainingLimit: 5, msg: 'Safe Fallback' });
  }
}

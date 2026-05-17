import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Fungsi cerdas buat nembak database tanpa library luar
async function runRedis(command: string[]) {
  const url = "https://leg-consonant-unblemished-95778.upstash.io";
  const token = "jUk8Nw2m7bOcfrxjpkAwA825ncyYyWP2";
  
  const res = await fetch(`${url}/${command.join('/')}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store'
  });
  const data = await res.json();
  return data.result;
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const action = body.action;

    // 1. Cek status Lock Web
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

    const currentLimit = await runRedis(['GET', 'yaemiko_bug_limit']) ?? '5';
    return NextResponse.json({ status: 'ready', remainingLimit: parseInt(currentLimit) });

  } catch (error) {
    return NextResponse.json({ status: 'ready', remainingLimit: 5, msg: 'Safe Fallback' });
  }
}

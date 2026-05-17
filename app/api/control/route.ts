import { NextResponse } from 'next/server';
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL || '');

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(request: Request) {
  try {
    const { action } = await request.json();

    // 1. Cek status Lock Web
    const isLocked = await redis.get('yaemiko_web_locked');
    if (isLocked === 'true') {
      return NextResponse.json({ status: 'locked', message: 'Website dikunci oleh Selz!' }, { status: 403 });
    }

    // 2. Logika pencatatan Attack
    if (action === 'attack') {
      let currentLimit = await redis.get('yaemiko_bug_limit');
      
      if (currentLimit === null) {
        await redis.set('yaemiko_bug_limit', '5');
        currentLimit = '5';
      }

      let limitNum = parseInt(currentLimit);

      if (limitNum <= 0) {
        return NextResponse.json({ status: 'limit_empty', message: 'Limit harian habis!' }, { status: 429 });
      }

      const newLimit = limitNum - 1;
      await redis.set('yaemiko_bug_limit', newLimit.toString());

      return NextResponse.json({ status: 'success', remainingLimit: newLimit });
    }

    const currentLimit = await redis.get('yaemiko_bug_limit') ?? '5';
    return NextResponse.json({ status: 'ready', remainingLimit: parseInt(currentLimit) });

  } catch (error) {
    return NextResponse.json({ status: 'ready', remainingLimit: 5, msg: 'Fallback aktif' });
  }
}

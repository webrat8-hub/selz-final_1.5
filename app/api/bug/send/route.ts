import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';
const redis = new Redis({ url: process.env.UPSTASH_REDIS_REST_URL!, token: process.env.UPSTASH_REDIS_REST_TOKEN! });

export async function POST(req: Request) {
  const { username } = await req.json();
  const user = await redis.get(`user:${username}`) as any;
  
  // Proteksi Lock
  if (user?.locked) return NextResponse.json({ error: "Akun di-lock Admin!" }, { status: 403 });

  // Proteksi Quota
  const LIMIT_MAKSIMAL = 50; 
  const currentQuota = parseInt(await redis.get(`quota:${username}`) || "0");
  if (currentQuota >= LIMIT_MAKSIMAL) return NextResponse.json({ error: "Limit habis! Minta reset admin." }, { status: 403 });

  // --- LOGIKA SENDER LU DI BAWAH SINI ---
  // Eksekusi aksi bug...
  
  // Increment counter
  await redis.incr(`quota:${username}`);
  
  return NextResponse.json({ success: true });
}

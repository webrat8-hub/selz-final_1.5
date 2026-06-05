import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export async function POST(req: Request) {
  try {
    const { username } = await req.json();
    if (!username) {
      return NextResponse.json({ error: "Username wajib diisi" }, { status: 400 });
    }

    // Set expire 30 detik — selama heartbeat dipanggil tiap 15 detik, user tetap online
    await redis.setex(`online:${username}`, 30, JSON.stringify({
      username,
      last_seen: Date.now()
    }));

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Internal Server Error" }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export async function POST(req: Request) {
  try {
    const { username, password, role, secret } = await req.json();

    if (!secret || secret !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    if (!username || !password) {
      return NextResponse.json({ error: "Username dan password wajib diisi" }, { status: 400 });
    }

    const exists = await redis.exists(`user:${username}`);
    if (exists) {
      return NextResponse.json({ error: "Username sudah terdaftar!" }, { status: 400 });
    }

    const newUser = {
      username,
      password,
      role: role || 'user',
      locked: false,
      limit: 5,
      created_at: Date.now(),
    };

    await redis.set(`user:${username}`, JSON.stringify(newUser));
    await redis.set(`limit:${username}`, 5);

    return NextResponse.json({ 
      success: true, 
      message: `Akun ${username} berhasil dibuat!`,
      user: newUser 
    });

  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Internal Server Error" }, { status: 500 });
  }
}

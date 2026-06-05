import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export async function POST(req: Request) {
  try {
    const { username, secret } = await req.json();

    if (!secret || secret !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    if (!username) {
      return NextResponse.json({ error: "Username wajib diisi" }, { status: 400 });
    }

    const userExists = await redis.exists(`user:${username}`);
    if (!userExists) {
      return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 });
    }

    await redis.del(`user:${username}`);
    await redis.del(`limit:${username}`);

    return NextResponse.json({ 
      success: true, 
      message: `Akun ${username} berhasil dihapus!` 
    });

  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Internal Server Error" }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export async function POST(req: Request) {
  try {
    const { username, secret, newRole, newPassword } = await req.json();

    if (!secret || secret !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    if (!username) {
      return NextResponse.json({ error: "Username wajib diisi" }, { status: 400 });
    }

    const userDataRaw = await redis.get(`user:${username}`);
    if (!userDataRaw) {
      return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 });
    }

    const userData = typeof userDataRaw === 'string' ? JSON.parse(userDataRaw) : userDataRaw;

    if (newRole) userData.role = newRole;
    if (newPassword) userData.password = newPassword;

    await redis.set(`user:${username}`, JSON.stringify(userData));

    return NextResponse.json({ 
      success: true, 
      message: `Akun ${username} berhasil diupdate!`,
      user: { username: userData.username, role: userData.role, locked: userData.locked, limit: userData.limit }
    });

  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Internal Server Error" }, { status: 500 });
  }
}

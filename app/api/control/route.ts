import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

const redis = new Redis({ 
  url: process.env.UPSTASH_REDIS_REST_URL!, 
  token: process.env.UPSTASH_REDIS_REST_TOKEN! 
});

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { action, username, password } = body;

    if (!username) {
      return NextResponse.json({ error: "Username required" }, { status: 400 });
    }

    const userKey = `user:${username}`;
    const userData = (await redis.get(userKey)) as any;

    // LOGIKA LOGIN (Perbaikan utama agar tidak tembus asal)
    if (action === 'login') {
      if (!userData) {
        return NextResponse.json({ success: false, message: "User tidak ditemukan" });
      }
      
      // Validasi password (hanya jika user ditemukan)
      if (userData.password !== password) {
        return NextResponse.json({ success: false, message: "Password salah!" });
      }

      return NextResponse.json({ 
        success: true, 
        role: userData.role || "user",
        isLocked: userData.locked ?? false
      });
    }

    // LOGIKA GET_DATA (Hanya ambil data jika user valid)
    if (action === 'get_data') {
      if (!userData) return NextResponse.json({ error: "User not found" }, { status: 404 });
      
      return NextResponse.json({
        isLocked: userData.locked ?? false,
        limit: userData.limit ?? 5,
        isAdminBypassOn: userData.isAdminBypassOn ?? false,
        isPaired: userData.isPaired ?? false,
        pairingCode: userData.pairingCode ?? ""
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });

  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

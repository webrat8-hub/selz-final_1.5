import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

const redis = new Redis({ 
  url: process.env.UPSTASH_REDIS_REST_URL!, 
  token: process.env.UPSTASH_REDIS_REST_TOKEN! 
});

export async function POST(req: Request) {
  try {
    const { action, username } = await req.json().catch(() => ({}));
    
    if (!username) {
      return NextResponse.json({ error: "Username required" }, { status: 400 });
    }

    const userKey = `user:${username}`;
    const userData = (await redis.get(userKey)) as any || { username, locked: false, limit: 5, isAdminBypassOn: false };

    if (action === 'get_data') {
      return NextResponse.json({
        isLocked: userData.locked ?? false,
        limit: userData.limit ?? 5,
        isAdminBypassOn: userData.isAdminBypassOn ?? false,
        isPaired: userData.isPaired ?? false,
        pairingCode: userData.pairingCode ?? ""
      });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

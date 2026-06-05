import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export async function GET() {
  try {
    const keys = await redis.keys('online:*');
    const onlineUsers = [];

    for (const key of keys) {
      const data = await redis.get(key);
      if (data) {
        const parsed = typeof data === 'string' ? JSON.parse(data) : data;
        onlineUsers.push(parsed);
      }
    }

    return NextResponse.json({ 
      online: onlineUsers.length,
      users: onlineUsers 
    });
  } catch (err) {
    return NextResponse.json({ online: 0, users: [] });
  }
}

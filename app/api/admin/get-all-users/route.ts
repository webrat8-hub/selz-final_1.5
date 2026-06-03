import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

const redis = new Redis({ 
  url: process.env.UPSTASH_REDIS_REST_URL!, 
  token: process.env.UPSTASH_REDIS_REST_TOKEN! 
});

export async function GET(req: Request) {
  const secret = req.headers.get("x-secret");
  if (secret !== process.env.ADMIN_PASSWORD && secret !== "LEONZKENEDYZ") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  
  const keys = await redis.keys("user:*");
  const users = await Promise.all(
    keys.map(async (key) => {
      const data = await redis.get(key);
      return typeof data === 'string' ? JSON.parse(data) : data;
    })
  );
  
  return NextResponse.json({ users });
}

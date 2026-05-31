import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Token dan ID langsung di sini
const TELE_TOKEN = "8633526016:AAGZGlW2TROHF1V6GujEpz8o_QYXNpqSkwM";
const CHAT_ID = "6481060681";

async function runRedis(command: string[]) {
  const url = "https://distinct-cod-130750.upstash.io";
  const token = "gQAAAAAAAf6-AAIgcDE2NTJlNDQwMGQ1ZWQ0NjY0YTY5NmNmNTMwNjNjNDk3OA";
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(command),
    cache: 'no-store'
  });
  return await res.json();
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));

  // Jika dari Web (Front-end)
  if (body.action === 'get_data') {
    const [code, lock, limit] = await Promise.all([
      runRedis(['GET', 'yaemiko_pairing_code']),
      runRedis(['GET', 'yaemiko_web_locked']),
      runRedis(['GET', 'yaemiko_bug_limit'])
    ]);
    return NextResponse.json({
      pairingCode: code?.result || null,
      isLocked: lock?.result === 'true',
      limit: limit?.result || '5'
    });
  }

  if (body.action === 'set') {
    await runRedis(['SET', 'yaemiko_bug_limit', String(body.valueToSet)]);
    return NextResponse.json({ ok: true });
  }

  // Jika dari Telegram
  if (body.message) {
    const cmd = body.message.text?.toLowerCase();
    if (cmd === '/resetlimit') await runRedis(['SET', 'yaemiko_bug_limit', '5']);
    if (cmd === '/lockweb') await runRedis(['SET', 'yaemiko_web_locked', 'true']);
    if (cmd === '/unlockweb') await runRedis(['SET', 'yaemiko_web_locked', 'false']);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ ok: true });
}

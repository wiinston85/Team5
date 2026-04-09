import { generateAuthenticationOptions } from '@simplewebauthn/server';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { authenticatorDB, userDB } from '@/lib/db';

const loginOptionsSchema = z.object({
  username: z.string().trim().min(1),
});

export async function POST(request: NextRequest) {
  const parsed = loginOptionsSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: 'Username is required' }, { status: 400 });
  }
  const username = parsed.data.username;

  const user = userDB.getByUsername(username);
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const options = await generateAuthenticationOptions({
    timeout: 60_000,
    rpID: process.env.RP_ID ?? 'localhost',
    allowCredentials: authenticatorDB.listByUser(user.id).map((item) => ({
      id: item.credential_id,
      transports: item.transports ? (JSON.parse(item.transports) as AuthenticatorTransport[]) : undefined,
    })),
    userVerification: 'preferred',
  });

  userDB.setChallenge(user.id, options.challenge);
  return NextResponse.json({ options });
}

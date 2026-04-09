import { generateRegistrationOptions } from '@simplewebauthn/server';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { authenticatorDB, userDB } from '@/lib/db';

const registerOptionsSchema = z.object({
  username: z.string().trim().min(1),
});

export async function POST(request: NextRequest) {
  const parsed = registerOptionsSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: 'Username is required' }, { status: 400 });
  }
  const username = parsed.data.username;

  let user = userDB.getByUsername(username);
  if (!user) {
    user = userDB.create(username);
  }

  const options = await generateRegistrationOptions({
    rpName: process.env.RP_NAME ?? 'Todo App',
    rpID: process.env.RP_ID ?? 'localhost',
    userName: user.username,
    userID: new TextEncoder().encode(user.id.toString()),
    timeout: 60_000,
    attestationType: 'none',
    authenticatorSelection: {
      residentKey: 'preferred',
      userVerification: 'preferred',
    },
    excludeCredentials: authenticatorDB.listByUser(user.id).map((item) => ({
      id: item.credential_id,
      transports: item.transports ? (JSON.parse(item.transports) as AuthenticatorTransport[]) : undefined,
    })),
  });

  userDB.setChallenge(user.id, options.challenge);
  return NextResponse.json({ options });
}

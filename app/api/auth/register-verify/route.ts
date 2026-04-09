import { verifyRegistrationResponse } from '@simplewebauthn/server';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createSession } from '@/lib/auth';
import { authenticatorDB, userDB } from '@/lib/db';

const registerVerifySchema = z.object({
  username: z.string().trim().min(1),
  response: z.any(),
});

export async function POST(request: NextRequest) {
  const parsed = registerVerifySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }
  const body = parsed.data;
  const username = body.username;

  const user = userDB.getByUsername(username);
  if (!user || !user.current_challenge) {
    return NextResponse.json({ error: 'User challenge not found' }, { status: 400 });
  }

  const verification = await verifyRegistrationResponse({
    response: body.response,
    expectedChallenge: user.current_challenge,
    expectedOrigin: process.env.RP_ORIGIN ?? 'http://localhost:3000',
    expectedRPID: process.env.RP_ID ?? 'localhost',
    requireUserVerification: false,
  });

  if (!verification.verified || !verification.registrationInfo) {
    return NextResponse.json({ error: 'Registration verification failed' }, { status: 400 });
  }

  const credential = verification.registrationInfo.credential;
  authenticatorDB.create({
    user_id: user.id,
    credential_id: credential.id,
    public_key: Buffer.from(credential.publicKey).toString('base64'),
    counter: verification.registrationInfo.credential.counter ?? 0,
    transports: JSON.stringify((body.response as { response?: { transports?: string[] } }).response?.transports ?? []),
  });

  userDB.clearChallenge(user.id);
  await createSession(user.id);

  return NextResponse.json({ success: true });
}

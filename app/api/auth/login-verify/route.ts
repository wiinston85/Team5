import { verifyAuthenticationResponse } from '@simplewebauthn/server';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createSession } from '@/lib/auth';
import { authenticatorDB, userDB } from '@/lib/db';

const loginVerifySchema = z.object({
  username: z.string().trim().min(1),
  response: z.any(),
});

export async function POST(request: NextRequest) {
  const parsed = loginVerifySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }
  const body = parsed.data;

  const username = body.username;
  const credentialId = body.response?.id;
  if (!username || !body.response || !credentialId) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  const user = userDB.getByUsername(username);
  if (!user || !user.current_challenge) {
    return NextResponse.json({ error: 'User challenge not found' }, { status: 400 });
  }

  const authenticator = authenticatorDB.findByCredentialId(credentialId);
  if (!authenticator) {
    return NextResponse.json({ error: 'Authenticator not found' }, { status: 404 });
  }

  const verification = await verifyAuthenticationResponse({
    response: body.response,
    expectedChallenge: user.current_challenge,
    expectedOrigin: process.env.RP_ORIGIN ?? 'http://localhost:3000',
    expectedRPID: process.env.RP_ID ?? 'localhost',
    credential: {
      id: authenticator.credential_id,
      publicKey: new Uint8Array(Buffer.from(authenticator.public_key, 'base64')),
      counter: authenticator.counter ?? 0,
      transports: authenticator.transports ? (JSON.parse(authenticator.transports) as AuthenticatorTransport[]) : [],
    },
  });

  if (!verification.verified) {
    return NextResponse.json({ error: 'Login verification failed' }, { status: 400 });
  }

  authenticatorDB.updateCounter(authenticator.credential_id, verification.authenticationInfo.newCounter ?? 0);
  userDB.clearChallenge(user.id);
  await createSession(user.id);

  return NextResponse.json({ success: true });
}

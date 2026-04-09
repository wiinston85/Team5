import { NextResponse } from "next/server";
import { bytesToBase64 } from "@/lib/base64";
import { createSession } from "@/lib/auth";
import { addAuthenticator, getUserByUsername } from "@/lib/store";
import { clearRegistrationChallenge, getRegistrationChallenge, verifyRegistration } from "@/lib/webauthn";

export async function POST(request: Request) {
  try {
    const { username, response } = (await request.json()) as { username?: string; response?: unknown };
    if (!username || !response) {
      return NextResponse.json({ error: "username and response are required" }, { status: 400 });
    }

    const expected = getRegistrationChallenge(username);
    if (!expected) {
      return NextResponse.json({ error: "No active registration challenge" }, { status: 400 });
    }

    const verified = await verifyRegistration(response, expected);
    if (!verified.verified || !verified.registrationInfo) {
      return NextResponse.json({ error: "Registration verification failed" }, { status: 400 });
    }

    const user = getUserByUsername(username);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    addAuthenticator({
      user_id: user.id,
      credential_id: String(verified.registrationInfo.credential.id),
      public_key: bytesToBase64(verified.registrationInfo.credential.publicKey),
      counter: verified.registrationInfo.credential.counter,
      transports: JSON.stringify(verified.registrationInfo.credential.transports || [])
    });

    clearRegistrationChallenge(username);
    await createSession(user.id, user.username);

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

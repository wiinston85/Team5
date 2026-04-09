import { NextResponse } from "next/server";
import { base64ToBytes } from "@/lib/base64";
import { createSession } from "@/lib/auth";
import { getAuthenticatorByUserAndCredential, getUserByUsername, updateAuthenticatorCounter } from "@/lib/store";
import { clearAuthChallenge, getAuthChallenge, verifyAuthentication } from "@/lib/webauthn";

export async function POST(request: Request) {
  try {
    const { username, response } = (await request.json()) as { username?: string; response?: { id: string } };
    if (!username || !response?.id) {
      return NextResponse.json({ error: "username and response are required" }, { status: 400 });
    }

    const expected = getAuthChallenge(username);
    if (!expected) {
      return NextResponse.json({ error: "No active login challenge" }, { status: 400 });
    }

    const user = getUserByUsername(username);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const auth = getAuthenticatorByUserAndCredential(user.id, Buffer.from(response.id, "base64url").toString("base64"));

    if (!auth) {
      return NextResponse.json({ error: "Credential not found" }, { status: 404 });
    }

    const verified = await verifyAuthentication(response, expected, base64ToBytes(auth.public_key), auth.counter);
    if (!verified.verified || !verified.authenticationInfo) {
      return NextResponse.json({ error: "Login verification failed" }, { status: 400 });
    }

    updateAuthenticatorCounter(auth.id, verified.authenticationInfo.newCounter);

    clearAuthChallenge(username);
    await createSession(user.id, user.username);

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { getAuthenticatorsByUser, getUserByUsername } from "@/lib/store";
import { createAuthenticationOptions, setAuthChallenge } from "@/lib/webauthn";

export async function POST(request: Request) {
  try {
    const { username } = (await request.json()) as { username?: string };
    if (!username || !username.trim()) {
      return NextResponse.json({ error: "Username is required" }, { status: 400 });
    }

    const user = getUserByUsername(username.trim());
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const creds = getAuthenticatorsByUser(user.id).map((credential) => credential.credential_id);

    if (creds.length === 0) {
      return NextResponse.json({ error: "No passkeys registered for this user" }, { status: 400 });
    }

    const options = await createAuthenticationOptions(creds);
    setAuthChallenge(user.username, options.challenge);

    return NextResponse.json({ ...options, username: user.username });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { createUser, getAuthenticatorsByUser, getUserByUsername } from "@/lib/store";
import { createRegistrationOptions, setRegistrationChallenge } from "@/lib/webauthn";

export async function POST(request: Request) {
  try {
    const { username } = (await request.json()) as { username?: string };
    if (!username || !username.trim()) {
      return NextResponse.json({ error: "Username is required" }, { status: 400 });
    }

    const clean = username.trim();
    let user = getUserByUsername(clean);
    if (!user) {
      user = createUser(clean);
    }

    const creds = getAuthenticatorsByUser(user.id).map((credential) => credential.credential_id);

    const options = await createRegistrationOptions(clean, String(user.id), creds);
    setRegistrationChallenge(clean, options.challenge);

    return NextResponse.json(options);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

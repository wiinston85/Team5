import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
  type VerifiedRegistrationResponse,
  type VerifiedAuthenticationResponse
} from "@simplewebauthn/server";

const rpID = process.env.RP_ID || "localhost";
const rpName = process.env.RP_NAME || "Todo App";
const origin = process.env.RP_ORIGIN || "http://localhost:3000";

const regChallenges = new Map<string, string>();
const authChallenges = new Map<string, string>();

export function setRegistrationChallenge(username: string, challenge: string): void {
  regChallenges.set(username, challenge);
}

export function getRegistrationChallenge(username: string): string | undefined {
  return regChallenges.get(username);
}

export function clearRegistrationChallenge(username: string): void {
  regChallenges.delete(username);
}

export function setAuthChallenge(username: string, challenge: string): void {
  authChallenges.set(username, challenge);
}

export function getAuthChallenge(username: string): string | undefined {
  return authChallenges.get(username);
}

export function clearAuthChallenge(username: string): void {
  authChallenges.delete(username);
}

export async function createRegistrationOptions(username: string, userId: string, existingCredentialIds: string[]) {
  return generateRegistrationOptions({
    rpID,
    rpName,
    userName: username,
    userID: new TextEncoder().encode(userId),
    attestationType: "none",
    excludeCredentials: existingCredentialIds.map((id) => ({ id, type: "public-key", transports: ["usb", "ble", "nfc", "internal"] }))
  });
}

export async function verifyRegistration(body: unknown, expectedChallenge: string): Promise<VerifiedRegistrationResponse> {
  return verifyRegistrationResponse({
    response: body as Parameters<typeof verifyRegistrationResponse>[0]["response"],
    expectedChallenge,
    expectedOrigin: origin,
    expectedRPID: rpID
  });
}

export async function createAuthenticationOptions(allowCredentialIds: string[]) {
  return generateAuthenticationOptions({
    rpID,
    allowCredentials: allowCredentialIds.map((id) => ({ id, type: "public-key" })),
    userVerification: "preferred"
  });
}

export async function verifyAuthentication(body: unknown, expectedChallenge: string, credentialPublicKey: Uint8Array, counter: number) {
  return verifyAuthenticationResponse({
    response: body as Parameters<typeof verifyAuthenticationResponse>[0]["response"],
    expectedChallenge,
    expectedOrigin: origin,
    expectedRPID: rpID,
    credential: {
      id: (body as { id: string }).id,
      publicKey: Uint8Array.from(credentialPublicKey),
      counter
    }
  }) as Promise<VerifiedAuthenticationResponse>;
}

import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

const SESSION_COOKIE = 'todo_session';
const SESSION_DAYS = 7;

export interface SessionPayload {
  userId: number;
}

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not configured');
  }
  return secret;
}

export async function createSession(userId: number): Promise<void> {
  const token = jwt.sign({ userId }, getJwtSecret(), { expiresIn: `${SESSION_DAYS}d` });
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) {
    return null;
  }

  try {
    const payload = jwt.verify(token, getJwtSecret()) as SessionPayload;
    if (!payload?.userId) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

export async function deleteSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

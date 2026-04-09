'use client';

import { startAuthentication, startRegistration } from '@simplewebauthn/browser';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function register(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const optionsResponse = await fetch('/api/auth/register-options', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }),
      });
      const optionsPayload = (await optionsResponse.json()) as { options?: unknown; error?: string };
      if (!optionsResponse.ok || !optionsPayload.options) {
        throw new Error(optionsPayload.error ?? 'Failed to get register options');
      }

      const credential = await startRegistration({ optionsJSON: optionsPayload.options as any });

      const verifyResponse = await fetch('/api/auth/register-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, response: credential }),
      });

      if (!verifyResponse.ok) {
        const failed = (await verifyResponse.json()) as { error?: string };
        throw new Error(failed.error ?? 'Registration failed');
      }

      router.push('/');
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Registration failed');
    } finally {
      setBusy(false);
    }
  }

  async function login(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const optionsResponse = await fetch('/api/auth/login-options', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }),
      });
      const optionsPayload = (await optionsResponse.json()) as { options?: unknown; error?: string };
      if (!optionsResponse.ok || !optionsPayload.options) {
        throw new Error(optionsPayload.error ?? 'Failed to get login options');
      }

      const credential = await startAuthentication({ optionsJSON: optionsPayload.options as any });

      const verifyResponse = await fetch('/api/auth/login-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, response: credential }),
      });

      if (!verifyResponse.ok) {
        const failed = (await verifyResponse.json()) as { error?: string };
        throw new Error(failed.error ?? 'Login failed');
      }

      router.push('/');
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Login failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center p-6">
      <h1 className="mb-2 text-3xl font-bold">Passkey Login</h1>
      <p className="mb-8 text-sm text-gray-600">Register once, then login with your device biometrics.</p>

      <form className="rounded-xl border border-gray-200 bg-white p-6 shadow" onSubmit={login}>
        <label htmlFor="username" className="mb-2 block text-sm font-medium">
          Username
        </label>
        <input
          id="username"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          placeholder="jane"
          className="mb-4 w-full rounded-md border border-gray-300 px-3 py-2"
          required
        />

        {error ? <p className="mb-4 rounded bg-red-50 p-2 text-sm text-red-700">{error}</p> : null}

        <div className="flex gap-3">
          <button type="submit" className="rounded bg-teal-700 px-4 py-2 text-white disabled:opacity-50" disabled={busy}>
            {busy ? 'Please wait...' : 'Login'}
          </button>
          <button type="button" className="rounded border border-teal-700 px-4 py-2 text-teal-700 disabled:opacity-50" disabled={busy} onClick={register}>
            Register
          </button>
        </div>
      </form>
    </main>
  );
}

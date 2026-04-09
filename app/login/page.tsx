"use client";

import { useState } from "react";
import { startAuthentication, startRegistration } from "@simplewebauthn/browser";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const register = async () => {
    setError(null);
    setLoading(true);
    try {
      const optionsRes = await fetch("/api/auth/register-options", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ username })
      });
      const options = await optionsRes.json();
      if (!optionsRes.ok) throw new Error(options.error || "Failed to start registration");

      const response = await startRegistration({ optionsJSON: options });

      const verifyRes = await fetch("/api/auth/register-verify", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ username, response })
      });
      const verify = await verifyRes.json();
      if (!verifyRes.ok) throw new Error(verify.error || "Registration failed");

      window.location.href = "/";
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const login = async () => {
    setError(null);
    setLoading(true);
    try {
      const optionsRes = await fetch("/api/auth/login-options", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ username })
      });
      const options = await optionsRes.json();
      if (!optionsRes.ok) throw new Error(options.error || "Failed to start login");

      const response = await startAuthentication({ optionsJSON: options });

      const verifyRes = await fetch("/api/auth/login-verify", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ username: options.username, response })
      });
      const verify = await verifyRes.json();
      if (!verifyRes.ok) throw new Error(verify.error || "Login failed");

      window.location.href = "/";
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main>
      <div className="card" style={{ maxWidth: 520, margin: "56px auto" }}>
        <h1>Todo App Login</h1>
        <p className="small">Use passkeys to register or login.</p>
        <div className="row">
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Username"
            style={{ flex: 1 }}
          />
        </div>
        {error ? <p style={{ color: "#dc2626" }}>{error}</p> : null}
        <div className="row" style={{ marginTop: 12 }}>
          <button className="primary" disabled={loading || !username.trim()} onClick={register}>
            Register
          </button>
          <button disabled={loading || !username.trim()} onClick={login}>
            Login
          </button>
        </div>
      </div>
    </main>
  );
}

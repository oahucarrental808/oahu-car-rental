import { useMemo, useState } from "react";

const KEY = "orc_admin_unlocked_until";

export default function AdminGate({ children, title = "Admin Access" }) {
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");

  const unlocked = useMemo(() => {
    const until = Number(sessionStorage.getItem(KEY) || "0");
    return Date.now() < until;
  }, []);

  function unlock(e) {
    e.preventDefault();
    setErr("");

    const expected = import.meta.env.VITE_ADMIN_PASSWORD;
    if (!expected) {
      setErr("Missing VITE_ADMIN_PASSWORD env var.");
      return;
    }
    if (pw !== expected) {
      setErr("Wrong password.");
      return;
    }

    sessionStorage.setItem(KEY, String(Date.now() + 8 * 60 * 60 * 1000)); // 8 hours
    window.location.reload();
  }

  if (unlocked) return children;

  return (
    <div style={{ maxWidth: 520, margin: "40px auto", padding: 24 }}>
      <h2 style={{ marginTop: 0 }}>{title}</h2>

      <form onSubmit={unlock} style={{ display: "grid", gap: 10 }}>
        <input
          type="password"
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          placeholder="Password"
          style={{ padding: 10, borderRadius: 10 }}
        />
        <button type="submit" style={{ padding: 10, borderRadius: 10 }}>
          Unlock
        </button>
        {err && <div style={{ color: "salmon" }}>{err}</div>}
      </form>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "@/lib/authClient";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await signIn(email, password);
      router.push("/dashboard");
      router.refresh();
    } catch (err: any) {
      setError(err.message ?? "Đăng nhập thất bại");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-bg px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm bg-panel border border-line rounded-md p-6 flex flex-col gap-4"
      >
        <h1 className="font-display text-lg uppercase tracking-wide text-center mb-2">
          Warehouse Compliance Hub
        </h1>

        <div className="flex flex-col gap-1">
          <label className="text-xs text-sub uppercase">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="bg-panel-alt border border-line rounded-sm px-3 py-2 text-sm text-ink"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs text-sub uppercase">Mật khẩu</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="bg-panel-alt border border-line rounded-sm px-3 py-2 text-sm text-ink"
          />
        </div>

        {error && <p className="text-danger text-xs">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="bg-accent text-white rounded-sm py-2 text-sm font-medium mt-2 disabled:opacity-50"
        >
          {loading ? "Đang đăng nhập..." : "Đăng nhập"}
        </button>
      </form>
    </main>
  );
}

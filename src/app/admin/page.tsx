"use client";

import Image from "next/image";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

type AuthState = "checking" | "authenticated" | "unauthenticated";
type Notice = { type: "success" | "error"; text: string };
type ApiBase = { success?: boolean; message?: string };
type SessionResponse = ApiBase & { authenticated?: boolean; email?: string };
type PaginationMeta = {
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
};
type Token = {
  id: number;
  token: string;
  status: "active" | "used";
  created_at: string;
  used_at: string | null;
};
type Vote = {
  id: number;
  token: string;
  candidate_name: string;
  created_at: string;
};
type CandidateVote = { id: number; name: string; photo: string; total_votes: number };
type StatsData = {
  candidateVotes: CandidateVote[];
  tokenSummary: { active: number; used: number; total: number };
  totalVotes: number;
  electionStatus: { isEnded: boolean; ended_at: string | null };
};
type StatsResponse = ApiBase & { stats?: StatsData };
type TokensResponse = ApiBase & { tokens?: Token[]; pagination?: PaginationMeta };
type VotesResponse = ApiBase & { votes?: Vote[]; pagination?: PaginationMeta };
type GenerateResponse = ApiBase & {
  generated_tokens_preview?: string[];
};

const COLORS = ["#2563eb", "#f59e0b", "#22c55e", "#7c3aed"];
const PAGE_OPTIONS = [20, 50, 100];
const EMPTY_PAGINATION: PaginationMeta = { page: 1, per_page: 20, total: 0, total_pages: 1 };
const dtf = new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" });

const fmt = (v?: string | null) => {
  if (!v) return "-";
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? "-" : dtf.format(d);
};

const pages = (current: number, total: number): Array<number | "..."> => {
  if (total <= 7) return Array.from({ length: Math.max(1, total) }, (_, i) => i + 1);
  const picks = [1, total, current - 1, current, current + 1]
    .filter((n) => n >= 1 && n <= total)
    .sort((a, b) => a - b);
  const uniq = Array.from(new Set(picks));
  const out: Array<number | "..."> = [];
  uniq.forEach((n, i) => {
    if (i > 0 && n - uniq[i - 1] > 1) out.push("...");
    out.push(n);
  });
  return out;
};

function Pager({
  meta,
  onPage,
  onPerPage,
}: {
  meta: PaginationMeta;
  onPage: (p: number) => void;
  onPerPage: (p: number) => void;
}) {
  const p = Math.min(Math.max(1, meta.page), Math.max(1, meta.total_pages));
  const items = pages(p, Math.max(1, meta.total_pages));
  const start = meta.total === 0 ? 0 : (p - 1) * meta.per_page + 1;
  const end = meta.total === 0 ? 0 : Math.min(p * meta.per_page, meta.total);

  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
      <p className="text-sm text-slate-600">
        Menampilkan {start}-{end} dari {meta.total}
      </p>
      <div className="flex items-center gap-2">
        <select
          value={meta.per_page}
          onChange={(e) => onPerPage(Number(e.target.value))}
          className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-sm"
        >
          {PAGE_OPTIONS.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
        <button onClick={() => onPage(p - 1)} disabled={p <= 1} className="rounded-lg border border-slate-300 bg-white px-3 py-1 text-sm disabled:opacity-50">
          Prev
        </button>
        {items.map((it, i) =>
          it === "..." ? (
            <span key={`e-${i}`} className="px-1 text-slate-500">
              ...
            </span>
          ) : (
            <button
              key={it}
              onClick={() => onPage(it)}
              className={`rounded-lg border px-3 py-1 text-sm ${it === p ? "border-blue-600 bg-blue-600 text-white" : "border-slate-300 bg-white"}`}
            >
              {it}
            </button>
          )
        )}
        <button onClick={() => onPage(p + 1)} disabled={p >= Math.max(1, meta.total_pages)} className="rounded-lg border border-slate-300 bg-white px-3 py-1 text-sm disabled:opacity-50">
          Next
        </button>
      </div>
    </div>
  );
}

export default function AdminPage() {
  const [auth, setAuth] = useState<AuthState>("checking");
  const [adminEmail, setAdminEmail] = useState("");
  const [notice, setNotice] = useState<Notice | null>(null);

  const [email, setEmail] = useState("adminpemira@gmail.com");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  const [stats, setStats] = useState<StatsData | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [tokens, setTokens] = useState<Token[]>([]);
  const [tokenMeta, setTokenMeta] = useState<PaginationMeta>({ ...EMPTY_PAGINATION });
  const [tokenPage, setTokenPage] = useState(1);
  const [tokenPerPage, setTokenPerPage] = useState(20);
  const [tokensLoading, setTokensLoading] = useState(false);
  const [votes, setVotes] = useState<Vote[]>([]);
  const [voteMeta, setVoteMeta] = useState<PaginationMeta>({ ...EMPTY_PAGINATION });
  const [votePage, setVotePage] = useState(1);
  const [votePerPage, setVotePerPage] = useState(20);
  const [votesLoading, setVotesLoading] = useState(false);

  const [genOpen, setGenOpen] = useState(false);
  const [genCount, setGenCount] = useState("3000");
  const [genLoading, setGenLoading] = useState(false);
  const [endOpen, setEndOpen] = useState(false);
  const [endCountdown, setEndCountdown] = useState(5);
  const [endLoading, setEndLoading] = useState(false);
  const [winnerShow, setWinnerShow] = useState(false);
  const [resultPopupOpen, setResultPopupOpen] = useState(false);

  const resetData = useCallback(() => {
    setStats(null);
    setTokens([]);
    setVotes([]);
    setTokenMeta({ ...EMPTY_PAGINATION });
    setVoteMeta({ ...EMPTY_PAGINATION });
  }, []);

  const onUnauthorized = useCallback(
    (message?: string) => {
      setAuth("unauthenticated");
      setAdminEmail("");
      resetData();
      setNotice({ type: "error", text: message ?? "Sesi admin berakhir. Silakan login ulang." });
    },
    [resetData]
  );

  const loadStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const response = await fetch("/api/admin/stats", { cache: "no-store" });
      const result: StatsResponse = await response.json();
      if (response.status === 401) return onUnauthorized(result.message);
      if (!response.ok || !result.success || !result.stats) throw new Error(result.message ?? "Gagal mengambil statistik.");
      setStats(result.stats);
    } catch (error) {
      setNotice({ type: "error", text: error instanceof Error ? error.message : "Gagal mengambil statistik." });
    } finally {
      setStatsLoading(false);
    }
  }, [onUnauthorized]);

  const loadTokens = useCallback(
    async (page: number, perPage: number) => {
      setTokensLoading(true);
      try {
        const response = await fetch(`/api/admin/tokens?page=${page}&per_page=${perPage}`, { cache: "no-store" });
        const result: TokensResponse = await response.json();
        if (response.status === 401) return onUnauthorized(result.message);
        if (!response.ok || !result.success || !result.tokens || !result.pagination) throw new Error(result.message ?? "Gagal mengambil data token.");
        setTokens(result.tokens);
        setTokenMeta(result.pagination);
      } catch (error) {
        setNotice({ type: "error", text: error instanceof Error ? error.message : "Gagal mengambil data token." });
      } finally {
        setTokensLoading(false);
      }
    },
    [onUnauthorized]
  );

  const loadVotes = useCallback(
    async (page: number, perPage: number) => {
      setVotesLoading(true);
      try {
        const response = await fetch(`/api/admin/votes?page=${page}&per_page=${perPage}`, { cache: "no-store" });
        const result: VotesResponse = await response.json();
        if (response.status === 401) return onUnauthorized(result.message);
        if (!response.ok || !result.success || !result.votes || !result.pagination) throw new Error(result.message ?? "Gagal mengambil data voting.");
        setVotes(result.votes);
        setVoteMeta(result.pagination);
      } catch (error) {
        setNotice({ type: "error", text: error instanceof Error ? error.message : "Gagal mengambil data voting." });
      } finally {
        setVotesLoading(false);
      }
    },
    [onUnauthorized]
  );

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      const response = await fetch("/api/admin/session", { cache: "no-store" });
      const result: SessionResponse = await response.json();
      if (cancelled) return;
      if (!response.ok || !result.success || !result.authenticated) {
        setAuth("unauthenticated");
        return;
      }
      setAdminEmail(result.email ?? "");
      setAuth("authenticated");
    };
    void run().catch(() => setAuth("unauthenticated"));
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (auth !== "authenticated") return;
    void loadStats();
  }, [auth, loadStats]);

  useEffect(() => {
    if (auth !== "authenticated") return;
    void loadTokens(tokenPage, tokenPerPage);
  }, [auth, loadTokens, tokenPage, tokenPerPage]);

  useEffect(() => {
    if (auth !== "authenticated") return;
    void loadVotes(votePage, votePerPage);
  }, [auth, loadVotes, votePage, votePerPage]);

  useEffect(() => {
    if (!endOpen || endCountdown <= 0) return;
    const timer = window.setTimeout(() => setEndCountdown((v) => Math.max(0, v - 1)), 1000);
    return () => window.clearTimeout(timer);
  }, [endOpen, endCountdown]);

  const winner = useMemo(() => {
    if (!stats || stats.candidateVotes.length === 0) return null;
    const sorted = [...stats.candidateVotes].sort((a, b) => (b.total_votes - a.total_votes) || (a.id - b.id));
    if (sorted[0].total_votes <= 0) return null;
    const ties = sorted.filter((c) => c.total_votes === sorted[0].total_votes);
    return { data: sorted[0], ties, tie: ties.length > 1 };
  }, [stats]);

  useEffect(() => {
    if (!stats?.electionStatus.isEnded || !winner) {
      setWinnerShow(false);
      return;
    }
    setWinnerShow(false);
    const timer = window.setTimeout(() => setWinnerShow(true), 120);
    return () => window.clearTimeout(timer);
  }, [stats?.electionStatus.isEnded, winner]);

  useEffect(() => {
    if (!stats?.electionStatus.isEnded) {
      setResultPopupOpen(false);
      return;
    }

    setResultPopupOpen(true);
  }, [stats?.electionStatus.isEnded]);

  const chartData = useMemo(
    () => (stats ? stats.candidateVotes.map((c) => ({ name: c.name, value: c.total_votes })) : []),
    [stats]
  );
  const hasChartValues = useMemo(
    () => chartData.some((item) => Number(item.value) > 0),
    [chartData]
  );

  const login = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError("");
    setNotice(null);
    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const result: ApiBase = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message ?? "Login admin gagal.");

      // Verify session cookie is properly applied before transitioning
      const sessionCheck = await fetch("/api/admin/session", { cache: "no-store" });
      const sessionResult: SessionResponse = await sessionCheck.json();
      if (!sessionCheck.ok || !sessionResult.success || !sessionResult.authenticated) {
        throw new Error("Sesi gagal dibuat. Silakan coba lagi.");
      }

      setAdminEmail(sessionResult.email ?? email.trim().toLowerCase());
      setPassword("");
      setAuth("authenticated");
      setNotice({ type: "success", text: "Login admin berhasil." });
    } catch (error) {
      setLoginError(error instanceof Error ? error.message : "Login admin gagal.");
    } finally {
      setLoginLoading(false);
    }
  };

  const logout = async () => {
    try {
      await fetch("/api/admin/logout", { method: "POST" });
    } finally {
      setAuth("unauthenticated");
      setAdminEmail("");
      setPassword("");
      resetData();
    }
  };

  const generateTokens = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const count = Number(genCount);
    if (!Number.isInteger(count) || count < 1 || count > 5000) {
      setNotice({ type: "error", text: "Jumlah token harus angka bulat 1 sampai 5000." });
      return;
    }
    setGenLoading(true);
    try {
      const response = await fetch("/api/admin/tokens/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ count }),
      });
      const result: GenerateResponse = await response.json();
      if (response.status === 401) return onUnauthorized(result.message);
      if (!response.ok || !result.success) throw new Error(result.message ?? "Generate token gagal.");
      setGenOpen(false);
      setTokenPage(1);
      const preview = (result.generated_tokens_preview ?? []).join(", ");
      setNotice({ type: "success", text: `${result.message ?? "Token berhasil dibuat."}${preview ? ` Contoh token: ${preview}` : ""}` });
      await Promise.all([loadStats(), loadTokens(1, tokenPerPage)]);
    } catch (error) {
      setNotice({ type: "error", text: error instanceof Error ? error.message : "Generate token gagal." });
    } finally {
      setGenLoading(false);
    }
  };

  const endPemira = async () => {
    if (endCountdown > 0 || endLoading) return;
    setEndLoading(true);
    try {
      const response = await fetch("/api/admin/end-pemira", { method: "POST" });
      const result: ApiBase = await response.json();
      if (response.status === 401) return onUnauthorized(result.message);
      if (!response.ok || !result.success) throw new Error(result.message ?? "Gagal mengakhiri pemira.");
      setEndOpen(false);
      setNotice({ type: "success", text: result.message ?? "Pemira berhasil diakhiri." });
      await Promise.all([loadStats(), loadTokens(tokenPage, tokenPerPage), loadVotes(votePage, votePerPage)]);
    } catch (error) {
      setNotice({ type: "error", text: error instanceof Error ? error.message : "Gagal mengakhiri pemira." });
    } finally {
      setEndLoading(false);
    }
  };

  if (auth === "checking") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-white">
        <div className="rounded-2xl border border-white/20 bg-white/10 px-6 py-4">
          Memuat sesi admin...
        </div>
      </main>
    );
  }

  if (auth === "unauthenticated") {
    return (
      <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-4 py-12 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(30,64,175,0.55),transparent_48%),radial-gradient(circle_at_80%_10%,rgba(14,165,233,0.35),transparent_50%),radial-gradient(circle_at_50%_90%,rgba(15,23,42,0.95),rgba(2,6,23,1))]" />
        <section className="relative w-full max-w-md rounded-3xl border border-white/20 bg-white/10 p-7 shadow-2xl backdrop-blur-xl sm:p-9">
          <h1 className="text-center text-3xl font-semibold">Login Admin</h1>
          <p className="mt-2 text-center text-sm text-blue-100/90">
            Dashboard pengelolaan Pemira OSIS 2026/2027
          </p>
          {notice && notice.type === "error" ? (
            <p className="mt-4 rounded-xl border border-red-300/45 bg-red-500/20 px-4 py-2 text-sm text-red-100">
              {notice.text}
            </p>
          ) : null}
          {loginError ? (
            <p className="mt-4 rounded-xl border border-red-300/45 bg-red-500/20 px-4 py-2 text-sm text-red-100">
              {loginError}
            </p>
          ) : null}
          <form className="mt-6 space-y-4" onSubmit={login}>
            <label className="block">
              <span className="mb-1.5 block text-sm text-blue-100">Email Admin</span>
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-white/25 bg-white/10 px-4 py-3 text-white outline-none placeholder:text-white/50 focus:border-blue-300 focus:ring-2 focus:ring-blue-300/45"
                placeholder="adminpemira@gmail.com"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm text-blue-100">Password</span>
              <input
                required
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-white/25 bg-white/10 px-4 py-3 text-white outline-none placeholder:text-white/50 focus:border-blue-300 focus:ring-2 focus:ring-blue-300/45"
                placeholder="Masukkan password admin"
              />
            </label>
            <button
              type="submit"
              disabled={loginLoading}
              className="w-full rounded-xl bg-gradient-to-r from-blue-500 to-cyan-400 px-4 py-3 text-white shadow-lg shadow-blue-600/25 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loginLoading ? "Memproses..." : "Masuk Dashboard"}
            </button>
          </form>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 text-slate-900">
      <div className="mx-auto w-full max-w-[1300px] px-4 py-6 sm:px-6 lg:px-8">
        <header className="mb-6 rounded-3xl bg-gradient-to-r from-slate-900 via-blue-900 to-slate-800 p-5 text-white shadow-xl sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold sm:text-3xl">Dashboard Admin Pemira</h1>
              <p className="mt-1 text-sm text-blue-100/90 sm:text-base">
                Login sebagai <span className="font-semibold">{adminEmail}</span>
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  setGenCount("3000");
                  setGenOpen(true);
                }}
                className="rounded-xl bg-cyan-500 px-4 py-2.5 text-sm text-white shadow-lg shadow-cyan-900/30 transition hover:bg-cyan-400"
              >
                Generate Token
              </button>
              <button
                type="button"
                onClick={() => {
                  setEndCountdown(5);
                  setEndOpen(true);
                }}
                disabled={Boolean(stats?.electionStatus.isEnded)}
                className="rounded-xl bg-amber-500 px-4 py-2.5 text-sm text-white shadow-lg shadow-amber-900/25 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {stats?.electionStatus.isEnded ? "Pemira Sudah Diakhiri" : "Akhiri Pemira"}
              </button>
              {stats?.electionStatus.isEnded ? (
                <button
                  type="button"
                  onClick={() => setResultPopupOpen(true)}
                  className="rounded-xl bg-blue-500 px-4 py-2.5 text-sm text-white shadow-lg shadow-blue-900/25 transition hover:bg-blue-400"
                >
                  Lihat Hasil Akhir
                </button>
              ) : null}
              <button
                type="button"
                onClick={logout}
                className="rounded-xl bg-white/15 px-4 py-2.5 text-sm text-white transition hover:bg-white/25"
              >
                Logout
              </button>
            </div>
          </div>
        </header>

        {notice ? (
          <div
            className={`mb-5 rounded-2xl border px-4 py-3 text-sm ${notice.type === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-red-200 bg-red-50 text-red-700"
              }`}
          >
            {notice.text}
          </div>
        ) : null}

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-sm text-slate-500">Total Token</p>
            <p className="mt-2 text-3xl font-semibold">
              {statsLoading ? "..." : stats?.tokenSummary.total ?? 0}
            </p>
          </article>
          <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-sm text-slate-500">Token Active</p>
            <p className="mt-2 text-3xl font-semibold text-emerald-600">
              {statsLoading ? "..." : stats?.tokenSummary.active ?? 0}
            </p>
          </article>
          <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-sm text-slate-500">Token Used</p>
            <p className="mt-2 text-3xl font-semibold text-blue-600">
              {statsLoading ? "..." : stats?.tokenSummary.used ?? 0}
            </p>
          </article>
          <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-sm text-slate-500">Total Suara Masuk</p>
            <p className="mt-2 text-3xl font-semibold text-slate-900">
              {statsLoading ? "..." : stats?.totalVotes ?? 0}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Status:{" "}
              {stats?.electionStatus.isEnded
                ? `Ditutup (${fmt(stats.electionStatus.ended_at)})`
                : "Masih Berjalan"}
            </p>
          </article>
        </section>

        <section className="mt-6">
          <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <h2 className="text-xl font-semibold text-slate-900">Statistik Voting</h2>
            <p className="mt-1 text-sm text-slate-500">Distribusi total suara tiap kandidat</p>
            <div className="mt-5 h-[320px]">
              {statsLoading ? (
                <div className="flex h-full items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-500">
                  Memuat statistik...
                </div>
              ) : chartData.length === 0 ? (
                <div className="flex h-full items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-500">
                  Belum ada data suara.
                </div>
              ) : !hasChartValues ? (
                <div className="flex h-full flex-col items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-500">
                  <p className="text-base font-semibold text-slate-700">Belum ada suara masuk</p>
                  <p className="mt-1 text-sm text-slate-500">Grafik akan muncul setelah ada voting.</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={110} innerRadius={58} paddingAngle={3}>
                      {chartData.map((entry, index) => (
                        <Cell key={`${entry.name}-${entry.value}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number | string | undefined, name: string | undefined) => [
                        `${Number(value ?? 0)} suara`,
                        name ?? "Kandidat",
                      ]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {chartData.map((item, index) => (
                <div
                  key={`${item.name}-${index}`}
                  className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="inline-block h-3.5 w-3.5 rounded-full"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <p className="text-sm text-slate-700">{item.name}</p>
                  </div>
                  <p className="text-sm font-semibold text-slate-900">
                    {Number(item.value)} suara
                  </p>
                </div>
              ))}
            </div>
          </article>
        </section>

        <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="text-xl font-semibold text-slate-900">Manajemen Token</h2>
          <p className="mt-1 text-sm text-slate-500">Kelola token aktif dan token used</p>
          <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200">
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse">
                <thead className="bg-slate-100 text-left text-sm text-slate-600">
                  <tr>
                    <th className="px-4 py-3 font-medium">No</th>
                    <th className="px-4 py-3 font-medium">Token</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Dibuat</th>
                    <th className="px-4 py-3 font-medium">Digunakan</th>
                  </tr>
                </thead>
                <tbody>
                  {tokensLoading ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-sm text-slate-500">
                        Memuat data token...
                      </td>
                    </tr>
                  ) : tokens.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-sm text-slate-500">
                        Belum ada data token.
                      </td>
                    </tr>
                  ) : (
                    tokens.map((token, index) => (
                      <tr key={token.id} className="border-t border-slate-100 text-sm">
                        <td className="px-4 py-3 text-slate-700">
                          {(tokenMeta.page - 1) * tokenMeta.per_page + index + 1}
                        </td>
                        <td className="px-4 py-3 font-semibold text-slate-900">{token.token}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs ${token.status === "active"
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-blue-100 text-blue-700"
                              }`}
                          >
                            {token.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-600">{fmt(token.created_at)}</td>
                        <td className="px-4 py-3 text-slate-600">{fmt(token.used_at)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
          <Pager
            meta={tokenMeta}
            onPage={setTokenPage}
            onPerPage={(v) => {
              setTokenPerPage(v);
              setTokenPage(1);
            }}
          />
        </section>

        <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="text-xl font-semibold text-slate-900">Data Voting</h2>
          <p className="mt-1 text-sm text-slate-500">
            Riwayat suara berisi token, kandidat, dan waktu memilih
          </p>
          <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200">
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse">
                <thead className="bg-slate-100 text-left text-sm text-slate-600">
                  <tr>
                    <th className="px-4 py-3 font-medium">No</th>
                    <th className="px-4 py-3 font-medium">Token</th>
                    <th className="px-4 py-3 font-medium">Kandidat</th>
                    <th className="px-4 py-3 font-medium">Waktu Memilih</th>
                  </tr>
                </thead>
                <tbody>
                  {votesLoading ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-sm text-slate-500">
                        Memuat data voting...
                      </td>
                    </tr>
                  ) : votes.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-sm text-slate-500">
                        Belum ada data voting.
                      </td>
                    </tr>
                  ) : (
                    votes.map((vote, index) => (
                      <tr key={vote.id} className="border-t border-slate-100 text-sm">
                        <td className="px-4 py-3 text-slate-700">
                          {(voteMeta.page - 1) * voteMeta.per_page + index + 1}
                        </td>
                        <td className="px-4 py-3 font-semibold text-slate-900">{vote.token}</td>
                        <td className="px-4 py-3 text-slate-700">{vote.candidate_name}</td>
                        <td className="px-4 py-3 text-slate-600">{fmt(vote.created_at)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
          <Pager
            meta={voteMeta}
            onPage={setVotePage}
            onPerPage={(v) => {
              setVotePerPage(v);
              setVotePage(1);
            }}
          />
        </section>
      </div>

      {resultPopupOpen && stats?.electionStatus.isEnded ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center px-4 py-6">
          <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm" />
          <section className="relative z-10 w-full max-w-5xl rounded-3xl border border-white/35 bg-white p-6 shadow-2xl sm:p-8">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-2xl font-semibold text-slate-900">Hasil Akhir Pemira</h3>
                <p className="mt-1 text-sm text-slate-600">
                  Rekap resmi pemilihan ketua OSIS periode 2026/2027
                </p>
              </div>
              <button
                type="button"
                onClick={() => setResultPopupOpen(false)}
                className="rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 transition hover:bg-slate-50"
              >
                Tutup
              </button>
            </div>

            <div className="mt-6 grid gap-5 lg:grid-cols-[1.2fr_1fr]">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
                <div className="h-[300px]">
                  {!hasChartValues ? (
                    <div className="flex h-full flex-col items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500">
                      <p className="text-base font-semibold text-slate-700">Belum ada suara masuk</p>
                      <p className="mt-1 text-sm text-slate-500">Tidak ada data hasil untuk ditampilkan.</p>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={chartData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={100}
                          innerRadius={52}
                          paddingAngle={3}
                        >
                          {chartData.map((entry, index) => (
                            <Cell key={`${entry.name}-popup-${entry.value}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value: number | string | undefined, name: string | undefined) => [
                            `${Number(value ?? 0)} suara`,
                            name ?? "Kandidat",
                          ]}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>
                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  {chartData.map((item, index) => (
                    <div
                      key={`${item.name}-popup-legend-${index}`}
                      className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="inline-block h-3.5 w-3.5 rounded-full"
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <p className="text-sm text-slate-700">{item.name}</p>
                      </div>
                      <p className="text-sm font-semibold text-slate-900">{Number(item.value)} suara</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 via-cyan-50 to-white p-5">
                {!winner ? (
                  <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white/80 px-4 py-8 text-center text-slate-600">
                    Belum ada pemenang karena belum ada suara masuk.
                  </div>
                ) : (
                  <div
                    className={`transition duration-700 ${winnerShow ? "translate-y-0 scale-100 opacity-100" : "translate-y-3 scale-[0.98] opacity-0"
                      }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl border border-blue-100 bg-white">
                        <Image
                          src={winner.data.photo}
                          alt={winner.data.name}
                          fill
                          className="object-cover"
                          sizes="80px"
                          unoptimized
                        />
                      </div>
                      <div>
                        <p className="inline-flex rounded-full bg-emerald-500 px-3 py-1 text-xs text-white">Pemenang</p>
                        <h4 className="mt-2 text-2xl font-semibold text-slate-900">{winner.data.name}</h4>
                      </div>
                    </div>
                    <p className="mt-5 text-lg leading-relaxed text-slate-700">
                      {winner.tie
                        ? `Hasil seri teratas antara ${winner.ties.map((c) => c.name).join(", ")} dengan ${winner.data.total_votes} suara.`
                        : `Selamat kepada ${winner.data.name} atas terpilihnya sebagai ketua OSIS periode 2026/2027 dengan total ${winner.data.total_votes} suara.`}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>
      ) : null}

      {genOpen ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center px-4 py-6">
          <button
            type="button"
            aria-label="Tutup modal generate token"
            onClick={() => (genLoading ? null : setGenOpen(false))}
            className="absolute inset-0 bg-slate-950/45 backdrop-blur-sm"
          />
          <section className="relative z-10 w-full max-w-md rounded-3xl border border-white/30 bg-white p-6 shadow-2xl">
            <h3 className="text-2xl font-semibold text-slate-900">Generate Token</h3>
            <p className="mt-1 text-sm text-slate-600">
              Tentukan jumlah token yang ingin dibuat sekaligus.
            </p>
            <form className="mt-5 space-y-4" onSubmit={generateTokens}>
              <label className="block">
                <span className="mb-1.5 block text-sm text-slate-700">Jumlah token</span>
                <input
                  type="number"
                  min={1}
                  max={5000}
                  step={1}
                  required
                  value={genCount}
                  onChange={(e) => setGenCount(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                />
              </label>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setGenOpen(false)}
                  disabled={genLoading}
                  className="rounded-xl border border-slate-300 px-4 py-2 text-slate-700 disabled:opacity-60"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={genLoading}
                  className="rounded-xl bg-blue-600 px-4 py-2 text-white disabled:opacity-60"
                >
                  {genLoading ? "Memproses..." : "Generate"}
                </button>
              </div>
            </form>
          </section>
        </div>
      ) : null}

      {endOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6">
          <button
            type="button"
            aria-label="Tutup konfirmasi akhiri pemira"
            onClick={() => (endLoading ? null : setEndOpen(false))}
            className="absolute inset-0 bg-slate-950/55 backdrop-blur-sm"
          />
          <section className="relative z-10 w-full max-w-lg rounded-3xl border border-white/30 bg-white p-6 shadow-2xl sm:p-7">
            <h3 className="text-2xl font-semibold text-slate-900">Akhiri Pemira</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              Setelah diakhiri, semua token yang masih active akan menjadi used dan sesi
              voting ditutup.
            </p>
            <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-800">
              <p className="text-sm">
                Konfirmasi aktif dalam <span className="text-lg font-semibold">{endCountdown}</span>{" "}
                detik
              </p>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEndOpen(false)}
                disabled={endLoading}
                className="rounded-xl border border-slate-300 px-4 py-2 text-slate-700 disabled:opacity-60"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={endPemira}
                disabled={endCountdown > 0 || endLoading}
                className="rounded-xl bg-amber-500 px-4 py-2 text-white disabled:opacity-60"
              >
                {endLoading
                  ? "Memproses..."
                  : endCountdown > 0
                    ? `Tunggu ${endCountdown} detik`
                    : "Ya, Akhiri Sekarang"}
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </main>
  );
}

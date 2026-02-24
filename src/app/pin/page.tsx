"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { sanitizeVotingPin } from "@/lib/pin";

export default function PinPage() {
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage("");

    const rawPin = sanitizeVotingPin(pin);

    if (!/^\d{5,8}$/.test(rawPin)) {
      setErrorMessage(
        "PIN harus angka 5 sampai 8 digit. Jika PIN diawali 0, cukup tulis angkanya."
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/verify-token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ pin: rawPin }),
      });

      const result: { success?: boolean; message?: string; pin?: string } =
        await response.json();

      if (!response.ok || !result.success) {
        setErrorMessage(result.message ?? "PIN tidak valid.");
        return;
      }

      localStorage.setItem("voting_pin", result.pin ?? rawPin);
      router.push("/vote");
    } catch {
      setErrorMessage("Gagal terhubung ke server. Coba lagi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main
      className="relative flex min-h-screen items-center justify-center bg-cover bg-center bg-no-repeat px-6 py-10"
      style={{ backgroundImage: "url('/assets/login.png')" }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950/70 via-slate-900/55 to-blue-950/65" />

      <section className="relative w-full max-w-xl overflow-hidden rounded-[2rem] border border-white/30 bg-slate-900/35 p-10 shadow-[0_30px_80px_rgba(2,6,23,0.55)] backdrop-blur-xl sm:p-12">
        <div className="pointer-events-none absolute -right-10 -top-14 h-52 w-52 rounded-full bg-blue-400/25 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-12 h-56 w-56 rounded-full bg-cyan-300/20 blur-3xl" />

        <div className="relative">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 text-3xl text-white shadow-lg backdrop-blur-sm">
            #
          </div>
          <h1 className="mt-6 text-center text-4xl font-bold text-white">PEMIRA OSIS</h1>
          <p className="mt-3 text-center text-lg text-slate-200">
            Periode 2026/2027
          </p>
          <p className="mt-2 text-center text-base text-slate-200/90">
            Masukkan PIN voting untuk melanjutkan proses pemilihan.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="relative mt-9 space-y-6">
          <label htmlFor="pin" className="block text-lg font-semibold text-slate-100">
            PIN Voting
          </label>
          <input
            id="pin"
            name="pin"
            type="password"
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder="Contoh: 123456 / 12345678"
            required
            value={pin}
            onChange={(event) => setPin(event.target.value.replace(/\D/g, "").slice(0, 8))}
            maxLength={8}
            className="w-full rounded-2xl border border-white/35 bg-white/15 px-5 py-4 text-center text-2xl font-semibold tracking-[0.25em] text-white shadow-sm outline-none transition placeholder:text-base placeholder:font-medium placeholder:tracking-normal placeholder:text-slate-200/80 focus:border-blue-300 focus:ring-4 focus:ring-blue-200/45"
          />
          <p className="-mt-2 text-sm text-slate-200/90">
            PIN bersifat rahasia dan hanya dapat dipakai satu kali. Jika token diawali 0, Anda tetap bisa masukkan tanpa 0 depan.
          </p>

          {errorMessage ? (
            <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700" role="alert">
              {errorMessage}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={isSubmitting || !pin.trim()}
            className="group relative w-full overflow-hidden rounded-2xl bg-gradient-to-b from-[#9bd0ff] via-[#3d8df5] to-[#2368d9] px-5 py-4 text-lg font-semibold text-white shadow-[0_9px_0_0_#1850ad,0_18px_30px_rgba(23,81,170,0.45)] transition-all duration-300 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-white/0 via-white/30 to-white/0 transition-transform duration-700 group-hover:translate-x-full" />
            <span className="relative inline-flex items-center gap-2">
              {isSubmitting ? "Memverifikasi..." : "Submit"}
              <span className="text-base leading-none transition-transform duration-300 group-hover:translate-x-1">
                &rarr;
              </span>
            </span>
          </button>
        </form>
      </section>
    </main>
  );
}

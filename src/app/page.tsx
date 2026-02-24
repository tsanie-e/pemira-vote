import Link from "next/link";

export default function Home() {
  return (
    <main
      className="relative flex min-h-screen items-end justify-center bg-cover bg-center bg-no-repeat px-6 pb-68 sm:pb-72 md:pb-76"
      style={{ backgroundImage: "url('/assets/cover.png')" }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950/75 via-slate-900/65 to-blue-950/70" />

      <div className="relative flex flex-col items-center">
        <Link
          href="/pin"
          className="group relative inline-flex h-14 w-72 items-center justify-center overflow-hidden rounded-full bg-gradient-to-b from-[#9bd0ff] via-[#3d8df5] to-[#2368d9] text-[2rem] uppercase tracking-[0.08em] text-white shadow-[0_9px_0_0_#1850ad,0_18px_30px_rgba(23,81,170,0.45)] transition-transform duration-200 hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white sm:h-16 sm:w-[24rem] md:w-[26rem]"
        >
          <span className="absolute inset-x-6 top-1.5 h-[42%] rounded-full bg-white/35 blur-[1px]" />
          <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-white/0 via-white/35 to-white/0 transition-transform duration-700 group-hover:translate-x-full" />
          <span className="relative drop-shadow-[0_2px_2px_rgba(0,0,0,0.35)]">
            Lanjut
          </span>
        </Link>
      </div>
    </main>
  );
}

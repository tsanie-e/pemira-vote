"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getCandidateDetail } from "@/lib/candidate-profiles";

type Candidate = {
  id: number;
  name: string;
  class_name: string;
  photo: string;
};

type ApiResponse<T = unknown> = {
  success?: boolean;
  message?: string;
  candidates?: T;
};

type CandidateSection = {
  title: string;
  content: string | string[];
};

export default function VotePage() {
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [submittingCandidateId, setSubmittingCandidateId] = useState<number | null>(null);
  const [pendingCandidate, setPendingCandidate] = useState<Candidate | null>(null);
  const [profileCandidate, setProfileCandidate] = useState<Candidate | null>(null);
  const [profileSlideIndex, setProfileSlideIndex] = useState(0);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    const initializeVotePage = async () => {
      const storedPin = localStorage.getItem("voting_pin");

      if (!storedPin) {
        router.replace("/pin");
        return;
      }

      try {
        const verifyResponse = await fetch("/api/verify-token", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ pin: storedPin }),
        });

        const verifyResult: ApiResponse = await verifyResponse.json();

        if (!verifyResponse.ok || !verifyResult.success) {
          localStorage.removeItem("voting_pin");
          router.replace("/pin");
          return;
        }

        const candidatesResponse = await fetch("/api/candidates");
        const candidatesResult: ApiResponse<Candidate[]> = await candidatesResponse.json();

        if (
          !candidatesResponse.ok ||
          !candidatesResult.success ||
          !Array.isArray(candidatesResult.candidates)
        ) {
          if (!cancelled) {
            setErrorMessage(candidatesResult.message ?? "Data kandidat gagal dimuat.");
          }
          return;
        }

        if (!cancelled) {
          setPin(storedPin);
          setCandidates(candidatesResult.candidates);
        }
      } catch {
        if (!cancelled) {
          setErrorMessage("Gagal terhubung ke server.");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    initializeVotePage();

    return () => {
      cancelled = true;
    };
  }, [router]);

  const handleVoteClick = (candidate: Candidate) => {
    if (!pin || submittingCandidateId !== null || showSuccessModal) {
      return;
    }
    setErrorMessage("");
    setProfileCandidate(null);
    setPendingCandidate(candidate);
  };

  const handleProfileOpen = (candidate: Candidate) => {
    if (submittingCandidateId !== null || pendingCandidate || showSuccessModal) {
      return;
    }
    setProfileCandidate(candidate);
    setProfileSlideIndex(0);
  };

  const handleProfileClose = () => {
    setProfileCandidate(null);
    setProfileSlideIndex(0);
  };

  const handleVoteConfirm = async () => {
    if (!pendingCandidate || !pin || submittingCandidateId !== null) {
      return;
    }

    setErrorMessage("");
    setSubmittingCandidateId(pendingCandidate.id);

    try {
      const response = await fetch("/api/vote", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ pin, candidateId: pendingCandidate.id }),
      });

      const result: ApiResponse = await response.json();

      if (!response.ok || !result.success) {
        setErrorMessage(result.message ?? "Vote gagal diproses.");

        if (response.status === 401 || response.status === 409) {
          localStorage.removeItem("voting_pin");
          router.replace("/pin");
        }
        return;
      }

      localStorage.removeItem("voting_pin");
      setPendingCandidate(null);
      setShowSuccessModal(true);
    } catch {
      setErrorMessage("Terjadi kesalahan saat mengirim vote.");
    } finally {
      setSubmittingCandidateId(null);
    }
  };

  const handleCloseSuccessModal = () => {
    setShowSuccessModal(false);
    router.replace("/");
  };

  const profileDetail = profileCandidate
    ? getCandidateDetail(
        profileCandidate.id,
        profileCandidate.name,
        profileCandidate.class_name
      )
    : null;

  const profileSections: CandidateSection[] = profileDetail
    ? [
        {
          title: "Visi",
          content: profileDetail.visi,
        },
        {
          title: "Misi",
          content: profileDetail.misi,
        },
        {
          title: "Program Kerja",
          content: profileDetail.programKerja,
        },
      ]
    : [];

  if (isLoading) {
    return (
      <main
        className="relative flex min-h-screen items-center justify-center bg-cover bg-center bg-no-repeat px-6 py-10 text-white"
        style={{ backgroundImage: "url('/assets/background.png')" }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950/75 via-slate-900/65 to-blue-950/70" />
        <p className="relative rounded-xl bg-white/10 px-5 py-3 text-sm backdrop-blur-sm">
          Memuat halaman voting...
        </p>
      </main>
    );
  }

  return (
    <main
      className="relative min-h-screen bg-cover bg-center bg-no-repeat px-6 py-10 text-white"
      style={{ backgroundImage: "url('/assets/background.png')" }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950/75 via-slate-900/65 to-blue-950/70" />
      <section className="relative mx-auto w-full max-w-6xl">
        <header className="mb-8 text-center">
          <h1 className="text-3xl font-bold sm:text-4xl">Pilih Kandidat</h1>
          <p className="mt-2 text-sm text-slate-200">
            Anda hanya dapat memilih satu kandidat. Pilihan tidak dapat diubah.
          </p>
        </header>

        {errorMessage ? (
          <p className="mx-auto mb-6 max-w-xl rounded-xl border border-red-300/60 bg-red-100/95 px-4 py-3 text-center text-sm text-red-700">
            {errorMessage}
          </p>
        ) : null}

        {candidates.length === 0 ? (
          <div className="mx-auto max-w-xl rounded-2xl bg-white/10 p-8 text-center">
            <p className="text-slate-100">Kandidat belum tersedia.</p>
            <Link
              href="/"
              className="mt-5 inline-flex rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-900"
            >
              Kembali ke Cover
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-3">
            {candidates.map((candidate) => (
              <article
                key={candidate.id}
                className="overflow-hidden rounded-3xl border border-white/20 bg-white/10 shadow-2xl backdrop-blur-sm"
              >
                <button
                  type="button"
                  onClick={() => handleProfileOpen(candidate)}
                  className="group relative block aspect-[3/4] w-full cursor-pointer overflow-hidden"
                >
                  <Image
                    src={candidate.photo}
                    alt={candidate.name}
                    fill
                    className="object-cover transition duration-300 group-hover:scale-[1.03]"
                    sizes="(max-width: 768px) 100vw, 33vw"
                    unoptimized
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/55 via-transparent to-transparent" />
                </button>

                <div className="space-y-4 p-5">
                  <div className="space-y-1 text-center">
                    <h2 className="text-xl font-semibold">{candidate.name}</h2>
                    <p className="text-base text-slate-200">{candidate.class_name}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleVoteClick(candidate)}
                    disabled={submittingCandidateId !== null || showSuccessModal}
                    className="w-full rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {submittingCandidateId === candidate.id ? "Menyimpan vote..." : "Pilih"}
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {profileCandidate && profileDetail ? (
        <div className="fixed inset-0 z-30 flex items-center justify-center px-4 py-4 sm:px-6 sm:py-6">
          <button
            type="button"
            aria-label="Tutup profil kandidat"
            onClick={handleProfileClose}
            className="absolute inset-0 bg-slate-950/50 backdrop-blur-md"
          />
          <section className="relative z-10 h-auto max-h-[90vh] w-full max-w-[72rem] overflow-hidden rounded-[2.1rem] border border-white/45 bg-white/50 p-5 text-slate-900 shadow-[0_30px_80px_rgba(15,23,42,0.38)] backdrop-blur-2xl sm:p-7 md:p-8">
            <button
              type="button"
              onClick={handleProfileClose}
              className="absolute right-5 top-5 rounded-full bg-slate-900/10 px-3 py-1 text-sm font-semibold text-slate-700 transition hover:bg-slate-900/20"
            >
              X
            </button>

            <div className="grid h-full gap-6 md:grid-cols-[300px_1fr] md:items-end">
              <div className="relative mx-auto h-72 w-56 overflow-hidden rounded-2xl md:mx-0 md:h-[24rem] md:w-[17rem]">
                <Image
                  src={profileDetail.popupPhoto}
                  alt={profileDetail.name}
                  fill
                  className="object-contain object-bottom"
                  sizes="272px"
                  unoptimized
                />
              </div>

              <div className="flex h-full flex-col">
                <div className="mb-3 flex flex-wrap items-end gap-3 border-b border-slate-300 pb-3">
                  <p className="text-4xl font-bold leading-none">
                    {String(profileCandidate.id).padStart(2, "0")}
                  </p>
                  <span
                    aria-hidden
                    className="mb-1 inline-block h-8 w-px bg-slate-500/50"
                  />
                  <div>
                    <h2 className="text-2xl font-bold leading-tight">{profileDetail.name}</h2>
                    <p className="text-lg text-slate-700">{profileDetail.className}</p>
                  </div>
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto pr-2">
                  <h3 className="text-2xl font-bold md:text-3xl">
                    {profileSections[profileSlideIndex]?.title} :
                  </h3>
                  {Array.isArray(profileSections[profileSlideIndex]?.content) ? (
                    <ol className="mt-3 list-decimal space-y-2 pl-5 text-base leading-relaxed text-slate-800 md:text-lg">
                      {(profileSections[profileSlideIndex].content as string[]).map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ol>
                  ) : (
                    <p className="mt-3 text-lg leading-relaxed text-slate-800 md:text-2xl">
                      {profileSections[profileSlideIndex]?.content as string}
                    </p>
                  )}
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setProfileSlideIndex((value) => Math.max(value - 1, 0))}
                    disabled={profileSlideIndex === 0}
                    className="rounded-full bg-slate-900/10 px-4 py-2 text-lg font-semibold text-slate-700 transition hover:bg-slate-900/20 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {"<"}
                  </button>

                  <div className="flex items-center gap-2.5 rounded-full bg-slate-900/10 px-3 py-1 backdrop-blur-sm">
                    {profileSections.map((section, index) => (
                      <button
                        key={section.title}
                        type="button"
                        aria-label={`Lihat slide ${section.title}`}
                        onClick={() => setProfileSlideIndex(index)}
                        className={`h-3.5 w-3.5 rounded-full border transition ${
                          profileSlideIndex === index
                            ? "border-white/80 bg-[#2d7ef0] shadow-[0_0_0_2px_rgba(45,126,240,0.3)]"
                            : "border-slate-400/70 bg-slate-600/85 hover:bg-slate-600"
                        }`}
                      />
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setProfileSlideIndex((value) =>
                        Math.min(value + 1, profileSections.length - 1)
                      )
                    }
                    disabled={profileSlideIndex === profileSections.length - 1}
                    className="rounded-full bg-slate-900/10 px-4 py-2 text-lg font-semibold text-slate-700 transition hover:bg-slate-900/20 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {">"}
                  </button>
                </div>
              </div>
            </div>
          </section>
        </div>
      ) : null}

      {pendingCandidate ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center px-4">
          <button
            type="button"
            aria-label="Tutup konfirmasi"
            onClick={() => (submittingCandidateId === null ? setPendingCandidate(null) : null)}
            className="absolute inset-0 bg-slate-950/55 backdrop-blur-[1px]"
          />
          <section className="relative z-10 w-full max-w-2xl rounded-[2rem] border border-white/40 bg-white/80 p-8 text-center text-slate-900 shadow-[0_24px_60px_rgba(15,23,42,0.35)] backdrop-blur-md sm:p-10">
            <h2 className="text-3xl font-semibold">Konfirmasi Pilihan</h2>
            <p className="mt-5 text-2xl leading-snug">
              Anda memilih {pendingCandidate.name}.
              <br />
              Lanjutkan untuk memilih pilihan Anda?
            </p>
            <div className="mt-8 grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setPendingCandidate(null)}
                disabled={submittingCandidateId !== null}
                className="rounded-full bg-gradient-to-b from-[#9bd0ff] via-[#3d8df5] to-[#2368d9] px-4 py-2 text-xl uppercase tracking-wide text-white shadow-[0_6px_0_0_#1850ad,0_10px_22px_rgba(23,81,170,0.35)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleVoteConfirm}
                disabled={submittingCandidateId !== null}
                className="rounded-full bg-gradient-to-b from-[#9bd0ff] via-[#3d8df5] to-[#2368d9] px-4 py-2 text-xl uppercase tracking-wide text-white shadow-[0_6px_0_0_#1850ad,0_10px_22px_rgba(23,81,170,0.35)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {submittingCandidateId !== null ? "Proses..." : "Setuju"}
              </button>
            </div>
          </section>
        </div>
      ) : null}

      {showSuccessModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-slate-950/55 backdrop-blur-[1px]" />
          <section className="relative z-10 w-full max-w-2xl rounded-[2rem] border border-white/40 bg-white/80 p-8 text-center text-slate-900 shadow-[0_24px_60px_rgba(15,23,42,0.35)] backdrop-blur-md sm:p-10">
            <h2 className="text-3xl font-semibold">Suara Anda Sudah Terekam!</h2>
            <p className="mt-5 text-2xl leading-snug">
              Terima kasih, sudah berpartisipasi
              <br />
              dalam pemilihan ketua OSIS
              <br />
              periode 2026-2027
            </p>
            <button
              type="button"
              onClick={handleCloseSuccessModal}
              className="mt-8 rounded-full bg-gradient-to-b from-[#9bd0ff] via-[#3d8df5] to-[#2368d9] px-10 py-2 text-xl uppercase tracking-wide text-white shadow-[0_6px_0_0_#1850ad,0_10px_22px_rgba(23,81,170,0.35)] transition hover:-translate-y-0.5"
            >
              Kembali
            </button>
          </section>
        </div>
      ) : null}
    </main>
  );
}

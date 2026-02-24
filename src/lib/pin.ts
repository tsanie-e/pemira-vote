export const sanitizeVotingPin = (input: string) =>
  String(input ?? "").replace(/\D/g, "").trim();

export const getVotingPinCandidates = (input: string) => {
  const digitsOnly = sanitizeVotingPin(input);

  if (!/^\d{5,8}$/.test(digitsOnly)) {
    return [];
  }

  const candidates: string[] = [];

  if (digitsOnly.length === 6 || digitsOnly.length === 8) {
    candidates.push(digitsOnly);
  }

  if (digitsOnly.length < 6) {
    candidates.push(digitsOnly.padStart(6, "0"));
  }

  if (digitsOnly.length < 8) {
    candidates.push(digitsOnly.padStart(8, "0"));
  }

  return Array.from(new Set(candidates));
};

export const normalizeVotingPin = (input: string) => {
  const candidates = getVotingPinCandidates(input);
  return candidates[0] ?? null;
};

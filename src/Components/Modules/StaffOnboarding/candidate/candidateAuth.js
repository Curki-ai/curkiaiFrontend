const SESSION_KEY = "candidateSession";

export const saveCandidateSession = (session) => {
  const payload = {
    email: session.email,
    organisationId: session.organisationId,
    candidateId: session.candidateId || "",
    candidateName: session.candidateName || "",
    token: session.token || "",
    issuedAt: Date.now(),
  };
  localStorage.setItem(SESSION_KEY, JSON.stringify(payload));
  return payload;
};

export const getCandidateSession = () => {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.email || !parsed?.organisationId) return null;
    return parsed;
  } catch (err) {
    return null;
  }
};

export const clearCandidateSession = () => {
  localStorage.removeItem(SESSION_KEY);
};

export const isCandidateAuthenticated = () => {
  return !!getCandidateSession();
};

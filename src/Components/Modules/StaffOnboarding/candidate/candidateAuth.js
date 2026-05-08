// Candidate session is stored in localStorage. A candidate can be shortlisted
// in more than one organisation, so we keep:
//   - organizations[]      : every org membership returned by the backend
//   - currentOrganizationId: which one the candidate is acting under right now
//
// The legacy `organisationId` / `candidateId` / `candidateName` fields are
// still emitted so older readers that haven't been updated keep working —
// they always reflect the *current* org's values.

const SESSION_KEY = "candidateSession";

const findOrg = (organizations, orgId) =>
  (organizations || []).find((o) => o.organizationId === orgId) || null;

export const saveCandidateSession = ({
  email,
  organizations = [],
  currentOrganizationId,
  token = "",
}) => {
  const orgs = organizations.map((o) => ({
    organizationId: o.organizationId,
    organizationName: o.organizationName || "",
    candidateId: o.candidateId || "",
    candidateName: o.candidateName || "",
    candidateEmail: o.candidateEmail || email || "",
  }));

  const fallbackId =
    currentOrganizationId && findOrg(orgs, currentOrganizationId)
      ? currentOrganizationId
      : orgs[0]?.organizationId || "";

  const current = findOrg(orgs, fallbackId);

  const payload = {
    email,
    organizations: orgs,
    currentOrganizationId: fallbackId,
    // Convenience mirrors of the active membership — keeps old consumers
    // (getCandidateSession().organisationId) working unchanged.
    organisationId: fallbackId,
    candidateId: current?.candidateId || "",
    candidateName: current?.candidateName || "",
    token,
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
    if (!parsed?.email) return null;

    // Back-compat: a session saved before multi-org support only had
    // `organisationId`. Promote it into the new shape so the rest of the app
    // can rely on `organizations[]`.
    if (!Array.isArray(parsed.organizations) || !parsed.organizations.length) {
      if (!parsed.organisationId) return null;
      return {
        ...parsed,
        organizations: [
          {
            organizationId: parsed.organisationId,
            organizationName: "",
            candidateId: parsed.candidateId || "",
            candidateName: parsed.candidateName || "",
            candidateEmail: parsed.email,
          },
        ],
        currentOrganizationId: parsed.organisationId,
      };
    }

    if (!parsed.currentOrganizationId) return null;
    return parsed;
  } catch (err) {
    return null;
  }
};

export const setCurrentOrganization = (organizationId) => {
  const session = getCandidateSession();
  if (!session) return null;
  if (!findOrg(session.organizations, organizationId)) return session;
  return saveCandidateSession({
    email: session.email,
    organizations: session.organizations,
    currentOrganizationId: organizationId,
    token: session.token,
  });
};

export const getCurrentOrganization = () => {
  const session = getCandidateSession();
  if (!session) return null;
  return findOrg(session.organizations, session.currentOrganizationId);
};

export const clearCandidateSession = () => {
  localStorage.removeItem(SESSION_KEY);
};

export const isCandidateAuthenticated = () => {
  return !!getCandidateSession();
};

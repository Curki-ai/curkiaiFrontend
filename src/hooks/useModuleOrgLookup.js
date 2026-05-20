import { useEffect, useState, useCallback } from "react";
import { auth } from "../firebase";

// Shared module-org lookup. Each per-module component (Client Event
// Reporting, Incident Auditing, Quality and Risk, SIRS, Incident Report,
// Custom Incident Mgmt, Smart Rostering) calls
// /api/<module>/organizations/by-email on mount. The result drives:
//   - organizationId       → used for any data fetch the module scopes by org
//   - currentUserRole      → admin/staff (whether to show Access Management)
//   - userStates           → state-based access if the module honors it
//   - orgLookupStatus      → "loading" | "found" | "not_found"
//
// We also pass firebase_uid so the backend heal-path can backfill it onto
// the access doc + seed payment_plans on first sign-in.
//
// Returns:
//   refresh        — re-fetch /by-email (used after register-org flow)
//   forceNotFound  — flip status to "not_found" without re-fetching. Use
//                    when the access middleware reports no row exists for
//                    the user's firebase_uid (the /by-email row may be a
//                    stale email match with no UID stamped, so re-fetching
//                    would just bring it back). Bypasses the hook to land
//                    the user on NoOrgEmptyState directly.

const useModuleOrgLookup = ({ userEmail, orgsApiBase }) => {
  const [organizationId, setOrganizationId] = useState(null);
  const [organizationName, setOrganizationName] = useState("");
  const [currentUserRole, setCurrentUserRole] = useState(null);
  const [userStates, setUserStates] = useState([]);
  const [orgLookupStatus, setOrgLookupStatus] = useState("loading");

  const refresh = useCallback(async () => {
    if (!userEmail || !orgsApiBase) return;
    setOrgLookupStatus("loading");
    try {
      const firebase_uid = auth.currentUser?.uid || "";
      const url =
        `${orgsApiBase}/by-email?email=${encodeURIComponent(userEmail)}` +
        (firebase_uid ? `&firebase_uid=${encodeURIComponent(firebase_uid)}` : "");
      const res = await fetch(url);
      const data = await res.json();
      const first = data?.organizations?.[0];
      if (res.ok && data?.ok && first?.organizationId) {
        setOrganizationId(first.organizationId);
        setOrganizationName(first.organizationName || "");
        setCurrentUserRole(String(first.role || "").toLowerCase());
        setUserStates(Array.isArray(first.states) ? first.states : []);
        setOrgLookupStatus("found");
      } else {
        setOrganizationId(null);
        setOrganizationName("");
        setCurrentUserRole(null);
        setUserStates([]);
        setOrgLookupStatus("not_found");
      }
    } catch (err) {
      console.error("[useModuleOrgLookup] failed", { orgsApiBase, err });
      setOrgLookupStatus("not_found");
    }
  }, [userEmail, orgsApiBase]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const forceNotFound = useCallback(() => {
    setOrganizationId(null);
    setOrganizationName("");
    setCurrentUserRole(null);
    setUserStates([]);
    setOrgLookupStatus("not_found");
  }, []);

  return {
    organizationId,
    organizationName,
    currentUserRole,
    userStates,
    orgLookupStatus,
    refresh,
    forceNotFound,
  };
};

export default useModuleOrgLookup;

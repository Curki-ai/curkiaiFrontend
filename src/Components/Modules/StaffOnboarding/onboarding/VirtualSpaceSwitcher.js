import React, { useCallback, useEffect, useRef, useState } from "react";
import { FiCheck, FiChevronDown, FiLayers, FiPlus } from "react-icons/fi";
import { API_BASE } from "../../../../config/apiBase";
import { auth } from "../../../../firebase";
import "../../../../Styles/general-styles/VirtualSpaceSwitcher.css";

// Virtual Space switcher — a single button + dropdown rendered above the
// Staff Onboarding tab nav. Lets the owner create/switch virtual spaces and
// lets invited admins switch between the spaces they belong to.
//
// A virtual space has its own organizationId (<baseOrgId>hrV1, hrV2, ...).
// Switching simply hands a different organizationId to the StaffOnboarding
// subtree via onSwitch — every CRUD call is keyed on it, so the data isolates.
//
// Props:
//   baseOrganizationId  — the Main org id (fixed for the session)
//   activeOrganizationId — the currently-selected org id (Main or a space)
//   onSwitch(orgId)     — called to change the active workspace
//   userEmail           — signed-in user's email (for request headers)
const ORGS_BASE = `${API_BASE}/api/organizations`;

const VirtualSpaceSwitcher = ({
  baseOrganizationId,
  activeOrganizationId,
  onSwitch,
  userEmail,
}) => {
  const [spaces, setSpaces] = useState([]);
  const [isOwner, setIsOwner] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  // mainOrganization describes the parent of the current hierarchy. After
  // the main org is deleted but virtual spaces survive, baseOrganizationId
  // is itself a VS — `mainOrganization.exists` is then false and the
  // dropdown hides the "Main organization" entry. The id field is the
  // (possibly deleted) main-org id; the name is its display label.
  const [mainOrganization, setMainOrganization] = useState({
    organizationId: null,
    organizationName: "",
    exists: false,
  });
  // True when the supplied baseOrganizationId is itself a virtual space
  // (because the main org was deleted and by-email resolved the user into
  // a VS via the user_access fallback). Used to suppress UI affordances
  // that only make sense when on the main org.
  const [callerIsVirtualSpace, setCallerIsVirtualSpace] = useState(false);
  const rootRef = useRef(null);
  // Ensures the persisted-space restore runs at most once per mount.
  const restoredRef = useRef(false);

  // Headers for an authenticated backend call. The BASE org id goes in
  // x-organization-id so requireSmartOnboardingAdmin gates on base-org
  // membership. Mirrors the requestHeaders helper in
  // SmartOnboardingAccessManagement.js.
  const requestHeaders = useCallback(async () => {
    const headers = { "Content-Type": "application/json" };
    if (userEmail) headers["x-user-email"] = userEmail;
    if (baseOrganizationId)
      headers["x-organization-id"] = String(baseOrganizationId);
    if (auth.currentUser) {
      try {
        const token = await auth.currentUser.getIdToken();
        if (token) headers["Authorization"] = `Bearer ${token}`;
      } catch (err) {
        console.warn("[virtual-space] getIdToken failed:", err?.message);
      }
    }
    return headers;
  }, [userEmail, baseOrganizationId]);

  const fetchSpaces = useCallback(async () => {
    if (!baseOrganizationId) return;
    try {
      const res = await fetch(`${ORGS_BASE}/virtual-spaces`, {
        method: "GET",
        headers: await requestHeaders(),
      });
      const data = await res.json();
      if (res.ok && data?.ok) {
        setSpaces(Array.isArray(data.virtualSpaces) ? data.virtualSpaces : []);
        setIsOwner(!!data.isOwner);
        setMainOrganization(
          data.mainOrganization && typeof data.mainOrganization === "object"
            ? {
                organizationId: data.mainOrganization.organizationId || null,
                organizationName: data.mainOrganization.organizationName || "",
                exists: !!data.mainOrganization.exists,
              }
            : {
                organizationId: baseOrganizationId,
                organizationName: "",
                exists: true,
              }
        );
        setCallerIsVirtualSpace(!!data.callerIsVirtualSpace);
      }
    } catch (err) {
      console.error("[virtual-space] list failed:", err);
    } finally {
      setLoaded(true);
    }
  }, [baseOrganizationId, requestHeaders]);

  useEffect(() => {
    fetchSpaces();
  }, [fetchSpaces]);

  // Stale-selection guard: if the active space is no longer in the caller's
  // list (deleted, or access revoked), fall back to the Main org.
  useEffect(() => {
    if (!loaded || !baseOrganizationId || !activeOrganizationId) return;
    if (activeOrganizationId === baseOrganizationId) return;
    if (!spaces.some((s) => s.organizationId === activeOrganizationId)) {
      onSwitch(baseOrganizationId);
    }
  }, [loaded, spaces, activeOrganizationId, baseOrganizationId, onSwitch]);

  // Restore a persisted virtual-space selection — but only once the real
  // space list has loaded, and only if the saved space still exists. A stale
  // entry (e.g. the space was deleted) is removed and ignored, so the app is
  // never stranded on a dead organizationId.
  useEffect(() => {
    if (!loaded || restoredRef.current || !baseOrganizationId) return;
    restoredRef.current = true;
    let stored = null;
    try {
      stored = localStorage.getItem(`so_active_org_${baseOrganizationId}`);
    } catch (_) {}
    if (!stored || stored === baseOrganizationId) return;
    if (spaces.some((s) => s.organizationId === stored)) {
      onSwitch(stored);
    } else {
      try {
        localStorage.removeItem(`so_active_org_${baseOrganizationId}`);
      } catch (_) {}
    }
  }, [loaded, spaces, baseOrganizationId, onSwitch]);

  // Close the dropdown on an outside click.
  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) {
        setOpen(false);
        setCreating(false);
        setError("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const handleSelect = (orgId) => {
    setOpen(false);
    setCreating(false);
    setError("");
    onSwitch(orgId);
  };

  const handleCreate = async () => {
    // Auto-topup balance gate. Virtual-space creation is a billable
    // "create workspace" action — gated by HomePage's ANALYSIS_INTENT
    // listener for the same reason main-org registration is.
    const intent = new CustomEvent("ANALYSIS_INTENT", { cancelable: true });
    if (!window.dispatchEvent(intent)) return;

    const name = newName.trim();
    if (!name) {
      setError("Enter a name for the virtual space.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch(`${ORGS_BASE}/virtual-spaces`, {
        method: "POST",
        headers: await requestHeaders(),
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || "Failed to create virtual space");
      }
      setNewName("");
      setCreating(false);
      setOpen(false);
      await fetchSpaces();
      const newId = data?.virtualSpace?.organizationId;
      if (newId) onSwitch(newId);
    } catch (err) {
      setError(err.message || "Failed to create virtual space");
    } finally {
      setSubmitting(false);
    }
  };

  // Hidden until we know the caller's role/spaces. Then: owners always see
  // the switcher; non-owner admins see it only if they belong to a space.
  if (!baseOrganizationId || !loaded) return null;
  if (!isOwner && spaces.length === 0) return null;

  // The active label is computed from the *actual* org the user is viewing,
  // not from baseOrganizationId. After main-org deletion baseOrganizationId
  // is itself a virtual space, so the old `activeOrganizationId ===
  // baseOrganizationId` shortcut would mislabel the workspace as "Main
  // organization" while the user is in fact looking at a VS's data.
  const activeVs = activeOrganizationId
    ? spaces.find((s) => s.organizationId === activeOrganizationId)
    : null;
  const isOnMain =
    mainOrganization.exists &&
    activeOrganizationId === mainOrganization.organizationId;
  const activeName = isOnMain
    ? "Main organization"
    : activeVs?.name || "Virtual space";

  return (
    <div className="vs-switcher" ref={rootRef}>
      <button
        type="button"
        className={`vs-switcher-btn ${open ? "open" : ""}`}
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="true"
        aria-expanded={open}
      >
        <FiLayers className="vs-switcher-btn-icon" aria-hidden="true" />
        <span className="vs-switcher-btn-label">{activeName}</span>
        <FiChevronDown className="vs-switcher-caret" aria-hidden="true" />
      </button>

      {open && (
        <div className="vs-switcher-menu" role="menu">
          <div className="vs-switcher-menu-heading">Workspaces</div>

          {mainOrganization.exists && (
            <button
              type="button"
              className={`vs-switcher-item ${isOnMain ? "active" : ""}`}
              onClick={() => handleSelect(mainOrganization.organizationId)}
              role="menuitem"
            >
              <span className="vs-switcher-item-label">Main organization</span>
              {isOnMain && <FiCheck className="vs-switcher-item-check" />}
            </button>
          )}

          {spaces.map((s) => {
            const isActive = s.organizationId === activeOrganizationId;
            return (
              <button
                type="button"
                key={s.organizationId}
                className={`vs-switcher-item ${isActive ? "active" : ""}`}
                onClick={() => handleSelect(s.organizationId)}
                role="menuitem"
              >
                <span className="vs-switcher-item-label">{s.name}</span>
                {isActive && <FiCheck className="vs-switcher-item-check" />}
              </button>
            );
          })}

          {isOwner && (
            <div className="vs-switcher-create">
              {creating ? (
                <>
                  <input
                    type="text"
                    className="vs-switcher-input"
                    placeholder="Virtual space name"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !submitting) handleCreate();
                    }}
                    autoFocus
                    disabled={submitting}
                  />
                  <div className="vs-switcher-create-actions">
                    <button
                      type="button"
                      className="vs-switcher-cancel"
                      onClick={() => {
                        setCreating(false);
                        setNewName("");
                        setError("");
                      }}
                      disabled={submitting}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="vs-switcher-confirm"
                      onClick={handleCreate}
                      disabled={submitting}
                    >
                      {submitting ? "Creating..." : "Create"}
                    </button>
                  </div>
                </>
              ) : (
                <button
                  type="button"
                  className="vs-switcher-create-trigger"
                  onClick={() => {
                    setCreating(true);
                    setError("");
                  }}
                  role="menuitem"
                >
                  <FiPlus aria-hidden="true" />
                  Create virtual space
                </button>
              )}
              {error && <div className="vs-switcher-error">{error}</div>}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default VirtualSpaceSwitcher;

import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import HRStaffView from "../onboarding/HRStaffView";
import {
  getCandidateSession,
  clearCandidateSession,
  setCurrentOrganization,
} from "./candidateAuth";
import { HiOutlineOfficeBuilding } from "react-icons/hi";
import { FiCheck, FiChevronDown } from "react-icons/fi";
import curkiLogo from "../../../../Images/Black_logo.png";
import "../../../../Styles/general-styles/CandidateLogin.css";

const findActiveOrg = (session) =>
  (session?.organizations || []).find(
    (o) => o.organizationId === session?.currentOrganizationId
  ) || null;

const CandidateDashboard = () => {
  const navigate = useNavigate();
  const { tab } = useParams();
  const [session, setSession] = useState(() => getCandidateSession());
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const switcherRef = useRef(null);

  useEffect(() => {
    const current = getCandidateSession();
    if (!current) {
      navigate("/hr-candidate", { replace: true });
      return;
    }
    setSession(current);
  }, [navigate]);

  // Close the org switcher dropdown when clicking outside it.
  useEffect(() => {
    if (!switcherOpen) return undefined;
    const handler = (e) => {
      if (
        switcherRef.current &&
        !switcherRef.current.contains(e.target)
      ) {
        setSwitcherOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [switcherOpen]);

  const handleLogout = () => {
    clearCandidateSession();
    navigate("/hr-candidate", { replace: true });
  };

  const handleSwitchOrg = (organizationId) => {
    setSwitcherOpen(false);
    if (organizationId === session?.currentOrganizationId) return;
    const next = setCurrentOrganization(organizationId);
    if (next) setSession(next);
  };

  if (!session) return null;

  const activeOrg = findActiveOrg(session);
  const organizations = session.organizations || [];
  const hasMultipleOrgs = organizations.length > 1;

  // The candidate's name + id are org-scoped (a candidate can have a different
  // record in each org), so derive them from the active membership and pass
  // them to HRStaffView via the user prop.
  const candidateUser = {
    email: session.email,
    organizationId: session.currentOrganizationId,
    candidateId: activeOrg?.candidateId || "",
    candidateName: activeOrg?.candidateName || "",
    organizationName: activeOrg?.organizationName || "",
    displayName: activeOrg?.candidateName || session.email,
  };

  const displayName = activeOrg?.candidateName || session.email;
  const activeOrgLabel =
    activeOrg?.organizationName ||
    activeOrg?.organizationId ||
    "Select organisation";

  return (
    <div className="candidate-dashboard-shell">
      <header className="candidate-dashboard-header">
        <div className="candidate-dashboard-brand">
          <img src={curkiLogo} alt="Curki AI" />
          <span>Smart Onboarding</span>
        </div>
        <div className="candidate-dashboard-user">
          {hasMultipleOrgs && (
            <div className="candidate-org-switcher" ref={switcherRef}>
              <button
                type="button"
                className="candidate-org-switcher-trigger"
                aria-haspopup="listbox"
                aria-expanded={switcherOpen}
                onClick={() => setSwitcherOpen((v) => !v)}
                title={activeOrgLabel}
              >
                <HiOutlineOfficeBuilding className="candidate-org-switcher-trigger-icon" />
                <span className="candidate-org-switcher-trigger-name">
                  {activeOrgLabel}
                </span>
                <FiChevronDown className="candidate-org-switcher-caret" />
              </button>
              {switcherOpen && (
                <ul
                  className="candidate-org-switcher-menu"
                  role="listbox"
                >
                  {organizations.map((org) => {
                    const isActive =
                      org.organizationId === session.currentOrganizationId;
                    return (
                      <li key={org.organizationId}>
                        <button
                          type="button"
                          role="option"
                          aria-selected={isActive}
                          className={`candidate-org-switcher-item${isActive ? " is-active" : ""}`}
                          onClick={() => handleSwitchOrg(org.organizationId)}
                        >
                          <HiOutlineOfficeBuilding />
                          <span className="candidate-org-switcher-item-name">
                            {org.organizationName || org.organizationId}
                          </span>
                          {isActive && (
                            <FiCheck className="candidate-org-switcher-item-check" />
                          )}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          )}
          <span
            className="candidate-dashboard-user-name"
            title={displayName}
          >
            {displayName}
          </span>
          <button
            type="button"
            className="candidate-dashboard-logout"
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>
      </header>

      <main className="candidate-dashboard-body">
        <HRStaffView
          // Re-mount the staff view when the active org changes so LMS /
          // document state can't bleed across orgs (initial fetches re-run,
          // local UI state resets).
          key={session.currentOrganizationId}
          selectedRole="Smart Onboarding (Staff)"
          user={candidateUser}
          handleClick={() => {}}
          setShowFeedbackPopup={() => {}}
          activeTab={tab}
          onTabChange={(slug) =>
            navigate(`/hr-candidate/dashboard/${slug}`, { replace: true })
          }
        />
      </main>
    </div>
  );
};

export default CandidateDashboard;

import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import HRStaffView from "../onboarding/HRStaffView";
import {
  getCandidateSession,
  clearCandidateSession,
} from "./candidateAuth";
import curkiLogo from "../../../../Images/Black_logo.png";
import "../../../../Styles/general-styles/CandidateLogin.css";

const CandidateDashboard = () => {
  const navigate = useNavigate();
  const { tab } = useParams();
  const [session, setSession] = useState(() => getCandidateSession());

  useEffect(() => {
    const current = getCandidateSession();
    if (!current) {
      navigate("/hr-candidate", { replace: true });
      return;
    }
    setSession(current);
  }, [navigate]);

  const handleLogout = () => {
    clearCandidateSession();
    navigate("/hr-candidate", { replace: true });
  };

  if (!session) return null;

  const candidateUser = {
    email: session.email,
    displayName: session.candidateName || session.email,
  };

  const displayName = session.candidateName || session.email;

  return (
    <div className="candidate-dashboard-shell">
      <header className="candidate-dashboard-header">
        <div className="candidate-dashboard-brand">
          <img src={curkiLogo} alt="Curki AI" />
          <span>Smart Onboarding</span>
        </div>
        <div className="candidate-dashboard-user">
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

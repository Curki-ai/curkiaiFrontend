import "./App.css";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import HomePage from "./Components/general-components/HomePage";
import InvitePage from "./Components/general-components/AcceptInvitation";
import CandidateScreeningTest from "./Components/Modules/StaffOnboarding/onboarding/ScreeningTest";
import CandidateLogin from "./Components/Modules/StaffOnboarding/candidate/CandidateLogin";
import CandidateDashboard from "./Components/Modules/StaffOnboarding/candidate/CandidateDashboard";
import { isCandidateAuthenticated } from "./Components/Modules/StaffOnboarding/candidate/candidateAuth";

const RequireCandidateAuth = ({ children }) => {
  if (!isCandidateAuthenticated()) {
    return <Navigate to="/hr-candidate" replace />;
  }
  return children;
};

function App() {
  const dashboardElement = (
    <RequireCandidateAuth>
      <CandidateDashboard />
    </RequireCandidateAuth>
  );

  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/invite" element={<InvitePage />} />
        <Route path="/test/:test_id" element={<CandidateScreeningTest />} />
        <Route path="/hr-candidate" element={<CandidateLogin />} />
        <Route path="/hr-candidate/dashboard" element={dashboardElement} />
        <Route path="/hr-candidate/dashboard/:tab" element={dashboardElement} />
      </Routes>
    </Router>
  );
}

export default App;
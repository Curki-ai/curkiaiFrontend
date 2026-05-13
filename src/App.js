import "./App.css";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import HomePage from "./Components/general-components/HomePage";
import InvitePage from "./Components/general-components/AcceptInvitation";
import AcceptAccessInvite from "./Components/general-components/AcceptAccessInvite";
import CandidateScreeningTest from "./Components/Modules/StaffOnboarding/onboarding/ScreeningTest";
import CandidateLogin from "./Components/Modules/StaffOnboarding/candidate/CandidateLogin";
import CandidateDashboard from "./Components/Modules/StaffOnboarding/candidate/CandidateDashboard";
import { isCandidateAuthenticated } from "./Components/Modules/StaffOnboarding/candidate/candidateAuth";

const RequireCandidateAuth = ({ children }) => {
  if (!isCandidateAuthenticated()) {
    return <Navigate to="/hr-candidate" replace />
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
      {/* Single global ToastContainer for the entire app. Mounting at the
          App root (above <Routes>) guarantees one — and only one — container
          is active across every route, so toast emit/dismiss events always
          route correctly. Per-page containers were causing duplicate-toast
          collisions in react-toastify v11 (clicking X failed to close). */}
      <ToastContainer
        position="top-right"
        autoClose={5000}
        newestOnTop
        closeOnClick
        pauseOnHover
        draggable
        theme="light"
      />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/invite" element={<InvitePage />} />
        <Route path="/access-invite" element={<AcceptAccessInvite />} />
        <Route path="/test/:test_id" element={<CandidateScreeningTest />} />
        <Route path="/hr-candidate" element={<CandidateLogin />} />
        <Route path="/hr-candidate/dashboard" element={dashboardElement} />
        <Route path="/hr-candidate/dashboard/:tab" element={dashboardElement} />
      </Routes>
    </Router>
  );
}

export default App;
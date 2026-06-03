import "./App.css";
import { lazy, Suspense } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import CenteredLoader from "./Components/general-components/CenteredLoader";
// Route components are code-split so a user landing on `/invite`, `/test/...`,
// or `/hr-candidate` doesn't pay HomePage's bundle cost. Each lazy import
// becomes its own webpack chunk.
import { isCandidateAuthenticated } from "./Components/Modules/StaffOnboarding/candidate/candidateAuth";

const HomePage = lazy(() => import("./Components/general-components/HomePage"));
const InvitePage = lazy(() => import("./Components/general-components/AcceptInvitation"));
const AcceptAccessInvite = lazy(() => import("./Components/general-components/AcceptAccessInvite"));
const FirebaseActionHandler = lazy(() => import("./Components/general-components/FirebaseActionHandler"));
const CandidateScreeningTest = lazy(() => import("./Components/Modules/StaffOnboarding/onboarding/ScreeningTest"));
const CandidateLogin = lazy(() => import("./Components/Modules/StaffOnboarding/candidate/CandidateLogin"));
const CandidateDashboard = lazy(() => import("./Components/Modules/StaffOnboarding/candidate/CandidateDashboard"));

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
        style={{ zIndex: 10001 }}
      />
      <Suspense fallback={<CenteredLoader label="Loading…" />}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/invite" element={<InvitePage />} />
          <Route path="/access-invite" element={<AcceptAccessInvite />} />
          <Route path="/auth/action" element={<FirebaseActionHandler />} />
          <Route path="/test/:test_id" element={<CandidateScreeningTest />} />
          <Route path="/hr-candidate" element={<CandidateLogin />} />
          <Route path="/hr-candidate/dashboard" element={dashboardElement} />
          <Route path="/hr-candidate/dashboard/:tab" element={dashboardElement} />
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;
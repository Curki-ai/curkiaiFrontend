import React from "react";
import "../../Styles/general-styles/TrialPopup.css";
import trialStartGif from "../../Images/TrialGif.gif"
import autoPaymentGif from "../../Images/autopaymentPopup.gif"
const TrialStartedPopup = ({ trialEnd, onClose }) => {
  return (
    <div className="trial-overlay">
      <div className="trial-popup">

        <div className="trial-icon-wrapper">
          <img
            src={trialStartGif}
            alt="trial"
            className="trial-gif"
          />
        </div>

        <h2 className="trial-title">
          Your 15-Day Free Trial Has Started
        </h2>

        <p className="trial-description">
          You now have 15 days of unlimited access to all premium features.
          <br></br>Explore everything and see how it fits your workflow.
        </p>

        <div className="trial-points">
          <span>✓ Access all core features</span>
          <span>✓ No charges during the trial</span>
        </div>

        <hr className="trial-divider" />

        <p className="trial-end">
          Your trial ends on <strong>{trialEnd}</strong>
        </p>

        <button className="trial-button" onClick={onClose}>
          Confirm Exploring
        </button>

      </div>
    </div>
  );
};

export default TrialStartedPopup;
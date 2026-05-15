import React from "react";
import "../../Styles/general-styles/CenteredLoader.css";

const CenteredLoader = ({ label = "Loading…" }) => (
  <div className="centered-loader" role="status" aria-live="polite">
    <div className="centered-loader-spinner" />
    {label ? <div className="centered-loader-label">{label}</div> : null}
  </div>
);

export default CenteredLoader;

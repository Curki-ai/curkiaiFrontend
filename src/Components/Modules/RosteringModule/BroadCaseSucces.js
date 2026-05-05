import React from 'react';
import '../../../Styles/RosteringModule/SMSBroadcastSuccess.css';

const BroadcastSuccess = ({ message }) => {
  return (
    <div className="broadcast-success">
      <div className="success-circle">
        <span className="tick">&#10003;</span> {/* Unicode checkmark */}
      </div>
      <p className="success-text">{message}</p>
    </div>
  );
};

export default BroadcastSuccess;

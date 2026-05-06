import React from 'react';
import '../../Styles/general-styles/Modal.css';

const PopupModal = ({ isVisible, onClose }) => {
  if (!isVisible) return null;

  return (
    <div className="modal-overlay">
      <div className="modal">
      <div style={{width:'100%',display:'flex',justifyContent:'flex-end'}}>
        <button className="closes-btn" onClick={onClose}>&times;</button>
        </div>
        <div className="modal-content">
          <p><strong>CSV & Excel Dominance:</strong> Most platforms support exporting reports in CSV and Excel formats for easy data handling and integration.</p>

          <p><strong>Payroll Compatibility:</strong> ShiftCare, Comm.care, and CareMaster offer timesheet and rostering exports compatible with MYOB, QuickBooks, and payroll systems.</p>

          <p><strong>Billing & Claims Exports:</strong> Eziplan, Comm.care, and AlayaCare allow CSV exports of billing and service claim data for use in PRODA, NDIA, or accounting software.</p>

          <p><strong>Clinical & Client Data:</strong> AlayaCare, CareVision, and CareMaster provide exports of client records, care plans, and incident reports in Excel.</p>

          <p><strong>Compliance & Audit Logs:</strong> CareVision and ShiftCare allow CSV exports of compliance reports and audit trails for regulatory checks.</p>

          <p><strong>Progress Notes & Events:</strong> ShiftCare and CareVision support Excel exports of progress notes for client documentation and care tracking.</p>

          <p><strong>Custom Reporting Tools:</strong> AlayaCare’s Data Exploration Tool and VisualCare’s API access enable tailored reports in formats like Excel, CSV.</p>

          <p><strong>Scheduling & Rostering:</strong> CareMaster, CareVision, and VisualCare allow exporting schedules and staff rosters in CSV or PDF for workforce planning.</p>

          <p><strong>Expense Tracking:</strong> HPAPlus supports exporting grouped expense data for financial analysis and integration with accounting systems.</p>
        </div>
      </div>
    </div>
  );
};

export default PopupModal;

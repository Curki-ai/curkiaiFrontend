// ScreeningTestCreation.jsx
import React from "react";
import { FiEdit2, FiTrash2 } from "react-icons/fi";
import GoogleFormLogo from '../../../Images/GoogleFormsIcon.png';
import "../../../Styles/ScreeningTestCreation.css";

const ScreeningTestCreation = () => {
  const previousTests = [
    {
      id: 1,
      title: "Essential Skills Assessment – Personal Care Worker",
      date: "27-8-2025",
    },
    {
      id: 2,
      title: "Aged Care Support Worker Role Assessment",
      date: "26-8-2025",
    },
  ];

  const handleCreateTest = () => {
    window.open("https://forms.google.com", "_blank"); 
    // or a specific form link e.g. "https://forms.gle/yourFormID"
  };

  return (
    <div className="screening-container">
      <div className="create-section">
        <button className="create-btn" onClick={handleCreateTest}>Create Test in Google Forms</button>
      </div>
      <img src={GoogleFormLogo} alt="Google Forms" className="google-logo" />

      <h3 className="section-titles">Previous Test Creations</h3>

      <div className="test-list">
        {previousTests.map((test) => (
          <div className="test-card" key={test.id}>
            <div>
              <h4 className="test-title">{test.title}</h4>
              <p className="test-date">Created On {test.date}</p>
            </div>
            <div className="test-actions">
              <FiEdit2 className="icon" />
              <FiTrash2 className="icon" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ScreeningTestCreation;

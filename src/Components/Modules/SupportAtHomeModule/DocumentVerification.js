import React, { useState } from "react";
import "../../../Styles/DocumentVerification.css";

const DocumentVerification = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // Personal Information
    firstName: "",
    lastName: "",
    nationality: "",
    city: "",
    address: "",
    email: "",
    phone: "",
    emergencyContact: "",
    emergencyContactName: "",
    relationship: "",

    // Experience & Qualification
    experienceYears: "",
    rolePreference: "",
    skills: "",
    selectedSkills: [],
    qualificationFiles: [],
    certificationFiles: [],

    // Work Authorization
    rightToWorkFiles: [],
    drivingLicenseFiles: [],
    agreeToTerms: false,
  });

  const [fileUploads, setFileUploads] = useState({
    qualificationFiles: [],
    certificationFiles: [],
    rightToWorkFiles: [],
    drivingLicenseFiles: [],
  });
  const [isFinalConfirmationChecked, setIsFinalConfirmationChecked] =
    useState(false);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleFileUpload = (field, files) => {
    const uploadedFiles = Array.from(files);
    setFileUploads((prev) => ({
      ...prev,
      [field]: [...prev[field], ...uploadedFiles],
    }));
  };

  const handleSkillChange = (e) => {
    const value = e.target.value;
    setFormData((prev) => ({
      ...prev,
      skills: value,
    }));
  };

  const handleAddSkill = () => {
    if (
      formData.skills.trim() &&
      !formData.selectedSkills.includes(formData.skills.trim())
    ) {
      setFormData((prev) => ({
        ...prev,
        selectedSkills: [...prev.selectedSkills, formData.skills.trim()],
        skills: "",
      }));
    }
  };

  const handleRemoveSkill = (skillToRemove) => {
    setFormData((prev) => ({
      ...prev,
      selectedSkills: prev.selectedSkills.filter(
        (skill) => skill !== skillToRemove
      ),
    }));
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleAddSkill();
    }
  };

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleFinish = () => {
    // Combine all data including files
    const submissionData = {
      ...formData,
      ...fileUploads,
    };

    console.log("Form submitted:", submissionData);
    alert("Document verification submitted successfully!");

    // Reset form
    setCurrentStep(1);
    setFormData({
      firstName: "",
      lastName: "",
      nationality: "",
      city: "",
      address: "",
      email: "",
      phone: "",
      emergencyContact: "",
      emergencyContactName: "",
      relationship: "",
      experienceYears: "",
      rolePreference: "",
      skills: "",
      selectedSkills: [],
      qualificationFiles: [],
      certificationFiles: [],
      rightToWorkFiles: [],
      drivingLicenseFiles: [],
      agreeToTerms: false,
    });
    setFileUploads({
      qualificationFiles: [],
      certificationFiles: [],
      rightToWorkFiles: [],
      drivingLicenseFiles: [],
    });
  };

  const getStepClass = (step) => {
    if (currentStep > step) return "completed";
    if (currentStep === step) return "active";
    return "inactive";
  };

  const triggerFileInput = (inputId) => {
    document.getElementById(inputId).click();
  };

  const removeFile = (field, index) => {
    const updatedFiles = [...fileUploads[field]];
    updatedFiles.splice(index, 1);
    setFileUploads((prev) => ({
      ...prev,
      [field]: updatedFiles,
    }));
  };

  return (
    <div className="document-verification-container">
      <h2 className="form-title">Document Verification</h2>
      <p className="form-subtitle">Complete your profile in 3 simple steps</p>

      {/* Progress Steps */}
      <div className="progress-container">
        <div className="progress-steps">
          {[1, 2, 3].map((step) => (
            <React.Fragment key={step}>
              <div className={`step-circle ${getStepClass(step)}`}>
                {currentStep > step ? (
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M20 6L9 17L4 12"
                      stroke="white"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                ) : (
                  step
                )}
              </div>
              {step < 3 && (
                <div
                  className={`step-line ${
                    currentStep > step ? "completed" : ""
                  }`}
                />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Step Labels */}
      <div className="step-labels">
        <div className={`step-label ${getStepClass(1)}`}>
          Personal Information
        </div>
        <div className={`step-label ${getStepClass(2)}`}>
          Experience & Qualification
        </div>
        <div className={`step-label ${getStepClass(3)}`}>
          Work Authorization
        </div>
      </div>

      {/* Step 1: Personal Information */}
      {currentStep === 1 && (
        <div className="form-section">
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">
                First name <span className="required">*</span>
              </label>
              <input
                type="text"
                className="form-input"
                placeholder="Your name"
                value={formData.firstName}
                onChange={(e) => handleInputChange("firstName", e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">
                Last name <span className="required">*</span>
              </label>
              <input
                type="text"
                className="form-input"
                placeholder="Your last name"
                value={formData.lastName}
                onChange={(e) => handleInputChange("lastName", e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Nationality</label>
            <select
              className="form-select"
              value={formData.nationality}
              onChange={(e) => handleInputChange("nationality", e.target.value)}
            >
              <option value="">Select your nationality</option>
              <option value="US">United States</option>
              <option value="UK">United Kingdom</option>
              <option value="CA">Canada</option>
              <option value="AU">Australia</option>
              <option value="IN">India</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">City</label>
            <select
              className="form-select"
              value={formData.city}
              onChange={(e) => handleInputChange("city", e.target.value)}
            >
              <option value="">Select your city</option>
              <option value="New York">New York</option>
              <option value="Los Angeles">Los Angeles</option>
              <option value="Chicago">Chicago</option>
              <option value="London">London</option>
              <option value="Toronto">Toronto</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">
              Address <span className="required">*</span>
            </label>
            <input
              type="text"
              className="form-input"
              placeholder="Your street address"
              value={formData.address}
              onChange={(e) => handleInputChange("address", e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              E-mail <span className="required">*</span>
            </label>
            <input
              type="email"
              className="form-input"
              placeholder="yourmail@gmail.com"
              value={formData.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              Phone Number <span className="required">*</span>
            </label>
            <input
              type="tel"
              className="form-input"
              placeholder="000-000-0000"
              value={formData.phone}
              onChange={(e) => handleInputChange("phone", e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              Emergency Contact Number <span className="required">*</span>
            </label>
            <input
              type="tel"
              className="form-input"
              placeholder="000-000-0000"
              value={formData.emergencyContact}
              onChange={(e) =>
                handleInputChange("emergencyContact", e.target.value)
              }
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              Emergency Contact Name <span className="required">*</span>
            </label>
            <input
              type="text"
              className="form-input"
              placeholder="Emergency contact name"
              value={formData.emergencyContactName}
              onChange={(e) =>
                handleInputChange("emergencyContactName", e.target.value)
              }
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              Relationship <span className="required">*</span>
            </label>
            <input
              type="text"
              className="form-input"
              placeholder="Your relationship with the emergency contact"
              value={formData.relationship}
              onChange={(e) =>
                handleInputChange("relationship", e.target.value)
              }
            />
          </div>

          <div className="nav-buttons">
            <button className="btn-primary" onClick={handleNext}>
              Next Step
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M5 12H19M19 12L12 5M19 12L12 19"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Experience & Qualification */}
      {currentStep === 2 && (
        <div className="form-section">
          <div className="section-header">
            <h3>Experience & Qualifications</h3>
            <p>Tell us about your professional background</p>
          </div>

          <div className="form-group">
            <label className="form-label">
              Years of Experience <span className="required">*</span>
            </label>
            <input
              type="number"
              className="form-input"
              placeholder="Enter years of experience"
              value={formData.experienceYears}
              onChange={(e) =>
                handleInputChange("experienceYears", e.target.value)
              }
              min="0"
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              Preferred Role <span className="required">*</span>
            </label>
            <input
              type="text"
              className="form-input"
              placeholder="What role are you looking for?"
              value={formData.rolePreference}
              onChange={(e) =>
                handleInputChange("rolePreference", e.target.value)
              }
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              Your Skills <span className="required">*</span>
            </label>
            <div className="skills-input-container">
              <input
                type="text"
                className="form-input"
                placeholder="Add your skills (press Enter to add)"
                value={formData.skills}
                onChange={handleSkillChange}
                onKeyPress={handleKeyPress}
              />
              <button
                type="button"
                className="add-skill-btn"
                onClick={handleAddSkill}
              >
                Add
              </button>
            </div>

            {formData.selectedSkills.length > 0 && (
              <div className="skills-tags-container">
                {formData.selectedSkills.map((skill) => (
                  <div key={skill} className="skill-tag">
                    {skill}
                    <button
                      type="button"
                      className="remove-skill-btn"
                      onClick={() => handleRemoveSkill(skill)}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Upload Qualifications</label>
            <p className="file-upload-subtitle">
              CSRT III, CRRT IV, MHRA, PEG Feeding, Manual Handling, etc.
            </p>
            <div
              className="file-upload-area"
              onClick={() => triggerFileInput("qualificationFiles")}
            >
              <div className="file-upload-icon">
                <svg
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z"
                    stroke="#6366F1"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M14 2V8H20"
                    stroke="#6366F1"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M16 13H8"
                    stroke="#6366F1"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M16 17H8"
                    stroke="#6366F1"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M10 9H9H8"
                    stroke="#6366F1"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <div className="file-upload-text">
                Click to upload or drag and drop
              </div>
              <div className="file-upload-note">
                Supports JPG, PNG, and PDF files (Max 5MB each)
              </div>
              <input
                type="file"
                id="qualificationFiles"
                style={{ display: "none" }}
                multiple
                accept=".jpg,.jpeg,.png,.pdf"
                onChange={(e) =>
                  handleFileUpload("qualificationFiles", e.target.files)
                }
              />
            </div>

            {fileUploads.qualificationFiles.length > 0 && (
              <div className="uploaded-files-list">
                {fileUploads.qualificationFiles.map((file, index) => (
                  <div key={index} className="uploaded-file-item">
                    <span className="file-name">{file.name}</span>
                    <button
                      type="button"
                      className="remove-file-btn"
                      onClick={() => removeFile("qualificationFiles", index)}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Upload Certifications</label>
            <p className="file-upload-subtitle">
              NMC worker screening, Working with Children Check, First Aid, CPR,
              etc.
            </p>
            <div
              className="file-upload-area"
              onClick={() => triggerFileInput("certificationFiles")}
            >
              <div className="file-upload-icon">
                <svg
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z"
                    stroke="#6366F1"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M14 2V8H20"
                    stroke="#6366F1"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M16 13H8"
                    stroke="#6366F1"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M16 17H8"
                    stroke="#6366F1"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M10 9H9H8"
                    stroke="#6366F1"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <div className="file-upload-text">
                Click to upload or drag and drop
              </div>
              <div className="file-upload-note">
                Supports JPG, PNG, and PDF files (Max 5MB each)
              </div>
              <input
                type="file"
                id="certificationFiles"
                style={{ display: "none" }}
                multiple
                accept=".jpg,.jpeg,.png,.pdf"
                onChange={(e) =>
                  handleFileUpload("certificationFiles", e.target.files)
                }
              />
            </div>

            {fileUploads.certificationFiles.length > 0 && (
              <div className="uploaded-files-list">
                {fileUploads.certificationFiles.map((file, index) => (
                  <div key={index} className="uploaded-file-item">
                    <span className="file-name">{file.name}</span>
                    <button
                      type="button"
                      className="remove-file-btn"
                      onClick={() => removeFile("certificationFiles", index)}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="nav-buttons">
            <button className="btn-secondary" onClick={handlePrevious}>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M19 12H5M5 12L12 19M5 12L12 5"
                  stroke="#6366F1"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Previous
            </button>
            <button className="btn-primary" onClick={handleNext}>
              Next Step
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M5 12H19M19 12L12 5M19 12L12 19"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Work Authorization */}
      {currentStep === 3 && (
        <div className="form-section">
          <div className="section-header">
            <h3>Work Authorization</h3>
            <p>Upload documents to verify your work eligibility</p>
          </div>

          <div className="form-group">
            <label className="form-label">Right-to-Work Proof</label>
            <p className="file-upload-subtitle">
              Visa, passport, residency documents, etc.
            </p>
            <div
              className="file-upload-area"
              onClick={() => triggerFileInput("rightToWorkFiles")}
            >
              <div className="file-upload-icon">
                <svg
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z"
                    stroke="#6366F1"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M14 2V8H20"
                    stroke="#6366F1"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M16 13H8"
                    stroke="#6366F1"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M16 17H8"
                    stroke="#6366F1"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M10 9H9H8"
                    stroke="#6366F1"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <div className="file-upload-text">
                Click to upload or drag and drop
              </div>
              <div className="file-upload-note">
                Supports JPG, PNG, and PDF files (Max 5MB each)
              </div>
              <input
                type="file"
                id="rightToWorkFiles"
                style={{ display: "none" }}
                multiple
                accept=".jpg,.jpeg,.png,.pdf"
                onChange={(e) =>
                  handleFileUpload("rightToWorkFiles", e.target.files)
                }
              />
            </div>

            {fileUploads.rightToWorkFiles.length > 0 && (
              <div className="uploaded-files-list">
                {fileUploads.rightToWorkFiles.map((file, index) => (
                  <div key={index} className="uploaded-file-item">
                    <span className="file-name">{file.name}</span>
                    <button
                      type="button"
                      className="remove-file-btn"
                      onClick={() => removeFile("rightToWorkFiles", index)}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Driving License</label>
            <div
              className="file-upload-area"
              onClick={() => triggerFileInput("drivingLicenseFiles")}
            >
              <div className="file-upload-icon">
                <svg
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z"
                    stroke="#6366F1"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M14 2V8H20"
                    stroke="#6366F1"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M16 13H8"
                    stroke="#6366F1"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M16 17H8"
                    stroke="#6366F1"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M10 9H9H8"
                    stroke="#6366F1"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <div className="file-upload-text">
                Click to upload or drag and drop
              </div>
              <div className="file-upload-note">
                Supports JPG, PNG, and PDF files (Max 5MB each)
              </div>
              <input
                type="file"
                id="drivingLicenseFiles"
                style={{ display: "none" }}
                multiple
                accept=".jpg,.jpeg,.png,.pdf"
                onChange={(e) =>
                  handleFileUpload("drivingLicenseFiles", e.target.files)
                }
              />
            </div>

            {fileUploads.drivingLicenseFiles.length > 0 && (
              <div className="uploaded-files-list">
                {fileUploads.drivingLicenseFiles.map((file, index) => (
                  <div key={index} className="uploaded-file-item">
                    <span className="file-name">{file.name}</span>
                    <button
                      type="button"
                      className="remove-file-btn"
                      onClick={() => removeFile("drivingLicenseFiles", index)}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="form-group">
            <div className="checkbox-container">
              <input
                type="checkbox"
                id="agreeToTerms"
                className="checkbox-input"
                checked={formData.agreeToTerms}
                onChange={(e) => {
                  const isChecked = e.target.checked;
                  handleInputChange("agreeToTerms", isChecked); // update form data
                  setIsFinalConfirmationChecked(isChecked); // update final confirmation state
                }}
              />
              <label htmlFor="agreeToTerms" className="checkbox-label">
                I certify that all information provided is accurate and
                complete. I agree to the
                <a href="/terms" target="_blank" rel="noopener noreferrer">
                  {" "}
                  Terms of Service
                </a>{" "}
                and
                <a href="/privacy" target="_blank" rel="noopener noreferrer">
                  {" "}
                  Privacy Policy
                </a>
                .
              </label>
            </div>
          </div>

          <div className="nav-buttons">
            <button className="btn-secondary" onClick={handlePrevious}>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M19 12H5M5 12L12 19M5 12L12 5"
                  stroke="#6366F1"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Previous
            </button>
            <button
              className="btn-primary"
              onClick={handleFinish}
              disabled={!formData.agreeToTerms}
            >
              Complete Verification
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M20 6L9 17L4 12"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentVerification;

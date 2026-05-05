// DocumentVerification.jsx

import React, { useEffect, useState } from "react";
import axios from "axios";
import "../../../../Styles/general-styles/CandidateDocsUpload.css";

const BASE_URL = "https://curki-test-prod-auhyhehcbvdmh3ef.canadacentral-01.azurewebsites.net/api";

const DocumentVerification = ({ user }) => {
  const [candidateId, setCandidateId] = useState("");
  const [candidateEmail, setCandidateEmail] = useState("");
  const [organisationId, setOrganisationId] = useState("");

  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchingOrg, setFetchingOrg] = useState(true);
  const [message, setMessage] = useState("");

useEffect(() => {
  const email = user?.email || "";

  if (!email) {
    setFetchingOrg(false);
    setMessage("User email not found");
    return;
  }

  setCandidateEmail(email);
  fetchOrganisation(email);
}, [user]);

const fetchOrganisation = async (email) => {
  try {
    setFetchingOrg(true);

    const res = await axios.get(
      `${BASE_URL}/get-organization-by-candidate`,
      {
        params: {
          candidate_email: email
        }
      }
    );
    console.log("Organisation fetch response:", res.data);
    if (res.data?.ok) {
      setOrganisationId(
        res.data.organisation_id 
      );

      setCandidateId(
        res.data.candidate
          ?.candidateId || ""
      );
    } else {
      setMessage(
        res.data.message ||
          "Organisation not found"
      );
    }
  } catch (error) {
    setMessage(
      "Failed to fetch details"
    );
  } finally {
    setFetchingOrg(false);
  }
};

  const handleFileChange = (e) => {
    const selected = Array.from(
      e.target.files
    );

    setFiles((prev) => [
      ...prev,
      ...selected
    ]);
  };

  const removeFile = (index) => {
    const updated = [...files];
    updated.splice(index, 1);
    setFiles(updated);
  };

  const handleSubmit = async () => {
    if (!organisationId || !candidateId) {
      console.log("Submitting with orgId:", organisationId, "candidateId:", candidateId);
      setMessage(
        "Missing organisation or candidate"
      );
      return;
    }

    if (files.length === 0) {
      setMessage(
        "Please upload at least one file"
      );
      return;
    }

    try {
      setLoading(true);
      setMessage("");

      const formData = new FormData();
      formData.append(
        "organisation_id",
        organisationId
      );

      formData.append(
        "candidate_id",
        candidateId
      );

      files.forEach((file) => {
        formData.append(
          "documents",
          file
        );
      });

      const res = await axios.post(
        `${BASE_URL}/process-documents`,
        formData
      );

      if (res.data?.ok) {
        setMessage(
          "Documents submitted successfully"
        );
        setFiles([]);
      } else {
        setMessage(
          res.data.message ||
            "Upload failed"
        );
      }
    } catch (error) {
      setMessage(
        "Something went wrong"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="cdu_page_wrap">
      <div className="dv_upload_card">
        <h2 className="form-title">
          Document Verification
        </h2>

        <p className="form-subtitle">
          Upload your required
          documents like passport,
          driving licence, police
          check, certificates etc.
        </p>

        {fetchingOrg ? (
          <div className="dv_status_box">
            Loading details...
          </div>
        ) : (
          <>
            <label className="dv_upload_box">
              <input
                type="file"
                multiple
                onChange={
                  handleFileChange
                }
                hidden
              />

              <div className="dv_upload_inner">
                Click to upload or
                drag files here
              </div>
            </label>

            {files.length > 0 && (
              <div className="dv_file_list">
                {files.map(
                  (
                    file,
                    index
                  ) => (
                    <div
                      key={index}
                      className="dv_file_item"
                    >
                      <span>
                        {
                          file.name
                        }
                      </span>

                      <button
                        onClick={() =>
                          removeFile(
                            index
                          )
                        }
                        className="dv_remove_btn"
                      >
                        ×
                      </button>
                    </div>
                  )
                )}
              </div>
            )}

            <button
              className="btn-primary dv_submit_btn"
              onClick={
                handleSubmit
              }
              disabled={
                loading
              }
            >
              {loading
                ? "Submitting..."
                : "Submit Documents"}
            </button>
          </>
        )}

        {message && (
          <div className="dv_message_box">
            {message}
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentVerification;
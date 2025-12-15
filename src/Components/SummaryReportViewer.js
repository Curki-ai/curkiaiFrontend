import React, { useState } from "react";
import { MdOutlineFileDownload } from "react-icons/md";
import "../Styles/SummaryReportViwer.css";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github.css";
import NewReportIcon from "../Images/NewReportIcon.png";
import icon2 from "../Images/Icon (2).png";
import { PiPlusCircleFill, PiMinusCircleFill } from "react-icons/pi";

const SummaryReport = ({
  summaryText,
  handleDownloadAnalyedReportUploadedCSV,
  handleDownloadAnalyedStandardReportCSV,
  selectedRole,
  showDownloadButton,
  handleDownloadIncidentReportCSV,
  handledownloadPayrollFile,
  resetSirsAnalysisState,
  resetQualityandRiskState,
  resetIncidentReportState,
  resetCareServicesEligibilityState,
  resetCustomReportingState,
  showCarePlanDownloadButton,
  handleDownloadCarePlanData
}) => {
  // console.log(showDownloadButton);
  const parsedResponse =
    summaryText && typeof summaryText === "string"
      ? JSON.parse(summaryText)
      : summaryText;
  console.log("parsedResponse",parsedResponse);
  const [isCompletnessAuditOpen, setIsCompletenessAuditOpen] = useState(false);

  const compliance_level = parsedResponse?.compliance_level || "";
  const review_response = parsedResponse?.review_response || "";
  const completeness_audit =
    parsedResponse?.completeness_audit ||
    parsedResponse?.completness_audit ||
    "";


  const levelTextColors = {
    High: "compliance-high",
    Moderate: "compliance-moderate",
    Low: "compliance-low",
  };

  const levelTextClass =
    levelTextColors[compliance_level] || "compliance-normal";

  return (
    <div className="summary-report-container">
      {selectedRole === "Financial Health" ? (
        <>
          {/* <div className="title" style={{ textAlign: "center", marginBottom: '30px' }}>AI SUMMARY</div> */}
          <div className="financial-health-markdown">
            <ReactMarkdown
              children={review_response}
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeRaw, rehypeHighlight]}
            />

          </div>
          <div className="compliance-level-container">
            <strong className={`${levelTextClass} compliance-level-text`}>Overall Compliance Level:</strong>
            <span className={`${levelTextClass} compliance-level-text`}>{compliance_level}</span>
          </div>
          <div className="financial-health-markdown">
            <div
              className="financial-health-header"
              onClick={() => setIsCompletenessAuditOpen((prev) => !prev)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: '10px',
                cursor: "pointer",
                marginTop: "20px",
              }}
            >
              <h2 style={{ margin: 0 }}>Completeness Audit</h2>
              {isCompletnessAuditOpen ? (
                <PiMinusCircleFill size={28} color="#6c4cdc" />
              ) : (
                <PiPlusCircleFill size={28} color="#6c4cdc" />
              )}
            </div>

            {isCompletnessAuditOpen && (
              <div className="financial-health-content">
                <ReactMarkdown
                  children={completeness_audit}
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeRaw, rehypeHighlight]}
                />
              </div>
            )}
          </div>
        </>
      ) : selectedRole === "Quarterly Financial Reporting" ? (
        <>
          <div className="title" style={{ textAlign: "center" }}>AI SUMMARY - Quarterly Financial Report</div>
          <div className="download-report-div">
            <div style={{ fontSize: "18px", fontWeight: "500", textAlign: "center", margin: "12px 0 20px" }}>Download Quarterly Reports</div>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: "18px" }}>
              <div style={{ width: "70%", display: "flex", justifyContent: "space-between" }}>
                <button className="download-report-btn" onClick={handleDownloadAnalyedStandardReportCSV}>Approved QFR Format <MdOutlineFileDownload color="white" style={{ marginLeft: "5px" }} size={24} /></button>
                <button className="download-report-btn" onClick={handleDownloadAnalyedReportUploadedCSV}>Your Uploaded QFR Format <MdOutlineFileDownload color="white" style={{ marginLeft: "5px" }} size={24} /></button>
              </div>
            </div>
          </div>
          <div className="financial-health-markdown"><ReactMarkdown children={review_response} remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw, rehypeHighlight]} /></div>
          <div className="compliance-level-container"><strong className={`${levelTextClass} compliance-level-text`}>Overall Compliance Level:</strong> <span className={`${levelTextClass} compliance-level-text`}>{compliance_level}</span></div>
        </>
      ) : selectedRole === "SIRS Analysis" ? (
        <>
          <div
            style={{
              width: "100%",
              display: "flex",
              justifyContent: "flex-start",
              marginBottom: "24px",
            }}
          >
            <button className="new-report-btn" onClick={resetSirsAnalysisState}>
              <img
                src={NewReportIcon}
                alt="newReporticon"
                style={{ width: "24px" }}
              />
              <div>New Report</div>
            </button>
          </div>
          {Array.isArray(parsedResponse) ? (
            parsedResponse.map((entry, index) => (
              <div key={index} className="sirs-markdown">
                {entry?.incident && (
                  <ReactMarkdown
                    children={entry.incident}
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeRaw, rehypeHighlight]}
                  />
                )}

                {entry?.risk && (
                  <ReactMarkdown
                    children={entry.risk}
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeRaw, rehypeHighlight]}
                  />
                )}

                {entry?.recommendation && (
                  <ReactMarkdown
                    children={entry.recommendation}
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeRaw, rehypeHighlight]}
                  />
                )}
              </div>
            ))
          ) : (
            <div style={{ textAlign: "center", marginTop: "2rem" }}>
              Invalid SIRS report format.
            </div>
          )}
        </>
      ) : selectedRole === "Client Profitability & Service" ? (
        <>
          <div
            style={{
              width: "100%",
              display: "flex",
              justifyContent: "flex-start",
              marginBottom: "24px",
              gap: '20px'
            }}
          >
            <button
              className="new-report-btn"
              onClick={resetCareServicesEligibilityState}
            >
              <img
                src={NewReportIcon}
                alt="newReporticon"
                style={{ width: "24px" }}
              />{" "}
              <div>New Report</div>
            </button>
          </div>
          {Array.isArray(parsedResponse) ? (
            parsedResponse.map((entry, index) => (
              <div
                key={index}
                className="sirs-markdown"
                style={{ marginBottom: "32px" }}
              >
                {entry?.eligibility && (
                  <ReactMarkdown
                    children={entry.eligibility}
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeRaw, rehypeHighlight]}
                  />
                )}

                {entry?.compliance && (
                  <ReactMarkdown
                    children={entry.compliance}
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeRaw, rehypeHighlight]}
                  />
                )}

                {entry?.documentation && (
                  <ReactMarkdown
                    children={entry.documentation}
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeRaw, rehypeHighlight]}
                  />
                )}

                {entry?.financial && (
                  <ReactMarkdown
                    children={entry.financial
                      .replace(/```(?:\w+)?\n?/, "")
                      .replace(/```$/, "")}
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeRaw, rehypeHighlight]}
                  />
                )}

                {entry?.service && (
                  <ReactMarkdown
                    children={entry.service}
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeRaw, rehypeHighlight]}
                  />
                )}
              </div>
            ))
          ) : (
            <div style={{ textAlign: "center", marginTop: "2rem" }}>
              No Care Plan report data available.
            </div>
          )}
          {showCarePlanDownloadButton === true && (
            <button
              className="download-reportsss-btnsss"
              onClick={handleDownloadCarePlanData}
            >
              Download
              <img src={icon2} alt="download" style={{ width: "12px", height: "12px" }} />
            </button>
          )}
        </>
      ) : selectedRole === "Incident Report" ? (
        <>
          <div
            style={{
              width: "100%",
              display: "flex",
              justifyContent: "flex-start",
              marginBottom: "24px",
              gap: "20px",
            }}
          >
            <button
              className="new-report-btn"
              onClick={resetIncidentReportState}
            >
              <img
                src={NewReportIcon}
                alt="newReporticon"
                style={{ width: "24px" }}
              />
              <div>New Report</div>
            </button>
            {showDownloadButton === true && (
              <button
                className="download-report-btn"
                onClick={handleDownloadIncidentReportCSV}
              >
                Download Report{" "}
                <MdOutlineFileDownload
                  color="white"
                  style={{ marginLeft: "6px" }}
                  size={24}
                />
              </button>
            )}
          </div>
          {Array.isArray(parsedResponse) ? (
            parsedResponse.map((entry, index) => (
              <div
                key={index}
                className="sirs-markdown"
                style={{ marginBottom: "32px" }}
              >
                {entry?.client && (
                  <div
                    style={{
                      fontSize: "38px",
                      fontWeight: "bold",
                      color: "black",
                    }}
                  >
                    <ReactMarkdown
                      children={entry.client
                        .replace(/```(?:\w+)?\n?/, "")
                        .replace(/```$/, "")}
                      remarkPlugins={[remarkGfm]}
                      rehypePlugins={[rehypeRaw, rehypeHighlight]}
                    />
                  </div>
                )}
                {entry?.incident && (
                  <ReactMarkdown
                    children={entry.incident
                      .replace(/```(?:\w+)?\n?/, "")
                      .replace(/```$/, "")}
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeRaw, rehypeHighlight]}
                  />
                )}

                {entry?.recommendation && (
                  <ReactMarkdown
                    children={entry.recommendation
                      .replace(/```(?:\w+)?\n?/, "")
                      .replace(/```$/, "")}
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeRaw, rehypeHighlight]}
                  />
                )}

                {entry?.risk && (
                  <ReactMarkdown
                    children={entry.risk
                      .replace(/```(?:\w+)?\n?/, "")
                      .replace(/```$/, "")}
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeRaw, rehypeHighlight]}
                  />
                )}
              </div>
            ))
          ) : (
            <div style={{ textAlign: "center", marginTop: "2rem" }}>
              No Care Plan report data available.
            </div>
          )}
        </>
      ) : selectedRole === "Quality and Risk Reporting" ? (
        <>
          <div
            style={{
              width: "100%",
              display: "flex",
              justifyContent: "flex-start",
              marginBottom: "24px",
            }}
          >
            <button
              className="new-report-btn"
              onClick={resetQualityandRiskState}
            >
              <img
                src={NewReportIcon}
                alt="newReporticon"
                style={{ width: "24px" }}
              />
              <div>New Report</div>
            </button>
          </div>
          {parsedResponse ? (
            <div className="sirs-markdown" style={{ marginBottom: "32px" }}>
              {parsedResponse?.Compliance_Standards && (
                <ReactMarkdown
                  children={parsedResponse.Compliance_Standards.replace(
                    /```(?:\w+)?\n?/,
                    ""
                  ).replace(/```$/, "")}
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeRaw, rehypeHighlight]}
                />
              )}
              {parsedResponse?.Incidents_Risk && (
                <ReactMarkdown
                  children={parsedResponse.Incidents_Risk.replace(
                    /```(?:\w+)?\n?/,
                    ""
                  ).replace(/```$/, "")}
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeRaw, rehypeHighlight]}
                />
              )}
              {parsedResponse?.Quality_Indicators && (
                <ReactMarkdown
                  children={parsedResponse.Quality_Indicators.replace(
                    /```(?:\w+)?\n?/,
                    ""
                  ).replace(/```$/, "")}
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeRaw, rehypeHighlight]}
                />
              )}
              {parsedResponse?.Workforce_QIPs && (
                <ReactMarkdown
                  children={parsedResponse.Workforce_QIP.replace(
                    /```(?:\w+)?\n?/,
                    ""
                  ).replace(/```$/, "")}
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeRaw, rehypeHighlight]}
                />
              )}
            </div>
          ) : (
            <div style={{ textAlign: "center", marginTop: "2rem" }}>
              No Care Plan report data available.
            </div>
          )}
        </>
      ) : selectedRole === "Payroll Analysis" ? (
        <>
          <div
            style={{
              width: "100%",
              display: "flex",
              justifyContent: "flex-start",
              marginBottom: "24px",
              gap: "20px",
            }}
          >
            <button
              className="new-report-btn"
              onClick={resetCustomReportingState}
            >
              <img
                src={NewReportIcon}
                alt="newReporticon"
                style={{ width: "24px" }}
              />{" "}
              <div>New Report</div>
            </button>
            <button
              className="download-report-btn"
              onClick={handledownloadPayrollFile}
            >
              Download Report{" "}
              <MdOutlineFileDownload
                color="white"
                style={{ marginLeft: "6px" }}
                size={24}
              />
            </button>
          </div>
          {parsedResponse ? (
            <div className="sirs-markdown" style={{ marginBottom: "32px" }}>
              <ReactMarkdown
                children={parsedResponse.summary
                  .replace(/```(?:\w+)?\n?/, "")
                  .replace(/```$/, "")}
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeRaw, rehypeHighlight]}
              />
            </div>
          ) : (
            <div style={{ textAlign: "center", marginTop: "2rem" }}>
              No payroll summary report available.
            </div>
          )}
        </>
      ) : (
        <div style={{ textAlign: "center", marginTop: "2rem" }}>
          No report format available for this role.
        </div>
      )
      }
    </div >
  );
};

export default SummaryReport;

import React from "react";
import UploadTlcIcon from "../../../Images/UploadTlcIcon.png";
import { RiDeleteBin6Line } from "react-icons/ri";
import TlcPayrollDownloadIcon from "../../../Images/TlcPayrollDownloadIcon.png";
import "../../../Styles/TlcNewCustomReporting.css";

const TlcUploadBox = ({
  id,
  title = "Upload Data",
  subtitle = ".XLSX, .XLS",
  accept = ".xlsx,.xls",
  files = [],
  setFiles,
  onTemplateDownload,
  multiple = true,
}) => {
  return (
    <div className="data-upload-card">
      {/* HEADER */}
      <div className="data-upload-header">
        {onTemplateDownload && (
          <span
            className="data-upload-template"
            onClick={onTemplateDownload}
          >
            Download Template
            <img
              src={TlcPayrollDownloadIcon}
              alt="download"
              style={{ width: "24px", height: "24px" }}
            />
          </span>
        )}

        <span
          className="data-upload-label"
          style={{ marginRight: "auto", marginLeft: "12px" }}
        >
          {files.length === 0 ? title : "Uploaded Files"}
        </span>
      </div>

      {/* DROP AREA */}
      <div
        className="data-upload-droparea"
        onClick={() => document.getElementById(id).click()}
      >
        <input
          id={id}
          type="file"
          accept={accept}
          multiple={multiple}
          hidden
          onChange={(e) => {
            const selected = Array.from(e.target.files);
            setFiles((prev) => [...prev, ...selected]);
            e.target.value = "";
          }}
        />

        {files.length === 0 ? (
          <div className="data-upload-empty">
            <img src={UploadTlcIcon} alt="upload" />
            <div className="data-upload-cta">Click to upload</div>
            <div className="data-upload-format">{subtitle}</div>
          </div>
        ) : (
          <div className="data-upload-filelist">
            {files.map((file, idx) => (
              <div key={idx} className="data-upload-file">
                <div className="data-upload-fileinfo">
                  <img
                    src="https://cdn-icons-png.flaticon.com/512/732/732220.png"
                    alt="xls"
                  />
                  <div>
                    <div className="data-upload-filename">
                      {file.name}
                    </div>
                    <div className="data-upload-status">
                      Uploaded • 100%
                    </div>
                  </div>
                </div>

                <div className="data-upload-actions">
                  <span className="data-upload-success">✔</span>
                  <RiDeleteBin6Line
                    onClick={(e) => {
                      e.stopPropagation();
                      setFiles((prev) =>
                        prev.filter((_, i) => i !== idx)
                      );
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TlcUploadBox;

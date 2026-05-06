import React, { useState } from "react";
import '../../Styles/general-styles/UploaderPage.css';
import { RiDeleteBin6Line } from "react-icons/ri";
import fileIcon from '../../Images/FileIcon.png';
import { FiUploadCloud } from "react-icons/fi";
const UploaderCSVBox = ({ file, setFile, title, removeFile, disabled = false }) => {
    const [loading, setLoading] = useState(false);

    const handleFileChange = (e) => {
        if (disabled) return;
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            setLoading(true);
            setTimeout(() => {
                setFile(selectedFile);
                setLoading(false);
            }, 1500);
        }
    };

    return (
        <div className={`uploader-box ${loading ? "loading" : ""} ${disabled ? "disabled" : ""}`}>
            {loading && (
                <div className="loader-overlay">
                    <div className="spinner"></div>
                </div>
            )}
            <p className="uploader-title">{title}</p>
            {file && (
                <div className="file-info" >
                    <div className="file-icon">
                        <img src={fileIcon} height={20} width={15} alt="Zip" />
                    </div>
                    <div style={{ fontSize: '15px', fontFamily: 'Inter', fontWeight: '600', textAlign: 'start' }}>{file.name}</div>
                    <div className="remove-btn" onClick={removeFile}>
                        <RiDeleteBin6Line size={20} color="red" />
                    </div>
                </div>
            )}
            <div>
                {!file ?
                    <div className="upload-area">
                        <label
                            htmlFor={`file-upload-${title}`}
                            className="upload-label"
                            style={{ cursor: disabled ? 'not-allowed' : 'pointer' }}
                        >
                            <div className="upload-icon">
                                <FiUploadCloud color="#6C4CDC" />
                            </div>
                            <div style={{ fontSize: '14px', fontWeight: '500', fontFamily: 'Inter', marginBottom: '6px' }}>Drop file or browse</div>
                            <p className="support-text">Format: .xlsx or .csv only</p>
                            <div className="uploaddiv">Browse Files</div>
                            <input
                                type="file"
                                id={`file-upload-${title}`}
                                accept=".xlsx, .csv"
                                onChange={handleFileChange}
                                style={{ display: "none" }}
                                disabled={disabled || loading}
                            />
                        </label>
                    </div>
                    :
                    <div style={{ marginTop: '16px' }}>
                        <div className="uploaddiv">Browse Files</div>
                        <input
                            type="file"
                            id={`file-upload-${title}`}
                            accept=".xlsx, .csv"
                            onChange={handleFileChange}
                            style={{ display: "none" }}
                            disabled={disabled || loading}
                        />
                    </div>
                }
            </div>
        </div>
    );
};
export default UploaderCSVBox;
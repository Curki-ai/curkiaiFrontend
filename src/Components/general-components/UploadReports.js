import React from "react";
const UploadReport=()=>{
    return (
        <div className="upload-box">
            <h2>{reportName}</h2>
            <input
                type="file"
                onChange={(e) => setFile(e.target.files[0])}
                accept=".pdf,.docx,.xlsx"
            />
            {file && <p>Selected file: {file.name}</p>}
        </div>
    );
};

export default UploadReport;
import React, { useState } from "react";
import HRAdminView from "./HRAdminView";
import HRStaffView from "./HRStaffView";

const HRAnalysis = (props) => {
    const [role, setRole] = useState("Admin");
    console.log('HRAnalysis props',props);
    return (
        <div style={{ padding: "20px" }}>
            <div style={{ display: 'flex', justifyContent: 'end' }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <p style={{ margin: 0, fontWeight: "500" }}>Who are you ?</p>
                    <div style={{ display: "flex", border: "1px solid #6c4cdc", borderRadius: "6px", overflow: "hidden" }}>
                        <button
                            onClick={() => setRole("Admin")}
                            style={{
                                padding: "6px 16px",
                                background: role === "Admin" ? "#6c4cdc" : "transparent",
                                color: role === "Admin" ? "#fff" : "#6c4cdc",
                                border: "none",
                                cursor: "pointer",
                                fontWeight: "500",
                                transition: "0.2s"
                            }}
                        >
                            Admin
                        </button>
                        <button
                            onClick={() => setRole("Staff")}
                            style={{
                                padding: "6px 16px",
                                background: role === "Staff" ? "#6c4cdc" : "transparent",
                                color: role === "Staff" ? "#fff" : "#6c4cdc",
                                border: "none",
                                cursor: "pointer",
                                fontWeight: "500",
                                transition: "0.2s"
                            }}
                        >
                            Staff
                        </button>
                    </div>
                </div>
            </div>

            <div className="info-table">
                <div className="table-headerss">
                    <span>If You Upload This...</span>
                    <span>Our AI Will Instantly...</span>
                </div>
                <div className="table-rowss">
                    <div>Candidates Resumes (PDF/ZIP file).</div>
                    <ul>
                        <div style={{ padding:'0px 0px 8px 0px' }}>
                            <li>Screens top candidates based on role suitability.</li>
                            <li>Sends tailored screening questions instantly.</li>
                        </div>
                        <div style={{ padding: '8px 0px' }}>
                            <li>Verifies all compliance documents automatically.</li>
                            <li>Onboards staff with preloaded training videos.</li>
                        </div>
                        <div style={{ padding: '8px 0px' }}>
                            <li>Continuously monitors and flags expiring or missing documents.</li>
                            <li>Ensures your workforce stays compliant, trained, and job-ready at all times.</li>
                        </div>
                    </ul>
                </div>
            </div>

            <div>
                {role === "Admin" ? <HRAdminView role={role} selectedRole={props.selectedRole} user={props?.user} setManualResumeZip={props?.setManualResumeZip}/> : <HRStaffView role={role} user={props?.user}/>}
            </div>
        </div>
    );
};

export default HRAnalysis;

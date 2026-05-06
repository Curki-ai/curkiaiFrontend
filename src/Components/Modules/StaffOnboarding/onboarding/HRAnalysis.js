import React, { useState } from "react";
import HRAdminView from "./HRAdminView";
import HRStaffView from "./HRStaffView";

const HRAnalysis = (props) => {
    const [role, setRole] = useState("Admin");
    // console.log('HRAnalysis props', props);
    const userEmail = props?.user?.email
    // const userEmail = "mboutros@tenderlovingcaredisability.com.au"
    const ALLOWED_USERS = [
        "iaquino@tenderlovingcaredisability.com.au",
        "jballares@tenderlovingcaredisability.com.au",
        "kperu@tenderlovingcaredisability.com.au",
        "bastruc@tenderlovingcaredisability.com.au",
        "yzaki@tenderlovingcare.com.au"
    ];
    const isAllowedUsers = ALLOWED_USERS.includes(
        (userEmail || "").toLowerCase()
    );
    const tlcDomainArray = ["tenderlovingcaredisability.com.au", "tenderlovingcare.com.au"]
    const notAllowedDomain = tlcDomainArray.includes(userEmail?.split("@")[1]);
    if (!isAllowedUsers && notAllowedDomain) {
        return (
            <div style={{
                textAlign: "center",
                padding: "120px 20px",
                fontFamily: "Inter, sans-serif",
                color: "#1f2937"
            }}>
                {/* <img
                    src={TlcLogo}
                    alt="Access Denied"
                    style={{ width: "80px", opacity: 0.8, marginBottom: "20px" }}
                /> */}

                <h2 style={{ fontSize: "24px", marginBottom: "12px", color: "#6C4CDC" }}>
                    Access Restricted 🚫
                </h2>

                <p style={{ fontSize: "16px", color: "#555" }}>
                    Sorry, your account (<strong>{userEmail}</strong>)
                    is not authorized to view this page.
                </p>
            </div>
        )
    }
    return (
        <div style={{ padding: "20px" }}>
            {/* <div id="so-who-row">
                <div id="so-who-text">Who are you ?</div>
                <div id="so-admin-staff-btns">
                    <button
                        id="so-admin-btn"
                        className={role !== "Admin" ? "so-role-inactive" : ""}
                        onClick={() => setRole("Admin")}
                    >
                        Admin
                    </button>
                    <button
                        id="so-staff-btn"
                        className={role === "Staff" ? "so-role-active" : ""}
                        onClick={() => setRole("Staff")}
                    >
                        Staff
                    </button>
                </div>
            </div> */}

            {/* <div className="info-table">
                <div className="table-headerss">
                    <span>If You Upload This...</span>
                    <span>Our AI Will Instantly...</span>
                </div>
                <div className="table-rowss">
                    <div>Candidates Resumes (PDF/ZIP file).</div>
                    <ul>
                        <div style={{ padding: '0px 0px 8px 0px' }}>
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
            </div> */}

            <div>
                {role === "Admin" ? <HRAdminView role={role} selectedRole={props.selectedRole} user={props?.user} setManualResumeZip={props?.setManualResumeZip}
                    setShowAIChat={props?.setShowAIChat} setMessages={props?.setMessages} setHrMode={props?.setHrMode} setHrStep={props?.setHrStep}/> : <HRStaffView role={role} user={props?.user} />}
            </div>
        </div>
    );
};

export default HRAnalysis;

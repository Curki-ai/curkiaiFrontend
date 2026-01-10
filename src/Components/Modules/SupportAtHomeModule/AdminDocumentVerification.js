// AdminDocumentVerification.jsx
import React, { useState } from "react";
import "../../../Styles/AdminDocumentVerification.css";
import SearchIcon from '../../../Images/SearchIcon.png';
import { BiSend } from "react-icons/bi";

// Helper function to generate initials
const getInitials = (fullName) => {
    if (!fullName) return "";
    const parts = fullName.split(" ");
    const initials = parts.map((p) => p[0].toUpperCase());
    return initials.slice(0, 2).join(""); // max 2 letters
};

const AdminDocumentVerification = () => {
    const users = [
        {
            id: 1,
            name: "Emeto Winner",
            email: "emeto1@gmail.com",
            verification: [
                { label: "Personal Details – Complete", status: "complete" },
                { label: "Contact Information – Complete", status: "complete" },
                { label: "Qualifications – Pending AI Verification", status: "pending" },
                { label: "Certifications – Pending Verification", status: "pending" },
                { label: "Right-to-Work Proof – Pending Verification", status: "pending" },
                { label: "Driving Licence – Pending Verification", status: "pending" },
            ],
        },
        {
            id: 2,
            name: "Tassy Omah",
            email: "tassy@gmail.com",
            verification: [
                { label: "Personal Details – Complete", status: "complete" },
                { label: "Contact Information – Complete", status: "complete" },
                { label: "Qualifications – Complete", status: "complete" },
                { label: "Certifications – Complete", status: "complete" },
                { label: "Right-to-Work Proof – Complete", status: "complete" },
                { label: "Driving Licence – Complete", status: "complete" },
            ],
        },
        {
            id: 3,
            name: "James Muriel",
            email: "james@gmail.com",
            verification: [
                { label: "Personal Details – Complete", status: "complete" },
                { label: "Contact Information – Complete", status: "complete" },
                { label: "Qualifications – Pending AI Verification", status: "pending" },
                { label: "Certifications – Pending Verification", status: "pending" },
                { label: "Right-to-Work Proof – Pending Verification", status: "pending" },
                { label: "Driving Licence – Pending Verification", status: "pending" },
            ],
        },
        {
            id: 4,
            name: "Ada Johnson",
            email: "ada@gmail.com",
            verification: [
                { label: "Personal Details – Complete", status: "complete" },
                { label: "Contact Information – Complete", status: "complete" },
                { label: "Qualifications – Complete", status: "complete" },
                { label: "Certifications – Pending Verification", status: "pending" },
                { label: "Right-to-Work Proof – Pending Verification", status: "pending" },
                { label: "Driving Licence – Pending Verification", status: "pending" },
            ],
        },
        {
            id: 5,
            name: "Chris Evans",
            email: "chris@gmail.com",
            verification: [
                { label: "Personal Details – Complete", status: "complete" },
                { label: "Contact Information – Complete", status: "complete" },
                { label: "Qualifications – Complete", status: "complete" },
                { label: "Certifications – Complete", status: "complete" },
                { label: "Right-to-Work Proof – Complete", status: "complete" },
                { label: "Driving Licence – Complete", status: "complete" },
            ],
        },
        {
            id: 6,
            name: "Linda Moore",
            email: "linda@gmail.com",
            verification: [
                { label: "Personal Details – Complete", status: "complete" },
                { label: "Contact Information – Complete", status: "complete" },
                { label: "Qualifications – Pending AI Verification", status: "pending" },
                { label: "Certifications – Pending Verification", status: "pending" },
                { label: "Right-to-Work Proof – Pending Verification", status: "pending" },
                { label: "Driving Licence – Pending Verification", status: "pending" },
            ],
        },
        {
            id: 7,
            name: "Samuel Brown",
            email: "samuel@gmail.com",
            verification: [
                { label: "Personal Details – Complete", status: "complete" },
                { label: "Contact Information – Complete", status: "complete" },
                { label: "Qualifications – Complete", status: "complete" },
                { label: "Certifications – Complete", status: "complete" },
                { label: "Right-to-Work Proof – Pending Verification", status: "pending" },
                { label: "Driving Licence – Pending Verification", status: "pending" },
            ],
        },
    ];

    const [selectedUser, setSelectedUser] = useState(users[0]);
    const [query, setQuery] = useState("");
    const [loading, setLoading] = useState(false);

    return (
        <div className="admin-verification-container">
            {/* Left user list */}
            <div className="admin-user-list">
                {users.map((user) => (
                    <div
                        key={user.id}
                        className={`admin-user-item ${selectedUser.id === user.id ? "admin-active" : ""
                            }`}
                        onClick={() => setSelectedUser(user)}
                    >
                        <div className="admin-avatar">{getInitials(user.name)}</div>
                        <div>
                            <p className="admin-user-name">{user.name}</p>
                            <p className="admin-user-email">{user.email}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Right panel */}
            <div className="admin-verification-panel">
                <h3 className="admin-panel-title">Verification Status</h3>

                <ul className="admin-status-list">
                    {selectedUser.verification.map((item, idx) => (
                        <li key={idx} className="admin-status-item">
                            {item.status === "complete" ? (
                                <span className="admin-status-icon">✅</span>
                            ) : (
                                <span className="admin-status-icon">⏳</span>
                            )}
                            {item.label}
                        </li>
                    ))}
                </ul>

                <div className="rostering-input-box">
                    <div className="rostering-input-wrapper">
                        <div className="rostering-search-icon">
                            <img src={SearchIcon} alt='SearchIcon' style={{ width: '21px', height: '20px' }} />
                        </div>
                        <textarea
                            rows={6}
                            placeholder="I am looking for..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                        />
                        <button className="rostering-send-btn"  disabled={loading}>
                            {loading ? "Sending..." : <BiSend />}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDocumentVerification;

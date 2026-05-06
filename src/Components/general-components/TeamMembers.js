import React, { useEffect, useState } from "react";
import "../../Styles/general-styles/TeamMembers.css";
import { FiPlus, FiChevronDown } from "react-icons/fi";
import { IoArrowBackOutline } from "react-icons/io5";
import StatusDropdown from "./TeamMembersStatusDropdown";
import MultiSelectCustom from "../Modules/FinancialModule/MultiSelectCustom";
import voiceRoleIcon from "../../Images/VoiceRoleIcon.png";
import TlcPayrollDownArrow from "../../Images/tlc_payroll_down_button.png"
const TeamMembers = ({ onBack, loggedInUserEmail }) => {
  const [members, setMembers] = useState([]);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteData, setInviteData] = useState({
    email: "",
    name: "",
    role: "Staff",
  });
  const [loading, setLoading] = useState(false);
  const [updatingMemberId, setUpdatingMemberId] = useState(null);
  const [statusModalMember, setStatusModalMember] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState([]);
  const statusOptions = [
    { label: "Active", value: "Active" },
    { label: "Restricted", value: "Restricted" },
  ];
  const BASE_URL =
    "https://curki-test-prod-auhyhehcbvdmh3ef.canadacentral-01.azurewebsites.net/api/teamMembers";

  const fetchMembers = async () => {
    try {
      if (!loggedInUserEmail) return;

      // Get team members
      const res = await fetch(
        `${BASE_URL}?userEmail=${encodeURIComponent(loggedInUserEmail)}`
      );

      const teamData = await res.json();

      // Fetch logged-in user
      const userRes = await fetch(
        `https://curki-test-prod-auhyhehcbvdmh3ef.canadacentral-01.azurewebsites.net/api/user/get?userEmail=${encodeURIComponent(
          loggedInUserEmail
        )}`
      );

      const userData = await userRes.json();

      //Check if logged-in user already exists in team list
      const exists = teamData.some(
        (m) => m.userEmail === loggedInUserEmail
      );

      //If not → add logged-in user
      if (!exists) {
        teamData.unshift({
          id: "self",
          userEmail: loggedInUserEmail,
          name: userData.user?.name || "You",
          role: userData.isAdmin ? "Admin" : "Staff",
          status: "Active",
        });
      }

      setMembers(teamData);

    } catch (error) {
      console.error("Fetch members error:", error);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, [loggedInUserEmail]);

  const handleChange = (e) => {
    setInviteData({
      ...inviteData,
      [e.target.name]: e.target.value,
    });
  };

  const handleInviteSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch(`${BASE_URL}/invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...inviteData,
          invitedBy: loggedInUserEmail,
        }),
      });

      const data = await res.json();
      alert(data.message);

      setShowInviteModal(false);
      setInviteData({ email: "", name: "", role: "Staff" });
    } catch (error) {
      console.error("Invite error:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = async (member, newStatus) => {
    try {
      setUpdatingMemberId(member.id);
      await fetch(`${BASE_URL}/${member.id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          groupId: member.groupId,
          userEmail: member.userEmail,
          status: newStatus,
        }),
      });

      fetchMembers();
    } catch (error) {
      console.error("Update status error:", error);
    }
    finally {
      setUpdatingMemberId(null);
    }
  };

  return (
    <div className="team-container">
      <div className="team-back" onClick={onBack}>
        <IoArrowBackOutline size={18} />
        Back
      </div>

      <div className="team-header">
        <div>
          <h2>Team Members</h2>
          <p>{members.length} members</p>
        </div>

        <button
          className="invite-btn"
          onClick={() => setShowInviteModal(true)}
        >
          <FiPlus size={18} />
          Invite members
        </button>
      </div>

      <div className="team-table-card">
        <div className="team-table-header">
          <div>Email ID</div>
          <div>Name</div>
          <div>Role</div>
          <div>Status</div>
        </div>

        {members.map((member) => (
          <div key={member.id} className="team-row">
            <div>
              {member.userEmail}
              {member.userEmail === loggedInUserEmail && (
                <span style={{ marginLeft: "6px", color: "#6B7280", fontWeight: 500 }}>
                  (You)
                </span>
              )}
            </div>
            <div>{member.name}</div>
            <div>{member.role}</div>
            <div className="team-status-cell">
              {updatingMemberId === member.id ? (
                <span className="status-pill updating-pill">
                  Updating...
                </span>
              ) : (
                <MultiSelectCustom
                  // leftIcon={voiceRoleIcon}
                  rightIcon={
                    member.userEmail === loggedInUserEmail ? null : TlcPayrollDownArrow
                  }
                  options={statusOptions}
                  selected={[{ label: member.status, value: member.status }]}
                  setSelected={(value) => {
                    if (!value.length) return;

                    toggleStatus(member, value[0].value);
                  }}
                  placeholder="Status"
                  minWidth={120}
                  height={32}
                  isSingleSelect={true}
                  disabled={member.userEmail === loggedInUserEmail}
                />
              )}
            </div>
          </div>
        ))}
      </div>

      {showInviteModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h3>Invite Team Member</h3>

            <form onSubmit={handleInviteSubmit}>
              <input
                type="email"
                name="email"
                placeholder="Email"
                value={inviteData.email}
                onChange={handleChange}
                required
              />

              <input
                type="text"
                name="name"
                placeholder="Full Name"
                value={inviteData.name}
                onChange={handleChange}
                required
              />

              <input
                type="text"
                value="Staff"
                disabled
              />

              <div className="modal-actions">
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() => setShowInviteModal(false)}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="submit-btn"
                  disabled={loading}
                >
                  {loading ? "Sending..." : "Send Invite"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {statusModalMember && (
        <div className="status-modal-overlay">
          <div className="status-modal">
            <h3>Update Status</h3>

            <div className="status-radio-group">

              <label className="status-radio">
                <input
                  type="radio"
                  name="status"
                  value="Active"
                  checked={selectedStatus === "Active"}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                />
                Active
              </label>

              <label className="status-radio">
                <input
                  type="radio"
                  name="status"
                  value="Restricted"
                  checked={selectedStatus === "Restricted"}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                />
                Restricted
              </label>

            </div>

            <div className="status-modal-buttons">
              <button
                className="status-cancel"
                onClick={() => setStatusModalMember(null)}
              >
                Cancel
              </button>

              <button
                className="status-save"
                onClick={() => {
                  toggleStatus(statusModalMember, selectedStatus);
                  setStatusModalMember(null);
                }}
                disabled={updatingMemberId}
              >
                {updatingMemberId ? "Updating..." : "Update"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamMembers;
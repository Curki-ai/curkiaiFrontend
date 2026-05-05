import React, { useState } from "react";
import { auth } from "../../firebase";
import '../../Styles/general-styles/ProfileDropdown.css';

const ProfileDropdown = ({ user }) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleLogout = async () => {
    await auth.signOut();
  };

  return (
    <div className="profile-container">
      <button onClick={() => setDropdownOpen(!dropdownOpen)}>👤</button>
      {dropdownOpen && (
        <div className="dropdown">
          <p>{user.email}</p>
          <button onClick={handleLogout}>Logout</button>
        </div>
      )}
    </div>
  );
};

export default ProfileDropdown;

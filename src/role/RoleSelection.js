import React from 'react';
import { useNavigate } from 'react-router-dom';

const RoleSelection = () => {
  const navigate = useNavigate();

  const handleSelect = (role) => {
    navigate(`/form/${role.toLowerCase()}`);
  };

  return (
    <div className="role-selection-container">
      <h2 className="role-selection-title">Welcome to Chat App </h2>
            <h3 className="role-selection-title">Select your role </h3>
      <button className="role-button" onClick={() => handleSelect('USER')}>
        User
      </button>
      <button className="role-button admin-button" onClick={() => handleSelect('ADMIN')}>
        Admin
      </button>
    </div>
  );
};

export default RoleSelection;

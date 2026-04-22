import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { FiGrid, FiAlertCircle, FiUsers, FiLogOut, FiShield } from 'react-icons/fi';
import './Sidebar.css';

const Sidebar = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('khidmati_token');
    navigate('/login');
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="shield-bg">
          <FiShield size={24} color="#FFFFFF" />
        </div>
        <h2>Admin Panel</h2>
      </div>

      <nav className="sidebar-nav">
        <NavLink 
          to="/" 
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <FiGrid size={20} />
          <span>Dashboard</span>
        </NavLink>
        <NavLink 
          to="/reports" 
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <FiAlertCircle size={20} />
          <span>Reports</span>
        </NavLink>
        <NavLink 
          to="/users" 
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <FiUsers size={20} />
          <span>Users</span>
        </NavLink>
      </nav>

      <div className="sidebar-footer">
        <button onClick={handleLogout} className="logout-btn">
          <FiLogOut size={20} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;

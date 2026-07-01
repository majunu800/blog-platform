import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Home, Search, Film, Send, SquarePlus, User, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="sidebar">
      <div>
        <div className="logo-container">
          <div className="app-logo" onClick={() => navigate('/')}>
            InstaMERN
          </div>
        </div>
        <nav>
          <ul className="nav-links">
            <li>
              <NavLink to="/" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                <Home />
                <span>Home</span>
              </NavLink>
            </li>
            <li>
              <NavLink to="/reels" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                <Film />
                <span>Reels</span>
              </NavLink>
            </li>
            <li>
              <NavLink to="/messages" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                <Send />
                <span>Messages</span>
              </NavLink>
            </li>
            <li>
              <NavLink to="/create" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                <SquarePlus />
                <span>Create</span>
              </NavLink>
            </li>
            <li>
              <NavLink to={`/profile/${user?.id}`} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                <User />
                <span>Profile</span>
              </NavLink>
            </li>
          </ul>
        </nav>
      </div>

      <div>
        <a onClick={handleLogout} className="nav-link" style={{ marginTop: 'auto', borderTop: 'none' }}>
          <LogOut />
          <span>Log Out</span>
        </a>
        <div className="sidebar-profile" onClick={() => navigate(`/profile/${user?.id}`)}>
          <img src={user?.avatar || 'https://api.dicebear.com/7.x/identicon/svg'} alt="Profile" />
          <span style={{ fontSize: '14px', fontWeight: '600' }}>{user?.username}</span>
        </div>
      </div>
    </div>
  );
}

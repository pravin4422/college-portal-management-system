import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useNavbar } from './NavbarContext';
import './Navbar.css';

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
  const { navActions } = useNavbar();

  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('token');
    localStorage.removeItem('hasExistingProfile');
    navigate('/');
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand" onClick={() => navigate('/')}>College Portal</div>
      <div className="navbar-links">
        {navActions}
        {isLoggedIn ? (
          <button className="navbar-btn navbar-login" onClick={handleLogout}><span className="button-content">Logout</span></button>
        ) : (
          <>
            {location.pathname !== '/login' && (
              <button className="navbar-btn navbar-login" onClick={() => navigate('/login')}><span className="button-content">Sign In</span></button>
            )}
            {location.pathname !== '/signup' && (
              <button className="navbar-btn navbar-login" onClick={() => navigate('/signup')}><span className="button-content">Create Account</span></button>
            )}
          </>
        )}
      </div>
    </nav>
  );
}

export default Navbar;

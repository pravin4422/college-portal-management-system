import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './css/login.css';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:5000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await response.json();
      if (response.ok) {
        // Alert message has been removed for a clean, instant transition
        navigate('/student-form'); 
      } else {
        alert(data.error);
      }
    } catch (err) {
      alert('Error connecting to backend');
    }
  };

  return (
    <div className="login-container">
      <form className="login-form" onSubmit={handleSubmit}>
        <div className="box">
          <h2>Login</h2>
          <div className="input-group">
            <label>Email</label>
            <input type="email" placeholder="Enter your email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="input-group">
            <label>Password</label>
            <input type="password" placeholder="Enter your password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <button type="submit" className="login-btn">Sign In</button>
          <p className="switch-text">Don't have an account? <Link to="/signup">Signup here</Link></p>
        </div>
      </form>
    </div>
  );
}

export default Login;

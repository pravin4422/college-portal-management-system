import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './css/login.css';

function Signup() {
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState(''); // New state
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Check if passwords match before calling the backend
    if (password !== confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, age, email, password })
      });
      const data = await response.json();
      if (response.ok) {
        // Alert card has been removed for a fast redirect
        navigate('/login'); 
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
          <h2>Create Account</h2>
          <div className="input-group">
            <label>Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="input-group">
            <label>Age</label>
            <input type="number" value={age} onChange={(e) => setAge(e.target.value)} required />
          </div>
          <div className="input-group">
            <label>Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="input-group">
            <label>Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          {/* New Confirm Password Input Group */}
          <div className="input-group">
            <label>Confirm Password</label>
            <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
          </div>
          <button type="submit" className="login-btn">Sign Up</button>
          <p className="switch-text">Already have an account? <Link to="/login">Login here</Link></p>
        </div>
      </form>
    </div>
  );
}

export default Signup;

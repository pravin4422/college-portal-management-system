import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './css/signup.css'; 

const EyeIcon = ({ open }) => open ? (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
) : (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
);

function Signup() {
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [role, setRole] = useState('student');
  const [idNo, setIdNo] = useState('');
  const [adminTaken, setAdminTaken] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetch('https://studentportal-production-3f43.up.railway.app/api/auth/check-admin')
      .then(res => res.json())
      .then(data => { if (data.adminExists) setAdminTaken(true); })
      .catch(() => {});
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    try {
      // Send data as a true raw JSON payload to satisfy getJsonValue() string match parser
      const response = await fetch('https://studentportal-production-3f43.up.railway.app/api/auth/signup', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json' 
        }, 
        body: JSON.stringify({
          name: name,
          age: String(age),
          email: email,
          password: password,
          role: role,
          idNo: idNo
        })
      });
      
      const data = await response.json();
      
      if (response.ok || data.success === true) {
        localStorage.setItem('userRole', role);
        localStorage.setItem('userIdNo', idNo);
        alert("Registration successful");
        navigate('/login'); 
      } else {
        alert(data.error || 'Registration failed');
      }
    } catch (err) {
      alert('Error connecting to backend');
    }
  };

  return (
    <form className="signup-form" onSubmit={handleSubmit} autoComplete="off">
      <div className="signup-box">
        <h2>Create Account</h2>
        
        {/* Dummy hidden fields trick the browser's aggressive initial autofill scan */}
        <input type="text" name="prevent_autofill" style={{ display: 'none' }} />
        <input type="password" name="password_prevent_autofill" style={{ display: 'none' }} />

        <div className="signup-input-group">
          <label>I am a</label>
          <div className="signup-role-toggle">
            <button type="button" className={`role-btn${role === 'student' ? ' active' : ''}`} onClick={() => setRole('student')}>Student</button>
            <button type="button" className={`role-btn${role === 'teacher' ? ' active' : ''}`} onClick={() => setRole('teacher')}>Teacher</button>
            {!adminTaken && (
              <button type="button" className={`role-btn${role === 'admin' ? ' active' : ''}`} onClick={() => setRole('admin')}>Admin</button>
            )}
          </div>
        </div>

        <div className="signup-input-group">
          <label>{role === 'student' ? 'Roll No.' : role === 'teacher' ? 'Teacher ID' : 'Admin ID'}</label>
          <input type="text" placeholder={role === 'student' ? 'Enter your roll number' : role === 'teacher' ? 'Enter your teacher ID' : 'Enter your admin ID'} value={idNo} onChange={(e) => setIdNo(e.target.value)} autoComplete="off" required />
        </div>

        <div className="signup-input-group">
          <label>Name</label>
          <input type="text" placeholder="Enter your full name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="off" required />
        </div>
        
        <div className="signup-input-group">
          <label>Age</label>
          <input type="number" placeholder="Enter your age" value={age} onChange={(e) => setAge(e.target.value)} autoComplete="off" required />
        </div>
        
        <div className="signup-input-group">
          <label>Email</label>
          <input type="email" name="user_registration_email_unique" placeholder="Enter your email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="none" required />
        </div>
        
        <div className="signup-input-group">
          <label>Password</label>
          <div className="signup-password-wrapper">
            <input type={showPassword ? 'text' : 'password'} name="user_registration_password_secure" placeholder="Create a password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" required />
            <button type="button" className="signup-eye-btn" onClick={() => setShowPassword(p => !p)} tabIndex={-1}>
              <EyeIcon open={showPassword} />
            </button>
          </div>
        </div>
        
        <div className="signup-input-group">
          <label>Confirm Password</label>
          <div className="signup-password-wrapper">
            <input type={showConfirm ? 'text' : 'password'} name="user_registration_confirm_password_secure" placeholder="Confirm your password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} autoComplete="new-password" required />
            <button type="button" className="signup-eye-btn" onClick={() => setShowConfirm(p => !p)} tabIndex={-1}>
              <EyeIcon open={showConfirm} />
            </button>
          </div>
        </div>
        
        <button type="submit" className="signup-btn">Sign Up</button>
        <p className="signup-switch-text">Already have an account? <Link to="/login">Login here</Link></p>
      </div>
    </form>
  );
}

export default Signup;

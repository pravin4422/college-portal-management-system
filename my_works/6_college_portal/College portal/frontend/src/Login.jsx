import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './css/login.css';

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

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const navigate = useNavigate();

  // Handles the initial credentials submission phase
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch('https://studentportal-production-3f43.up.railway.app/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password: password.trim() })
      });
      const responseText = await response.text();
      const data = responseText ? JSON.parse(responseText) : {};
      if (response.ok) {
        localStorage.setItem('userEmail', email.trim());
        setIsOtpSent(true);
      } else {
        alert(data.error || 'Invalid credentials');
      }
    } catch (err) {
      alert('Error connecting to server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    setLoading(true);
    try {
      const response = await fetch('https://studentportal-production-3f43.up.railway.app/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password: password.trim() })
      });
      const data = await response.json().catch(() => ({}));
      if (response.ok) {
        setOtpCode('');
        let seconds = 30;
        setResendCooldown(seconds);
        const timer = setInterval(() => {
          seconds -= 1;
          setResendCooldown(seconds);
          if (seconds <= 0) clearInterval(timer);
        }, 1000);
      } else {
        alert(data.error || 'Failed to resend OTP');
      }
    } catch {
      alert('Error connecting to server.');
    } finally {
      setLoading(false);
    }
  };

  // Fixed handler that checks the backend response payload to route correctly
  const handleOtpVerifySubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch('https://studentportal-production-3f43.up.railway.app/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), otpCode: otpCode.trim() })
      });
      const responseText = await response.text();
      const data = responseText ? JSON.parse(responseText) : {};
      if (response.ok && data.success) {
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('userEmail', email.trim());
        localStorage.setItem('hasExistingProfile', data.hasExistingProfile ? 'true' : 'false');
        if (data.role) localStorage.setItem('userRole', data.role);
        if (data.idNo) localStorage.setItem('userIdNo', data.idNo);
        if (data.name) localStorage.setItem('userName', data.name);
        // Save teacher info to shared registry so admin can see all teachers
        if (data.role === 'teacher') {
          const teacherEntry = { id: email.trim(), email: email.trim(), name: data.name || data.idNo || email.trim(), idNo: data.idNo || '' };
          try {
            const regRes = await fetch('https://studentportal-production-3f43.up.railway.app/api/dashboard-data?studentId=teachers_registry&type=teacher_registry');
            const regData = await regRes.json();
            const existing = Array.isArray(regData.content) ? regData.content : [];
            const updated = existing.some(t => t.id === teacherEntry.id)
              ? existing.map(t => t.id === teacherEntry.id ? teacherEntry : t)
              : [...existing, teacherEntry];
            await fetch('https://studentportal-production-3f43.up.railway.app/api/dashboard-data', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ studentId: 'teachers_registry', type: 'teacher_registry', content: updated }),
            });
          } catch {}
        }
        if (data.role === 'admin') {
          navigate('/admin-dashboard', { replace: true });
        } else if (data.role === 'teacher') {
          navigate('/student-dashboard', { replace: true });
        } else {
          navigate(data.hasExistingProfile ? '/student-dashboard' : '/student-form', { replace: true });
        }
      } else {
        alert(data.error || 'Invalid or expired OTP');
      }
    } catch (err) {
      alert('Error connecting to server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <form 
        className="login-form" 
        onSubmit={isOtpSent ? handleOtpVerifySubmit : handleLoginSubmit} 
        autoComplete="off"
      >
        <div className="box">
          <h2>{isOtpSent ? 'Verify OTP' : 'Login'}</h2>
          
          <input type="text" name="prevent_autofill_email" style={{ display: 'none' }} />
          <input type="password" name="prevent_autofill_pwd" style={{ display: 'none' }} />

          <div className="input-group">
            <label>Email</label>
            <input 
              type="email" 
              name="user_login_email_unique_field"
              placeholder="Enter your email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              disabled={isOtpSent} // Locks the email block so it can't change during OTP phase
              autoComplete="none"
              required 
            />
          </div>

          {/* Conditional Layout Toggles depending on current server validation cycle */}
          {!isOtpSent ? (
            <div className="input-group">
              <label>Password</label>
              <div className="password-wrapper">
                <input 
                  type={showPassword ? 'text' : 'password'}
                  name="user_login_password_secure_field"
                  placeholder="Enter your password" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  autoComplete="current-password"
                  required 
                />
                <button
                  type="button"
                  className="eye-btn"
                  onClick={() => setShowPassword(p => !p)}
                  tabIndex={-1}
                >
                  <EyeIcon open={showPassword} />
                </button>
              </div>
            </div>
          ) : (
            <div className="input-group">
              <label>Verification Code</label>
              <input 
                type="text" 
                name="user_login_otp_validation_field"
                placeholder="Enter 6-digit OTP" 
                maxLength="6"
                value={otpCode} 
                onChange={(e) => setOtpCode(e.target.value)} 
                required 
              />
              <button
                type="button"
                className="resend-otp-btn"
                onClick={handleResendOtp}
                disabled={resendCooldown > 0 || loading}
              >
                {resendCooldown > 0 ? `Resend OTP in ${resendCooldown}s` : 'Resend OTP'}
              </button>
            </div>
          )}

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? 'Please wait...' : (isOtpSent ? 'Confirm & Verify' : 'Sign In')}
          </button>
          
          {!isOtpSent && (
            <p className="switch-text">Don't have an account? <Link to="/signup">Signup here</Link></p>
          )}
        </div>
      </form>
    </div>
  );
}

export default Login;

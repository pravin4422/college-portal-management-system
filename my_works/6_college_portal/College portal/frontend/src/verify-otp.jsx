import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './css/verify-otp.css'; 

function VerifyOtp() {
  const [otp, setOtp] = useState(new Array(6).fill(""));
  const inputRefs = useRef([]);
  const navigate = useNavigate();
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    if (timer === 0) { setCanResend(true); return; }
    const interval = setInterval(() => setTimer((t) => t - 1), 1000);
    return () => clearInterval(interval);
  }, [timer]);

  const handleResend = async () => {
    const email = localStorage.getItem('userEmail') || '';
    try {
      const response = await fetch('https://studentportal-production-3f43.up.railway.app/api/auth/resend-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await response.json();
      if (data.success) {
        alert('OTP resent successfully!');
        setTimer(60);
        setCanResend(false);
      } else {
        alert(data.error || 'Failed to resend OTP');
      }
    } catch {
      alert('Error connecting to server');
    }
  };

  // Handles character checking, entry, and moving focus forward
  const handleChange = (element, index) => {
    if (isNaN(element.value)) return false; // Lock input to numeric digits only

    let newOtp = [...otp];
    newOtp[index] = element.value;
    setOtp(newOtp);

    // Auto-focus the next layout cell if a number is typed
    if (element.value !== "" && index < 5) {
      inputRefs.current[index + 1].focus();
    }
  };

  // Handles cursor backspace correction flows
  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace") {
      if (otp[index] === "" && index > 0) {
        inputRefs.current[index - 1].focus();
      }
    }
  };

  // Submits the payload to your Java backend
  const handleSubmit = async (e) => {
    e.preventDefault();
    const finalOtpString = otp.join("");
    
    if (finalOtpString.length < 6) {
      alert("Please complete the 6-digit entry");
      return;
    }

    const verificationPayload = {
      email: localStorage.getItem('userEmail') || '',
      otpCode: finalOtpString
    };

    try {
      // Connects directly to your Java servlet domain route
      const response = await fetch('https://studentportal-production-3f43.up.railway.app/api/auth/verify', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json' 
        }, 
        body: JSON.stringify(verificationPayload)
      });

      const data = await response.json();
      
      if (data.success === true) {
        alert('Verification successful!');
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('hasExistingProfile', data.hasExistingProfile ? 'true' : 'false');
        navigate(data.hasExistingProfile ? '/student-dashboard' : '/student-form');
      } else {
        alert(data.error || 'Invalid or expired OTP token'); 
      }
    } catch (err) {
      alert('Error connecting to backend verification server');
    }
  };

  return (
    <div className="otp-container">
      <form className="otp-form" onSubmit={handleSubmit} autoComplete="off">
        <div className="box">
          <h2>Verify Account</h2>
          <p className="subtitle">Enter the 6-digit verification code sent to your email</p>
          
          <div className="otp-inputs">
            {otp.map((data, index) => (
              <input
                key={index}
                type="text"
                maxLength="1"
                value={data}
                ref={(el) => (inputRefs.current[index] = el)}
                onChange={(e) => handleChange(e.target, index)}
                onKeyDown={(e) => handleKeyDown(e, index)}
                onFocus={(e) => e.target.select()}
                required
              />
            ))}
          </div>
          
          <button type="submit" className="otp-btn">Verify Code</button>
          <p className="switch-text">Didn't receive a code? <Link to="/login">Back to Login</Link></p>
          <p className="switch-text">
            {canResend
              ? <button type="button" onClick={handleResend} className="resend-btn">Resend OTP</button>
              : `Resend OTP in ${timer}s`
            }
          </p>
        </div>
      </form>
    </div>
  );
}

export default VerifyOtp;

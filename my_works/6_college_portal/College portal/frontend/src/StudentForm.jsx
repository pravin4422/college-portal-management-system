import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './css/studentform.css'; 

function StudentForm() {
  const navigate = useNavigate();

  useEffect(() => {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    if (!isLoggedIn) {
      navigate('/');
      return;
    }
    const email = localStorage.getItem('userEmail');
    if (!email) return;
    fetch(`https://studentportal-production-3f43.up.railway.app/api/students?email=${encodeURIComponent(email)}`)
      .then(res => res.ok ? res.json() : [])
      .then(data => {
        const exists = Array.isArray(data) ? data.length > 0 : (data && Object.keys(data).length > 0);
        if (exists) {
          localStorage.setItem('hasExistingProfile', 'true');
          navigate('/student-dashboard');
        }
      })
      .catch(() => {});
  }, [navigate]);

  // Form states tracking your registration criteria
  const [firstName, setFirstName] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('');
  const [classStudying, setClassStudying] = useState('');
  const [bloodType, setBloodType] = useState('');
  const [address, setAddress] = useState('');
  const [guardianName, setGuardianName] = useState('');
  const [guardianPhone, setGuardianPhone] = useState('');
  const [guardianEmail, setGuardianEmail] = useState('');
  const [studentIdDoc, setStudentIdDoc] = useState(null);
  const [recentPhoto, setRecentPhoto] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const data = new FormData();
    data.append('firstName', firstName);
    data.append('dob', dob);
    data.append('gender', gender);
    data.append('classStudying', classStudying);
    data.append('bloodType', bloodType);
    data.append('address', address);
    data.append('guardianName', guardianName);
    data.append('guardianPhone', guardianPhone);
    data.append('guardianEmail', guardianEmail);
    data.append('userEmail', localStorage.getItem('userEmail') || '');
    if (studentIdDoc) data.append('studentIdDoc', studentIdDoc);
    if (recentPhoto) data.append('recentPhoto', recentPhoto);

    try {
      const response = await fetch('https://studentportal-production-3f43.up.railway.app/api/students', {
        method: 'POST',
        body: data
      });

      const result = await response.json().catch(() => ({}));

      if (response.ok && result.success !== false) {
        alert('Student details submitted successfully');
        setFirstName(''); setDob(''); setGender(''); setClassStudying('');
        setBloodType(''); setAddress(''); setGuardianName('');
        setGuardianPhone(''); setGuardianEmail('');
        setStudentIdDoc(null); setRecentPhoto(null);
        e.target.reset();
        localStorage.setItem('hasExistingProfile', 'true');
        navigate('/student-dashboard');
      } else {
        alert(result.error || 'Failed to save student details');
      }
    } catch (err) {
      alert('Network error connecting to backend server');
    }
  };

  return (
    <div className="student-form-container">
      <form className="student-form-wrapper" onSubmit={handleSubmit} encType="multipart/form-data">
        <div className="student-form-box">
          <h2>Student Registration</h2>
          
          <div className="student-form-input-group">
            <label>First Name</label>
            <input type="text" placeholder="Enter full name" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
          </div>

          <div className="student-form-input-group">
            <label>Date of Birth</label>
            <input type="date" value={dob} onChange={(e) => setDob(e.target.value)} required />
          </div>

          <div className="student-form-input-group">
            <label>Gender</label>
            <select value={gender} onChange={(e) => setGender(e.target.value)} required>
              <option value="">Select Gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="student-form-input-group">
            <label>Class Studying</label>
            <input type="text" placeholder="e.g. 10th Grade, Bachelor of Science" value={classStudying} onChange={(e) => setClassStudying(e.target.value)} required />
          </div>

          <div className="student-form-input-group">
            <label>Blood Type</label>
            <input type="text" placeholder="e.g. O+, A-" value={bloodType} onChange={(e) => setBloodType(e.target.value)} required />
          </div>

          <div className="student-form-input-group">
            <label>Address</label>
            <textarea placeholder="Enter current residential address" value={address} onChange={(e) => setAddress(e.target.value)} required />
          </div>

          <h3 className="student-form-subheading">Emergency & Legal Guardian Contacts</h3>
          
          <div className="student-form-input-group">
            <label>Primary Parent/Guardian Name</label>
            <input type="text" placeholder="Enter guardian name" value={guardianName} onChange={(e) => setGuardianName(e.target.value)} required />
          </div>

          <div className="student-form-input-group">
            <label>Phone Number</label>
            <input type="tel" placeholder="Enter primary contact number" value={guardianPhone} onChange={(e) => setGuardianPhone(e.target.value)} required />
          </div>

          <div className="student-form-input-group">
            <label>Email ID</label>
            <input type="email" placeholder="Enter primary email id" value={guardianEmail} onChange={(e) => setGuardianEmail(e.target.value)} required />
          </div>

          <div className="student-form-input-group">
            <label>Unique Student ID (PDF format)</label>
            <input type="file" accept=".pdf" onChange={(e) => setStudentIdDoc(e.target.files[0])} required />
          </div>

          <div className="student-form-input-group">
            <label>Recent Photo (Any Image format)</label>
            <input type="file" accept="image/*" onChange={(e) => setRecentPhoto(e.target.files[0])} required />
          </div>

          <button type="submit" className="student-form-submit-btn"><span>Submit Details</span></button>
        </div>
      </form>
    </div>
  );
}

export default StudentForm;

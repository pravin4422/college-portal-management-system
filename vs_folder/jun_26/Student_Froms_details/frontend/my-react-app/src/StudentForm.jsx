import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './css/login.css';

function StudentForm() {
  const navigate = useNavigate();

  // Form states matching your requirements
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

  const handleLogout = () => {
    navigate('/login'); // Instantly go to login page
  };

  const handleSeeDetails = () => {
    navigate('/student-details'); // Instantly go to details page
  };

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
    if (studentIdDoc) data.append('studentIdDoc', studentIdDoc);
    if (recentPhoto) data.append('recentPhoto', recentPhoto);

    try {
      const response = await fetch('http://localhost:5000/api/students', {
        method: 'POST',
        body: data
      });
      if (response.ok) {
        // Alert message removed. Reset form inputs.
        setFirstName(''); setDob(''); setGender(''); setClassStudying('');
        setBloodType(''); setAddress(''); setGuardianName(''); 
        setGuardianPhone(''); setGuardianEmail('');
        setStudentIdDoc(null); setRecentPhoto(null);
        e.target.reset();
      } else {
        alert('Failed to save details');
      }
    } catch (err) {
      alert('Network error');
    }
  };

  return (
    <div className="login-container">
      {/* Top navigation actions */}
      <div className="top-bar">
        <button onClick={handleSeeDetails} className="nav-btn info-btn">See Student Details</button>
        <button onClick={handleLogout} className="nav-btn logout-btn">Logout</button>
      </div>

      <form className="login-form wider-form" onSubmit={handleSubmit} encType="multipart/form-data">
        <div className="box">
          <h2>Student Registration</h2>
          
          <div className="input-group">
            <label>First Name</label>
            <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
          </div>

          <div className="input-group">
            <label>Date of Birth</label>
            <input type="date" value={dob} onChange={(e) => setDob(e.target.value)} required />
          </div>

          <div className="input-group">
            <label>Gender</label>
            <select value={gender} onChange={(e) => setGender(e.target.value)} required>
              <option value="">Select Gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="input-group">
            <label>Class Studying</label>
            <input type="text" value={classStudying} onChange={(e) => setClassStudying(e.target.value)} required />
          </div>

          <div className="input-group">
            <label>Blood Type</label>
            <input type="text" placeholder="e.g. O+, A-" value={bloodType} onChange={(e) => setBloodType(e.target.value)} required />
          </div>

          <div className="input-group">
            <label>Address</label>
            <textarea value={address} onChange={(e) => setAddress(e.target.value)} required />
          </div>

          <h3>Emergency & Legal Guardian Contacts</h3>
          <div className="input-group">
            <label>Primary Parent/Guardian Name</label>
            <input type="text" value={guardianName} onChange={(e) => setGuardianName(e.target.value)} required />
          </div>

          <div className="input-group">
            <label>Phone Number</label>
            <input type="tel" value={guardianPhone} onChange={(e) => setGuardianPhone(e.target.value)} required />
          </div>

          <div className="input-group">
            <label>Email ID</label>
            <input type="email" value={guardianEmail} onChange={(e) => setGuardianEmail(e.target.value)} required />
          </div>

          <div className="input-group">
            <label>Unique Student ID (PDF format)</label>
            <input type="file" accept=".pdf" onChange={(e) => setStudentIdDoc(e.target.files[0])} required />
          </div>

          <div className="input-group">
            <label>Recent Photo (Any Image format)</label>
            <input type="file" accept="image/*" onChange={(e) => setRecentPhoto(e.target.files[0])} required />
          </div>

          <button type="submit" className="login-btn">Submit Details</button>
        </div>
      </form>
    </div>
  );
}

export default StudentForm;

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './css/login.css';

function StudentDetails() {
  const [students, setStudents] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetch('http://localhost:5000/api/students')
      .then(res => res.json())
      .then(data => setStudents(data))
      .catch(err => console.error("Error loading records:", err));
  }, []);

  return (
    <div className="details-container">
      <div className="top-bar">
        <button onClick={() => navigate('/student-form')} className="nav-btn info-btn">Back to Form</button>
      </div>
      <h2>Registered Student Profiles</h2>
      <div className="records-grid">
        {students.length === 0 ? <p>No records found.</p> : students.map((s) => (
          <div key={s.id} className="student-card">
            <h4>{s.first_name}</h4>
            <p><strong>Class:</strong> {s.class_studying}</p>
            <p><strong>DOB:</strong> {s.dob ? s.dob.split('T')[0] : ''}</p>
            <p><strong>Gender:</strong> {s.gender}</p>
            <p><strong>Blood Type:</strong> {s.blood_type}</p>
            <p><strong>Guardian:</strong> {s.guardian_name} ({s.guardian_phone})</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default StudentDetails;

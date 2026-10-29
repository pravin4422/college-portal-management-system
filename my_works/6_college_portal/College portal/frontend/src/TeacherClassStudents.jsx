import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import './css/teacherprofile.css';

const BASE = 'https://studentportal-production-3f43.up.railway.app';

function TeacherClassStudents() {
  const { className } = useParams();
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${BASE}/api/students`)
      .then(r => r.json())
      .then(data => {
        const all = Array.isArray(data) ? data : [];
        const filtered = all.filter(
          s => (s.classStudying || '').trim().toLowerCase() === className.trim().toLowerCase()
        );
        setStudents(filtered);
      })
      .catch(() => setStudents([]))
      .finally(() => setLoading(false));
  }, [className]);

  return (
    <div className="tp-page">
      <div className="tp-container">

        <div className="tp-header-row">
          <button className="tp-back-btn" onClick={() => navigate(-1)}>← Back</button>
          <h2 className="tp-title">Class {className} — Students</h2>
        </div>

        <p className="tp-sub">Total: {students.length} student{students.length !== 1 ? 's' : ''}</p>

        {loading ? (
          <p className="tp-loading">Loading...</p>
        ) : students.length === 0 ? (
          <p className="tp-empty">No students found in Class {className}.</p>
        ) : (
          <ol className="tp-student-list">
            {students.map((s, i) => (
              <li key={s.id} className="tp-student-item">
                <span className="tp-student-no">{i + 1}.</span>
                <span className="tp-student-name">{s.firstName || 'Unnamed'}</span>
              </li>
            ))}
          </ol>
        )}

      </div>
    </div>
  );
}

export default TeacherClassStudents;

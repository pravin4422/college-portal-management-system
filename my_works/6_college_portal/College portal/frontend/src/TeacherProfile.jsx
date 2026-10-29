import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import './css/teacherprofile.css';

const BASE = 'https://studentportal-production-3f43.up.railway.app';

const EMPTY = {
  name: '', employeeId: '', dob: '', gender: '', phone: '', address: '',
  qualification: '', experience: '', department: '', designation: '',
  joinDate: '', classTeacherOf: '', subjectClasses: '',
};

function TeacherProfile() {
  const navigate = useNavigate();
  const { emailParam } = useParams();
  const email = emailParam ? decodeURIComponent(emailParam) : (localStorage.getItem('userEmail') || '');
  const isAdminView = !!emailParam;

  const [teacher, setTeacher] = useState(null);
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState([]);
  const [expandedMyClass, setExpandedMyClass] = useState(null);
  const [expandedTeachingClass, setExpandedTeachingClass] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  // fetch teacher profile + all students
  useEffect(() => {
    if (!email) { setLoading(false); return; }

    Promise.all([
      fetch(`${BASE}/api/teachers?email=${encodeURIComponent(email)}`).then(r => r.json()),
      fetch(`${BASE}/api/students`).then(r => r.json()),
    ]).then(([tData, sData]) => {
      const hasProfile = tData && tData.id;
      setTeacher(hasProfile ? tData : null);
      if (hasProfile) setForm(tData);
      setStudents(Array.isArray(sData) ? sData : []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [email]);

  const countForClass = (cls) =>
    students.filter(s => (s.classStudying || '').trim().toLowerCase() === cls.trim().toLowerCase()).length;

  // Each entry format: "10A:Maths" or just "10A" (subject optional)
  const subjectClassList = () =>
    (teacher?.subjectClasses || '').split(',').map(c => {
      const [cls, subject] = c.trim().split(':');
      return { cls: cls?.trim(), subject: subject?.trim() || '' };
    }).filter(e => e.cls);

  const handleChange = (e) => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMsg('');
    const payload = { ...form, userEmail: email };
    try {
      const isNew = !teacher;
      const res = await fetch(
        isNew ? `${BASE}/api/teachers` : `${BASE}/api/teachers?email=${encodeURIComponent(email)}`,
        {
          method: isNew ? 'POST' : 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );
      const data = await res.json();
      if (data.success) {
        setTeacher({ ...payload });
        setIsEditing(false);
        setMsg('Profile saved successfully.');
        setTimeout(() => setMsg(''), 3000);
      } else {
        setMsg(data.error || 'Failed to save.');
      }
    } catch {
      setMsg('Network error.');
    }
    setSaving(false);
  };

  if (loading) return <div className="tp-page"><div className="tp-container"><p className="tp-loading">Loading...</p></div></div>;

  return (
    <div className="tp-page">
      <div className="tp-container">

        <div className="tp-header-row">
          <button className="tp-back-btn" onClick={() => navigate(-1)}>Back</button>
          <h2 className="tp-title">Teacher Profile</h2>
          {teacher && !isEditing && !isAdminView && (
            <button className="tp-edit-btn" onClick={() => { setForm(teacher); setIsEditing(true); }}>Edit</button>
          )}
        </div>

        {msg && <p className="tp-msg">{msg}</p>}

        {/* ── No profile yet — show form to create ── */}
        {!teacher && !isEditing && (
          <div className="tp-empty-state">
            <p>No teacher profile found for <strong>{email}</strong>.</p>
            {!isAdminView && (
              <button className="tp-count-btn" onClick={() => setIsEditing(true)}>Create Profile</button>
            )}
          </div>
        )}

        {/* ── Edit / Create Form ── */}
        {isEditing && (
          <form onSubmit={handleSave}>
            <section className="tp-section">
              <h3 className="tp-section-title">Basic Details</h3>
              <div className="tp-grid">
                <div className="tp-field">
                  <label className="tp-label">Full Name</label>
                  <input className="tp-input" name="name" value={form.name || ''} onChange={handleChange} required />
                </div>
                <div className="tp-field">
                  <label className="tp-label">Employee ID</label>
                  <input className="tp-input" name="employeeId" value={form.employeeId || ''} onChange={handleChange} />
                </div>
                <div className="tp-field">
                  <label className="tp-label">Date of Birth</label>
                  <input className="tp-input" type="date" name="dob" value={form.dob || ''} onChange={handleChange} />
                </div>
                <div className="tp-field">
                  <label className="tp-label">Gender</label>
                  <select className="tp-input" name="gender" value={form.gender || ''} onChange={handleChange}>
                    <option value="">Select</option>
                    <option>Male</option>
                    <option>Female</option>
                    <option>Other</option>
                  </select>
                </div>
                <div className="tp-field">
                  <label className="tp-label">Phone</label>
                  <input className="tp-input" name="phone" value={form.phone || ''} onChange={handleChange} />
                </div>
                <div className="tp-field tp-full">
                  <label className="tp-label">Address</label>
                  <textarea className="tp-input" name="address" rows={2} value={form.address || ''} onChange={handleChange} />
                </div>
              </div>
            </section>

            <section className="tp-section">
              <h3 className="tp-section-title">Academic Details</h3>
              <div className="tp-grid">
                <div className="tp-field">
                  <label className="tp-label">Qualification</label>
                  <input className="tp-input" name="qualification" value={form.qualification || ''} onChange={handleChange} />
                </div>
                <div className="tp-field">
                  <label className="tp-label">Experience</label>
                  <input className="tp-input" name="experience" placeholder="e.g. 5 Years" value={form.experience || ''} onChange={handleChange} />
                </div>
                <div className="tp-field">
                  <label className="tp-label">Department</label>
                  <input className="tp-input" name="department" value={form.department || ''} onChange={handleChange} />
                </div>
                <div className="tp-field">
                  <label className="tp-label">Designation</label>
                  <input className="tp-input" name="designation" value={form.designation || ''} onChange={handleChange} />
                </div>
                <div className="tp-field">
                  <label className="tp-label">Join Date</label>
                  <input className="tp-input" type="date" name="joinDate" value={form.joinDate || ''} onChange={handleChange} />
                </div>
                <div className="tp-field">
                  <label className="tp-label">Class Teacher Of</label>
                  <input className="tp-input" name="classTeacherOf" placeholder="e.g. 10A" value={form.classTeacherOf || ''} onChange={handleChange} />
                </div>
                <div className="tp-field tp-full">
                  <label className="tp-label">Classes Teaching (format: Class:Subject, comma-separated)</label>
                  <input className="tp-input" name="subjectClasses" placeholder="e.g. 10A:Maths,10B:Science,9A:English" value={form.subjectClasses || ''} onChange={handleChange} />
                </div>
              </div>
            </section>

            <div className="tp-form-actions">
              <button type="button" className="tp-cancel-btn" onClick={() => setIsEditing(false)}>Cancel</button>
              <button type="submit" className="tp-save-btn" disabled={saving}>{saving ? 'Saving...' : 'Save Profile'}</button>
            </div>
          </form>
        )}

        {/* ── Read-only view ── */}
        {teacher && !isEditing && (
          <>
            <section className="tp-section">
              <h3 className="tp-section-title">Basic Details</h3>
              <div className="tp-grid">
                <div className="tp-field"><span className="tp-label">Name</span><span className="tp-value">{teacher.name || '—'}</span></div>
                <div className="tp-field"><span className="tp-label">Employee ID</span><span className="tp-value">{teacher.employeeId || '—'}</span></div>
                <div className="tp-field"><span className="tp-label">Date of Birth</span><span className="tp-value">{teacher.dob || '—'}</span></div>
                <div className="tp-field"><span className="tp-label">Gender</span><span className="tp-value">{teacher.gender || '—'}</span></div>
                <div className="tp-field"><span className="tp-label">Phone</span><span className="tp-value">{teacher.phone || '—'}</span></div>
                <div className="tp-field"><span className="tp-label">Email</span><span className="tp-value">{teacher.userEmail || email}</span></div>
                <div className="tp-field tp-full"><span className="tp-label">Address</span><span className="tp-value">{teacher.address || '—'}</span></div>
              </div>
            </section>

            <section className="tp-section">
              <h3 className="tp-section-title">Academic Details</h3>
              <div className="tp-grid">
                <div className="tp-field"><span className="tp-label">Qualification</span><span className="tp-value">{teacher.qualification || '—'}</span></div>
                <div className="tp-field"><span className="tp-label">Experience</span><span className="tp-value">{teacher.experience || '—'}</span></div>
                <div className="tp-field"><span className="tp-label">Department</span><span className="tp-value">{teacher.department || '—'}</span></div>
                <div className="tp-field"><span className="tp-label">Designation</span><span className="tp-value">{teacher.designation || '—'}</span></div>
                <div className="tp-field"><span className="tp-label">Join Date</span><span className="tp-value">{teacher.joinDate || '—'}</span></div>
                <div className="tp-field"><span className="tp-label">Class Teacher Of</span><span className="tp-value">{teacher.classTeacherOf || '—'}</span></div>
              </div>
            </section>

            {teacher.classTeacherOf && (() => {
              const cls = teacher.classTeacherOf.trim();
              const count = countForClass(cls);
              const isOpen = expandedMyClass === cls;
              const classStudents = students.filter(
                s => (s.classStudying || '').trim().toLowerCase() === cls.toLowerCase()
              );
              return (
                <section className="tp-section">
                  <h3 className="tp-section-title">My Class Students</h3>
                  <div className="tp-class-row">
                    <span className="tp-class-name">Class {cls}</span>
                    <span className="tp-class-tag">Class Teacher</span>
                    <button
                      className={`tp-count-btn${isOpen ? ' active' : ''}`}
                      style={{ cursor: count > 0 ? 'pointer' : 'default', opacity: count > 0 ? 1 : 0.5 }}
                      onClick={() => count > 0 && setExpandedMyClass(isOpen ? null : cls)}
                    >
                      {count} Students
                    </button>
                  </div>
                  {isOpen && (
                    <div className="tp-students-panel">
                      {classStudents.map(s => (
                        <div key={s.id} className="tp-student-card" style={{ cursor: 'pointer' }} onClick={() => navigate(`/student-view/${s.id}`)}>
                          <div className="tp-student-avatar">{s.firstName?.charAt(0) || 'S'}</div>
                          <div className="tp-student-card-info">
                            <span className="tp-student-card-name">{s.firstName}</span>
                            <span className="tp-student-card-email">{s.email || '—'}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              );
            })()}

            <section className="tp-section">
              <h3 className="tp-section-title">Classes Teaching</h3>
              {subjectClassList().length === 0 ? (
                <p className="tp-empty">No classes assigned.</p>
              ) : (
                <div className="tp-class-list">
                  {subjectClassList().map(({ cls, subject }) => {
                    const count = countForClass(cls);
                    const isOpen = expandedTeachingClass === cls;
                    const classStudents = students.filter(
                      s => (s.classStudying || '').trim().toLowerCase() === cls.trim().toLowerCase()
                    );
                    return (
                      <div key={cls}>
                        <div className="tp-class-row">
                          <span className="tp-class-name">Class {cls}</span>
                          {subject && <span className="tp-subject-tag">{subject}</span>}
                          {cls === teacher.classTeacherOf && (
                            <span className="tp-class-tag">Class Teacher</span>
                          )}
                          <button
                            className={`tp-count-btn${isOpen ? ' active' : ''}`}
                            style={{ cursor: count > 0 ? 'pointer' : 'default', opacity: count > 0 ? 1 : 0.5 }}
                            onClick={() => count > 0 && setExpandedTeachingClass(isOpen ? null : cls)}
                          >
                            {count} Students
                          </button>
                        </div>
                        {isOpen && (
                          <div className="tp-students-panel">
                            {classStudents.map(s => (
                              <div key={s.id} className="tp-student-card" style={{ cursor: 'pointer' }} onClick={() => navigate(`/student-view/${s.id}`)}>
                                <div className="tp-student-avatar">{s.firstName?.charAt(0) || 'S'}</div>
                                <div className="tp-student-card-info">
                                  <span className="tp-student-card-name">{s.firstName}</span>
                                  <span className="tp-student-card-email">{s.email || '—'}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </>
        )}

      </div>
    </div>
  );
}

export default TeacherProfile;

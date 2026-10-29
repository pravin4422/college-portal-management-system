import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './css/studentdashboard.css';

const BASE = 'https://studentportal-production-3f43.up.railway.app';

function ProfileImage({ src, fallback }) {
  const [failed, setFailed] = useState(false);
  if (failed) return <span style={{ fontSize: 'inherit', fontWeight: 'inherit', color: 'inherit' }}>{fallback}</span>;
  return (
    <img
      src={src}
      alt="profile"
      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
      onError={() => setFailed(true)}
    />
  );
}

function SettingsPage({ studentData, onStudentUpdate, userRole, targetStudentId }) {
  const [preferredName, setPreferredName] = useState(studentData?.firstName || '');
  const [phone, setPhone] = useState(studentData?.guardianPhone || '');
  const [dob, setDob] = useState(studentData?.dob || '');
  const [gender, setGender] = useState(studentData?.gender || '');
  const [bloodType, setBloodType] = useState(studentData?.bloodType || '');
  const [address, setAddress] = useState(studentData?.address || '');
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errMsg, setErrMsg] = useState('');

  const handleAvatarChange = (e) => {
    const f = e.target.files[0];
    if (f) setAvatarPreview(URL.createObjectURL(f));
  };

  const handleSave = async () => {
    if (!studentData?.id) { setErrMsg('No student ID found.'); return; }
    setSaving(true); setErrMsg('');
    try {
      const res = await fetch(`${BASE}/api/students?id=${studentData.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: preferredName,
          dob,
          gender,
          bloodType,
          address,
          guardianPhone: phone,
          guardianName: studentData?.guardianName || '',
          guardianEmail: studentData?.guardianEmail || '',
          classStudying: studentData?.classStudying || '',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
        if (onStudentUpdate) onStudentUpdate({ ...studentData, firstName: preferredName, dob, gender, bloodType, address, guardianPhone: phone });
      } else {
        setErrMsg('Save failed. Please try again.');
      }
    } catch { setErrMsg('Network error.'); }
    setSaving(false);
  };

  const roStyle = { background: '#f7fafc', color: '#a0aec0', cursor: 'not-allowed' };

  // ── Academic Details CRUD (teacher only) ──
  const [acadRows, setAcadRows] = useState([
    { id: 1, label: 'Student ID',      value: studentData?.id || '—' },
    { id: 2, label: 'Current Major',   value: studentData?.classStudying || '—' },
    { id: 3, label: 'Graduation Year', value: '2027' },
  ]);
  const [acadModal, setAcadModal] = useState(false);
  const [editAcad, setEditAcad] = useState(null);
  const [acadForm, setAcadForm] = useState({ label: '', value: '' });
  const [acadSaving, setAcadSaving] = useState(false);
  const [acadSaved, setAcadSaved] = useState(false);

  // Load academic details from DB
  useEffect(() => {
    const sid = targetStudentId || studentData?.id;
    if (!sid) return;
    fetch(`${BASE}/api/dashboard-data?studentId=${sid}&type=acad_details`)
      .then(r => r.json())
      .then(d => { if (Array.isArray(d.content) && d.content.length > 0) setAcadRows(d.content); })
      .catch(() => {});
  }, [targetStudentId, studentData?.id]);

  const saveAcadDetails = async () => {
    const sid = targetStudentId || studentData?.id;
    if (!sid) return;
    setAcadSaving(true);
    await fetch(`${BASE}/api/dashboard-data`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentId: String(sid), type: 'acad_details', content: acadRows }),
    }).catch(() => {});
    setAcadSaving(false);
    setAcadSaved(true);
    setTimeout(() => setAcadSaved(false), 2000);
  };

  const openAddAcad = () => { setEditAcad(null); setAcadForm({ label: '', value: '' }); setAcadModal(true); };
  const openEditAcad = (r) => { setEditAcad(r.id); setAcadForm({ label: r.label, value: r.value }); setAcadModal(true); };
  const saveAcad = () => {
    if (!acadForm.label.trim()) return;
    if (editAcad) {
      setAcadRows(prev => prev.map(r => r.id === editAcad ? { ...r, ...acadForm } : r));
    } else {
      setAcadRows(prev => [...prev, { id: Date.now(), ...acadForm }]);
    }
    setAcadModal(false);
  };
  const deleteAcad = (id) => setAcadRows(prev => prev.filter(r => r.id !== id));

  return (
    <div className="st-wrapper">
      <div className="st-header"><h2>Profile & Academic Information</h2></div>

      <div className="st-card">
        <div className="st-body">

          {/* ── Avatar ── */}
          <p className="st-section-title">Avatar</p>
          <div className="st-avatar-row">
            <div className="st-avatar-preview">
              {avatarPreview ? (
                <img src={avatarPreview} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
              ) : studentData?.recentPhotoPath ? (
                <ProfileImage
                  src={`${BASE}/api/students/files?path=${encodeURIComponent(studentData.recentPhotoPath)}&t=${studentData.id}`}
                  fallback={studentData?.firstName?.charAt(0) || '?'}
                />
              ) : (
                studentData?.firstName?.charAt(0) || '?'
              )}
            </div>
            <div className="st-avatar-info">
              <label className="st-upload-label sd-wipe-btn sd-wipe-sidebar" style={{ cursor: 'pointer' }}>
                <span>Change Photo</span>
                <input type="file" accept="image/png, image/jpeg" style={{ display: 'none' }} onChange={handleAvatarChange} />
              </label>
              <p className="st-hint">JPG or PNG, max 2MB</p>
            </div>
          </div>

          <div className="st-divider" />

          {/* ── Preferred Name ── */}
          <p className="st-section-title">Preferred Name</p>
          <div className="st-field-group">
            <label className="st-field-label">Preferred Name / Pronouns</label>
            <input className="st-input" placeholder="e.g. Alex or he/him" value={preferredName} onChange={e => setPreferredName(e.target.value)} />
          </div>

          <div className="st-divider" />

          {/* ── Contact Info ── */}
          <p className="st-section-title">Contact Info</p>
          <div className="st-field-group">
            <label className="st-field-label">School Email (verified)</label>
            <input className="st-input" value={studentData?.email || '—'} disabled style={roStyle} />
          </div>
          <div className="st-field-group">
            <label className="st-field-label">Phone Number</label>
            <input className="st-input" placeholder="Enter phone number" value={phone} onChange={e => setPhone(e.target.value)} />
          </div>
          <div className="st-field-group">
            <label className="st-field-label">Date of Birth</label>
            <input className="st-input" type="date" value={dob} onChange={e => setDob(e.target.value)} />
          </div>
          <div className="st-field-group">
            <label className="st-field-label">Gender</label>
            <input className="st-input" placeholder="e.g. Male / Female" value={gender} onChange={e => setGender(e.target.value)} />
          </div>
          <div className="st-field-group">
            <label className="st-field-label">Blood Type</label>
            <input className="st-input" placeholder="e.g. O+" value={bloodType} onChange={e => setBloodType(e.target.value)} />
          </div>
          <div className="st-field-group">
            <label className="st-field-label">Address</label>
            <textarea className="st-textarea" placeholder="Enter address" value={address} onChange={e => setAddress(e.target.value)} />
          </div>

          <div className="st-divider" />

          {/* ── Academic Details ── */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <p className="st-section-title" style={{ margin: 0 }}>Academic Details</p>
            {userRole === 'teacher' && (
              <button onClick={openAddAcad} className="sd-wipe-btn" style={{ padding: '4px 12px', borderRadius: 6 }}><span>Add</span></button>
            )}
          </div>
          <div style={{ background: '#f7fafc', border: '1.5px solid #e2e8f0', borderRadius: 10, overflow: 'hidden' }}>
            {acadRows.map((r, i) => (
              <div key={r.id} style={{ display: 'flex', alignItems: 'center', padding: '12px 16px', borderBottom: i < acadRows.length - 1 ? '1px solid #e2e8f0' : 'none' }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#a0aec0', textTransform: 'uppercase', letterSpacing: '0.4px', width: 130, flexShrink: 0 }}>{r.label}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#1a202c' }}>{r.value}</span>
                {userRole === 'teacher' ? (
                  <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
                    <button className="sd-dl-edit-btn" onClick={() => openEditAcad(r)}>Edit</button>
                    <button className="sd-dl-del-btn" onClick={() => deleteAcad(r.id)}>✕</button>
                  </div>
                ) : (
                  <span style={{ marginLeft: 'auto', fontSize: 11, color: '#a0aec0', background: '#e2e8f0', padding: '2px 8px', borderRadius: 20 }}>Read only</span>
                )}
              </div>
            ))}
            {acadRows.length === 0 && (
              <p style={{ fontSize: 13, color: '#a0aec0', padding: '12px 16px', margin: 0 }}>No academic details yet.</p>
            )}
          </div>

          {/* Academic Details Modal (teacher only) */}
          {acadModal && (
            <div className="sd-modal-overlay" onClick={() => setAcadModal(false)}>
              <div className="sd-modal" onClick={e => e.stopPropagation()}>
                <h3>{editAcad ? 'Edit Academic Detail' : 'Add Academic Detail'}</h3>
                <label>Label</label>
                <input className="sd-modal-input" placeholder="e.g. Graduation Year" value={acadForm.label} onChange={e => setAcadForm(p => ({ ...p, label: e.target.value }))} />
                <label>Value</label>
                <input className="sd-modal-input" placeholder="e.g. 2027" value={acadForm.value} onChange={e => setAcadForm(p => ({ ...p, value: e.target.value }))} />
                <div className="sd-modal-actions">
                  <button className="sd-modal-save" onClick={saveAcad}>Save</button>
                  <button className="sd-modal-cancel" onClick={() => setAcadModal(false)}>Cancel</button>
                </div>
              </div>
            </div>
          )}

          {/* Save Academic Details — teacher only */}
          {userRole === 'teacher' && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 12, marginTop: 10 }}>
              {acadSaved && <span style={{ fontSize: 13, fontWeight: 600, color: '#276749' }}>Saved</span>}
              <button
                onClick={saveAcadDetails}
                disabled={acadSaving}
                className="sd-wipe-btn"
                style={{ padding: '8px 20px', borderRadius: 8, opacity: acadSaving ? 0.6 : 1 }}
              ><span>{acadSaving ? 'Saving...' : 'Save Academic Details'}</span></button>
            </div>
          )}

        </div>

        <div className="st-footer">
          {errMsg && <span className="st-saved-msg" style={{ color: '#1a202c' }}>{errMsg}</span>}
          {saved && <span className="st-saved-msg">Saved successfully</span>}
          <button className="st-save-btn sd-wipe-btn sd-wipe-sidebar" onClick={handleSave} disabled={saving}>
            <span>{saving ? 'Saving...' : 'Save Changes'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

const SUBJECTS_LIST = ['Mathematics', 'Science', 'English', 'History', 'Physics', 'Chemistry', 'Biology', 'Computer Science', 'Other'];

function FilesPage({ studentData, userRole, targetStudentId }) {
  const [submissions, setSubmissions] = useState([]);
  const [loadingSubs, setLoadingSubs] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('');
  const [title, setTitle] = useState('');
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState('');
  const [viewSub, setViewSub] = useState(null);
  const [approveModal, setApproveModal] = useState(null);
  const [approveForm, setApproveForm] = useState({ mark: '', remark: '' });

  const fetchSubmissions = async () => {
    setLoadingSubs(true);
    try {
      // teacher with selected student sees that student's submissions; without selection sees all
      const url = userRole === 'teacher'
        ? (targetStudentId ? `${BASE}/api/submissions?studentId=${targetStudentId}` : `${BASE}/api/submissions`)
        : `${BASE}/api/submissions?studentId=${studentData?.id}`;
      const res = await fetch(url);
      const data = await res.json();
      setSubmissions(Array.isArray(data) ? data : []);
    } catch { setSubmissions([]); }
    setLoadingSubs(false);
  };

  useEffect(() => {
    if (userRole === 'teacher' || studentData?.id) fetchSubmissions();
    else setLoadingSubs(false);
  }, [studentData?.id, userRole, targetStudentId]);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file || !subject || !category || !title) return;
    if (!studentData?.id) { setMsg('No student ID found. Cannot upload.'); return; }
    setUploading(true);
    const fd = new FormData();
    fd.append('studentId', studentData.id);
    fd.append('studentName', studentData.firstName);
    fd.append('subject', subject);
    fd.append('category', category);
    fd.append('title', title);
    fd.append('file', file);
    fd.append('originalName', file.name);
    try {
      const res = await fetch(`${BASE}/api/submissions`, { method: 'POST', body: fd });
      const data = await res.json();
      if (data.success) {
        setMsg('Uploaded successfully!');
        setShowForm(false);
        setSubject(''); setCategory(''); setTitle(''); setFile(null);
        fetchSubmissions();
      } else { setMsg('Upload failed.'); }
    } catch { setMsg('Network error.'); }
    setUploading(false);
    setTimeout(() => setMsg(''), 3000);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this submission?')) return;
    try {
      await fetch(`${BASE}/api/submissions/${id}`, { method: 'DELETE' });
      setSubmissions(prev => prev.filter(s => s.id !== id));
    } catch { alert('Delete failed.'); }
  };

  const handleApprove = async () => {
    if (!approveModal) return;
    try {
      await fetch(`${BASE}/api/submissions/${approveModal.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'seen', mark: approveForm.mark, remark: approveForm.remark }),
      });
      setSubmissions(prev => prev.map(s =>
        s.id === approveModal.id ? { ...s, status: 'seen', mark: approveForm.mark, remark: approveForm.remark } : s
      ));
      setApproveModal(null);
      setApproveForm({ mark: '', remark: '' });
    } catch { alert('Failed to approve.'); }
  };

  const statusStyle = (s) => {
    if (s === 'seen') return { background: '#1a202c', color: '#fff', border: 'none' };
    if (s === 'seeing') return { background: '#4a5568', color: '#fff', border: 'none' };
    return { background: '#f7fafc', color: '#2d3748', border: '1.5px solid #e2e8f0' };
  };

  const statusLabel = (s) => {
    if (s === 'seen') return 'Approved';
    if (s === 'seeing') return 'Reviewing';
    return 'Pending';
  };

  const grouped = submissions.reduce((acc, s) => {
    const key = userRole === 'teacher'
      ? (s.studentName || s.studentId || 'Unknown Student')
      : (s.subject || s.category || 'General');
    if (!acc[key]) acc[key] = [];
    acc[key].push(s);
    return acc;
  }, {});

  return (
    <div className="fl-wrapper">

      {/* View modal */}
      {viewSub && (
        <div className="sd-modal-overlay" onClick={() => setViewSub(null)}>
          <div className="sd-modal" onClick={e => e.stopPropagation()} style={{ width: 420, maxWidth: '95vw' }}>
            <h3 style={{ margin: 0, fontSize: 16, color: '#1a202c' }}>{viewSub.title}</h3>
            <p style={{ margin: 0, fontSize: 13, color: '#718096' }}>
              {viewSub.subject || viewSub.category} · {viewSub.uploadedAt?.slice(0, 10) || ''}
            </p>
            <span style={{ alignSelf: 'flex-start', fontSize: 12, fontWeight: 700, padding: '4px 12px', borderRadius: 20, ...statusStyle(viewSub.status) }}>{statusLabel(viewSub.status)}</span>
            {viewSub.mark && (
              <p style={{ margin: 0, fontSize: 13, color: '#2d3748' }}>
                <strong>Mark:</strong> {viewSub.mark}{viewSub.remark ? ` — ${viewSub.remark}` : ''}
              </p>
            )}
            <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
              <a className="sd-ql-btn" href={`${BASE}/api/submissions/file?path=${encodeURIComponent(viewSub.filePath)}`} target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>Open File</a>
              <button className="sd-ql-btn" onClick={() => setViewSub(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Approve modal (teacher only) */}
      {approveModal && (
        <div className="sd-modal-overlay" onClick={() => setApproveModal(null)}>
          <div className="sd-modal" onClick={e => e.stopPropagation()}>
            <h3>Approve Submission</h3>
            <p style={{ margin: 0, fontSize: 13, color: '#718096' }}>{approveModal.title} — {approveModal.studentName || approveModal.studentId}</p>
            <label>Mark / Grade</label>
            <input className="sd-modal-input" placeholder="e.g. 85/100 or A+" value={approveForm.mark} onChange={e => setApproveForm(p => ({ ...p, mark: e.target.value }))} />
            <label>Feedback (optional)</label>
            <textarea className="sd-modal-input" placeholder="e.g. Good work!" rows={3} value={approveForm.remark} onChange={e => setApproveForm(p => ({ ...p, remark: e.target.value }))} style={{ resize: 'vertical' }} />
            <div className="sd-modal-actions">
              <button className="sd-modal-save" onClick={handleApprove}>Approve</button>
              <button className="sd-modal-cancel" onClick={() => setApproveModal(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      <div className="fl-header-row">
        <div>
          <h2>Files & Submissions</h2>
          {userRole === 'teacher'
            ? <p style={{ margin: 0, fontSize: 13, color: '#718096' }}>All student submissions</p>
            : (() => {
                const pending = submissions.filter(s => s.status === 'pending' || !s.status).length;
                return pending > 0
                  ? <p style={{ margin: 0, fontSize: 13, color: '#856404', fontWeight: 600 }}>{pending} submission{pending > 1 ? 's' : ''} awaiting teacher approval</p>
                  : null;
              })()
          }
        </div>
        {userRole === 'student' && (
          <button className="sd-ql-btn" onClick={() => setShowForm(f => !f)}>
            {showForm ? 'Cancel' : 'New Submission'}
          </button>
        )}
      </div>

      {msg && <p style={{ fontSize: 13, color: '#2d3748', fontWeight: 600 }}>{msg}</p>}

      {/* Upload form — students only */}
      {showForm && userRole === 'student' && (
        <form onSubmit={handleUpload} style={{ background: '#fff', borderRadius: 12, padding: '20px 24px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <p style={{ margin: 0, fontWeight: 700, fontSize: 15, color: '#1a202c' }}>Submit a File</p>
          <select className="st-input" value={subject} onChange={e => setSubject(e.target.value)} required>
            <option value="">Select Subject</option>
            {SUBJECTS_LIST.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <input className="st-input" placeholder="Category (e.g. Assignment, Project)" value={category} onChange={e => setCategory(e.target.value)} required />
          <input className="st-input" placeholder="Title" value={title} onChange={e => setTitle(e.target.value)} required />
          <input type="file" onChange={e => setFile(e.target.files[0])} required />
          <button type="submit" className="sd-ql-btn" disabled={uploading} style={{ alignSelf: 'flex-start' }}>
            {uploading ? 'Uploading...' : 'Submit'}
          </button>
        </form>
      )}

      {/* Registered docs — students only */}
      {userRole === 'student' && (
        <>
          <p className="fl-section-label">Registered Documents</p>
          <div className="fl-grid">
            <div className="fl-card">
              <div className="fl-file-icon">PDF</div>
              <div className="fl-file-info">
                <span className="fl-file-name">Student ID Document</span>
                <span className="fl-file-meta">{studentData?.studentIdDocPath ? 'Uploaded' : 'Not uploaded'}</span>
              </div>
              {studentData?.studentIdDocPath && (
                <a className="sd-ql-btn" href={`${BASE}/api/students/files?path=${encodeURIComponent(studentData.studentIdDocPath)}`} target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>View</a>
              )}
            </div>
            <div className="fl-card">
              <div className="fl-file-icon">IMG</div>
              <div className="fl-file-info">
                <span className="fl-file-name">Recent Photo</span>
                <span className="fl-file-meta">{studentData?.recentPhotoPath ? 'Uploaded' : 'Not uploaded'}</span>
              </div>
              {studentData?.recentPhotoPath && (
                <a className="sd-ql-btn" href={`${BASE}/api/students/files?path=${encodeURIComponent(studentData.recentPhotoPath)}`} target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>View</a>
              )}
            </div>
          </div>
        </>
      )}

      <p className="fl-section-label" style={{ marginTop: 8 }}>Submissions</p>
      {loadingSubs ? (
        <p style={{ fontSize: 13, color: '#718096' }}>Loading submissions...</p>
      ) : submissions.length === 0 ? (
        <p style={{ fontSize: 13, color: '#a0aec0' }}>No submissions yet.</p>
      ) : (
        Object.entries(grouped).map(([groupName, subs]) => (
          <div key={groupName} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#1a202c', paddingBottom: 6, borderBottom: '1.5px solid #e2e8f0' }}>
              {groupName}
            </p>
            <div className="fl-grid">
              {subs.map(s => (
                <div key={s.id} className="fl-card" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 8 }}>
                  <div style={{ display: 'flex', width: '100%', alignItems: 'center', gap: 10 }}>
                    <div className="fl-file-icon" style={{ fontSize: 10 }}>{s.category?.slice(0,4).toUpperCase() || 'FILE'}</div>
                    <div className="fl-file-info">
                      <span className="fl-file-name">{s.title}</span>
                      <span className="fl-file-meta">
                        {userRole === 'teacher' ? `${s.subject || s.category} · ${s.uploadedAt?.slice(0,10) || ''}` : `${s.category} · ${s.uploadedAt?.slice(0,10) || ''}`}
                      </span>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, whiteSpace: 'nowrap', ...statusStyle(s.status) }}>{statusLabel(s.status)}</span>
                  </div>
                  {s.mark && (
                    <div style={{ fontSize: 12, color: '#4a5568', paddingLeft: 4 }}>
                      <strong>Mark:</strong> {s.mark}{s.remark ? ` — ${s.remark}` : ''}
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <button className="sd-ql-btn" onClick={() => setViewSub(s)}>View</button>
                    <a className="sd-ql-btn" href={`${BASE}/api/submissions/file?path=${encodeURIComponent(s.filePath)}`} target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>Open</a>
                    {userRole === 'teacher' && s.status !== 'seen' && (
                      <button
                        className="sd-ql-btn"
                        onClick={() => { setApproveModal(s); setApproveForm({ mark: s.mark || '', remark: s.remark || '' }); }}
                      >Approve</button>
                    )}
                    {userRole === 'teacher' && s.status === 'seen' && (
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#276749', padding: '5px 10px', border: '1.5px solid #276749', borderRadius: 6 }}>Approved</span>
                    )}
                    {userRole === 'student' && (
                      <button className="sd-ql-btn" onClick={() => handleDelete(s.id)}>Delete</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

const INIT_SCHEDULE = [];
const INIT_DEADLINES = [];

function toMinutes(timeStr) {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

function nowMinutes() {
  const n = new Date();
  return n.getHours() * 60 + n.getMinutes();
}

const SEMESTER_FEES = [];

function FreePaymentsPage({ onBack, userRole, targetStudentId, studentData }) {
  const [fees, setFees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [newFee, setNewFee] = useState({ name: '', amount: '' });
  const [showAdd, setShowAdd] = useState(false);

  const feesStudentId = userRole === 'teacher' ? targetStudentId : studentData?.id;

  const fetchFees = async () => {
    if (!feesStudentId) { setLoading(false); return; }
    try {
      const res = await fetch(`${BASE}/api/dashboard-data?studentId=${feesStudentId}&type=fees`);
      const data = await res.json();
      setFees(Array.isArray(data.content) ? data.content : []);
    } catch { setFees([]); }
    setLoading(false);
  };

  useEffect(() => { fetchFees(); }, [feesStudentId]);

  const saveFees = async (updated) => {
    if (!feesStudentId) {
      alert('Please select a student from the dropdown before saving.');
      return;
    }
    await fetch(`${BASE}/api/dashboard-data`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentId: String(feesStudentId), type: 'fees', content: updated }),
    }).catch(() => {});
  };

  const updateStatus = (id, val) => {
    setFees(prev => prev.map(f => f.id === id ? { ...f, studentStatus: val } : f));
  };

  const approveFee = (id) => {
    setFees(prev => prev.map(f => f.id === id ? { ...f, approvedByTeacher: true } : f));
  };

  const handleSave = async () => {
    await saveFees(fees);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const addFee = () => {
    if (!newFee.name.trim() || !newFee.amount.trim()) return;
    setFees(prev => [...prev, { id: Date.now(), name: newFee.name, amount: newFee.amount, studentStatus: 'Pending', approvedByTeacher: false }]);
    setNewFee({ name: '', amount: '' });
    setShowAdd(false);
  };

  const deleteFee = (id) => {
    setFees(prev => prev.filter(f => f.id !== id));
  };

  const th = { textAlign: 'left', padding: '8px 12px', fontSize: 11, fontWeight: 700, color: '#a0aec0', textTransform: 'uppercase', letterSpacing: '0.4px', borderBottom: '1px solid #e2e8f0' };
  const td = { padding: '10px 12px', color: '#2d3748', fontWeight: 500 };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <button onClick={onBack} className="sd-wipe-btn" style={{ padding: '8px 18px', borderRadius: 8 }}><span>Back</span></button>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: '#1a202c', margin: 0 }}>Fee Payments</h2>
        </div>
        {userRole === 'teacher' && (
          <button onClick={() => setShowAdd(s => !s)} className="sd-wipe-btn" style={{ padding: '8px 18px', borderRadius: 8 }}><span>{showAdd ? 'Cancel' : 'Add Fee'}</span></button>
        )}
      </div>

      {showAdd && userRole === 'teacher' && (
        <div style={{ background: '#fff', borderRadius: 12, padding: '16px 20px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#4a5568' }}>Fee Name</label>
            <input className="sd-modal-input" placeholder="e.g. Tuition Fee" value={newFee.name} onChange={e => setNewFee(p => ({ ...p, name: e.target.value }))} style={{ width: 180 }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#4a5568' }}>Amount</label>
            <input className="sd-modal-input" placeholder="e.g. ₹5000" value={newFee.amount} onChange={e => setNewFee(p => ({ ...p, amount: e.target.value }))} style={{ width: 120 }} />
          </div>
          <button onClick={addFee} className="sd-wipe-btn" style={{ padding: '9px 20px', borderRadius: 8 }}><span>Add</span></button>
        </div>
      )}

      <div style={{ background: '#fff', borderRadius: 14, padding: '20px 24px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
        {loading ? (
          <p style={{ fontSize: 13, color: '#a0aec0' }}>Loading...</p>
        ) : fees.length === 0 ? (
          <p style={{ fontSize: 13, color: '#a0aec0' }}>No fee records yet.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#f7fafc' }}>
                <th style={th}>Fee Type</th>
                <th style={th}>Amount</th>
                <th style={th}>Student Status</th>
                <th style={th}>Approval</th>
                {userRole === 'teacher' && <th style={th}>Action</th>}
              </tr>
            </thead>
            <tbody>
              {fees.map(fee => (
                <tr key={fee.id} style={{ borderBottom: '1px solid #f0f4f8' }}>
                  <td style={td}>{fee.name}</td>
                  <td style={{ ...td, color: '#4a5568' }}>{fee.amount}</td>
                  <td style={td}>
                    <select
                      value={fee.studentStatus || 'Pending'}
                      onChange={e => updateStatus(fee.id, e.target.value)}
                      style={{ padding: '5px 10px', fontSize: 12, fontWeight: 700, borderRadius: 8, border: '1.5px solid #e2e8f0', background: fee.studentStatus === 'Paid' ? '#e2e8f0' : '#fff', color: '#1a202c', outline: 'none', cursor: 'pointer' }}
                    >
                      <option value="Paid">Paid</option>
                      <option value="Pending">Pending</option>
                    </select>
                  </td>
                  <td style={td}>
                    {fee.approvedByTeacher ? (
                      <span style={{ fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: '#2d3748', color: '#fff' }}>Approved</span>
                    ) : (
                      <span style={{ fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: '#e2e8f0', color: '#718096' }}>Pending</span>
                    )}
                  </td>
                  {userRole === 'teacher' && (
                    <td style={td}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {!fee.approvedByTeacher && fee.studentStatus === 'Paid' && (
                          <button onClick={() => approveFee(fee.id)} className="sd-wipe-btn" style={{ padding: '5px 12px', borderRadius: 6 }}><span>Approve</span></button>
                        )}
                        <button onClick={() => deleteFee(fee.id)} className="sd-wipe-btn" style={{ padding: '5px 10px', borderRadius: 6 }}><span>✕</span></button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 14 }}>
        {saved && <span style={{ fontSize: 13, fontWeight: 600, color: '#2d3748' }}>Saved successfully</span>}
        <button onClick={handleSave} className="sd-wipe-btn sd-wipe-content" style={{ padding: '9px 24px' }}><span>Save Changes</span></button>
      </div>
    </div>
  );
}

// ── Grades data ──
const GRADE_DATA = [];

function GradesPage({ studentData, userRole, targetStudentId }) {
  const [activeSem, setActiveSem] = useState(0);
  const [calcRows, setCalcRows] = useState([
    { id: 1, subject: 'Data Structures', score: '', max: '100', grade: 'A' },
    { id: 2, subject: 'Mathematics',     score: '', max: '100', grade: 'A' },
  ]);
  const [calcGpa, setCalcGpa] = useState(null);
  const [gradesSaving, setGradesSaving] = useState(false);
  const [gradesSaved, setGradesSaved]   = useState(false);
  const [savedCgpa, setSavedCgpa]       = useState(null);

  // Load GPA rows + saved CGPA from DB
  useEffect(() => {
    const sid = userRole === 'teacher' ? targetStudentId : studentData?.id;
    if (!sid) return;
    fetch(`${BASE}/api/dashboard-data?studentId=${sid}&type=gpa_calc`)
      .then(r => r.json())
      .then(d => {
        if (d.content && !Array.isArray(d.content) && d.content.rows) {
          if (d.content.rows.length > 0) setCalcRows(d.content.rows);
          if (d.content.cgpa !== undefined) setSavedCgpa(d.content.cgpa);
        } else if (Array.isArray(d.content) && d.content.length > 0) {
          setCalcRows(d.content);
        }
      })
      .catch(() => {});
  }, [targetStudentId, studentData?.id, userRole]);

  const saveGrades = async () => {
    const sid = userRole === 'teacher' ? targetStudentId : studentData?.id;
    if (!sid) {
      alert('No student ID found.');
      return;
    }
    const valid = calcRows.filter(r => r.score !== '' && !isNaN(r.score));
    const cgpaVal = valid.length
      ? parseFloat((valid.reduce((sum, r) => sum + (gradePoints[r.grade] || 0), 0) / valid.length).toFixed(2))
      : null;
    setGradesSaving(true);
    await fetch(`${BASE}/api/dashboard-data`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentId: String(sid), type: 'gpa_calc', content: { rows: calcRows, cgpa: cgpaVal } }),
    }).catch(() => {});
    setGradesSaving(false);
    setSavedCgpa(cgpaVal);
    setGradesSaved(true);
    setTimeout(() => setGradesSaved(false), 2500);
  };

  const gradePoints = { 'O': 10, 'A+': 9, 'A': 8, 'B+': 7, 'B': 6, 'C': 5, 'F': 0 };

  const scoreToGrade = (score, max) => {
    const pct = (score / max) * 100;
    if (pct >= 95) return 'O';
    if (pct >= 90) return 'A+';
    if (pct >= 80) return 'A';
    if (pct >= 70) return 'B+';
    if (pct >= 60) return 'B';
    if (pct >= 50) return 'C';
    return 'F';
  };

  const calcResult = () => {
    const valid = calcRows.filter(r => r.score !== '' && !isNaN(r.score));
    if (!valid.length) return;
    const total = valid.reduce((sum, r) => sum + (gradePoints[r.grade] || 0), 0);
    setCalcGpa((total / valid.length).toFixed(2));
  };

  const updateCalcRow = (id, field, val) => {
    setCalcRows(prev => prev.map(r => {
      if (r.id !== id) return r;
      const updated = { ...r, [field]: val };
      if (field === 'score' || field === 'max') {
        const s = field === 'score' ? val : r.score;
        const m = field === 'max'   ? val : r.max;
        if (s !== '' && m !== '' && !isNaN(s) && !isNaN(m) && Number(m) > 0)
          updated.grade = scoreToGrade(Number(s), Number(m));
      }
      return updated;
    }));
    setCalcGpa(null);
  };

  const sem = GRADE_DATA[activeSem];

  const th = { textAlign: 'left', padding: '9px 12px', fontSize: 11, fontWeight: 700, color: '#a0aec0', textTransform: 'uppercase', letterSpacing: '0.4px', borderBottom: '1px solid #e2e8f0', background: '#f7fafc' };
  const td = { padding: '10px 12px', fontSize: 13, color: '#2d3748', borderBottom: '1px solid #f0f4f8', verticalAlign: 'top' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* Header */}
      <div>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: '#1a202c', margin: '0 0 4px 0' }}>Academic Report Card</h2>
        <p style={{ fontSize: 14, color: '#718096', margin: 0 }}>{studentData?.firstName || 'Student'} &mdash; {studentData?.classStudying || '10A'}</p>
      </div>

      {/* Semester tabs */}
      <div style={{ display: 'flex', gap: 2, borderBottom: '1.5px solid #e2e8f0', flexWrap: 'wrap' }}>
        {GRADE_DATA.map((s, i) => (
          <button key={i} onClick={() => setActiveSem(i)} style={{
            padding: '11px 20px', background: 'none', border: 'none',
            borderBottom: activeSem === i ? '2.5px solid #1a202c' : '2.5px solid transparent',
            fontSize: 13, fontWeight: 600,
            color: activeSem === i ? '#1a202c' : '#a0aec0',
            cursor: 'pointer', marginBottom: -1.5, whiteSpace: 'nowrap',
          }}>{s.sem}</button>
        ))}
        <button onClick={() => setActiveSem(GRADE_DATA.length)} style={{
          padding: '11px 20px', background: 'none', border: 'none',
          borderBottom: activeSem === GRADE_DATA.length ? '2.5px solid #1a202c' : '2.5px solid transparent',
          fontSize: 13, fontWeight: 600,
          color: activeSem === GRADE_DATA.length ? '#1a202c' : '#a0aec0',
          cursor: 'pointer', marginBottom: -1.5,
        }}>GPA Calculator</button>
      </div>

      {/* GPA Calculator tab */}
      {activeSem === GRADE_DATA.length && (
        <div style={{ background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 12, padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: '#a0aec0', textTransform: 'uppercase', letterSpacing: '0.5px', margin: 0, paddingBottom: 10, borderBottom: '1px solid #e2e8f0' }}>GPA Calculator</p>
          <p style={{ fontSize: 12, color: '#a0aec0', margin: 0 }}>Enter your expected scores to calculate your projected GPA. Grade scale: O=10, A+=9, A=8, B+=7, B=6, C=5, F=0</p>

          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr>
                <th style={th}>Subject</th>
                <th style={th}>Score</th>
                <th style={th}>Max</th>
                <th style={th}>Grade</th>
                <th style={th}>Points</th>
                <th style={th}></th>
              </tr>
            </thead>
            <tbody>
              {calcRows.map(r => (
                <tr key={r.id}>
                  <td style={td}>
                    <input
                      value={r.subject}
                      onChange={e => updateCalcRow(r.id, 'subject', e.target.value)}
                      placeholder="Subject name"
                      style={{ width: '100%', padding: '6px 10px', fontSize: 13, border: '1.5px solid #e2e8f0', borderRadius: 6, outline: 'none', background: '#f7fafc', boxSizing: 'border-box' }}
                    />
                  </td>
                  <td style={td}>
                    <input
                      value={r.score}
                      onChange={e => updateCalcRow(r.id, 'score', e.target.value)}
                      placeholder="0"
                      style={{ width: 70, padding: '6px 10px', fontSize: 13, border: '1.5px solid #e2e8f0', borderRadius: 6, outline: 'none', background: '#f7fafc' }}
                    />
                  </td>
                  <td style={td}>
                    <input
                      value={r.max}
                      onChange={e => updateCalcRow(r.id, 'max', e.target.value)}
                      placeholder="100"
                      style={{ width: 70, padding: '6px 10px', fontSize: 13, border: '1.5px solid #e2e8f0', borderRadius: 6, outline: 'none', background: '#f7fafc' }}
                    />
                  </td>
                  <td style={td}>
                    <select
                      value={r.grade}
                      onChange={e => { updateCalcRow(r.id, 'grade', e.target.value); setCalcGpa(null); }}
                      style={{ padding: '6px 10px', fontSize: 13, border: '1.5px solid #e2e8f0', borderRadius: 6, outline: 'none', background: '#f7fafc', cursor: 'pointer' }}
                    >
                      {Object.keys(gradePoints).map(g => <option key={g}>{g}</option>)}
                    </select>
                  </td>
                  <td style={{ ...td, fontWeight: 700, color: '#1a202c' }}>{gradePoints[r.grade]}</td>
                  <td style={td}>
                    <button
                      onClick={() => { setCalcRows(prev => prev.filter(x => x.id !== r.id)); setCalcGpa(null); }}
                      style={{ padding: '5px 10px', background: '#f7fafc', border: '1.5px solid #e2e8f0', borderRadius: 6, fontSize: 12, fontWeight: 700, color: '#4a5568', cursor: 'pointer' }}
                    >Remove</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            {(userRole === 'teacher' || userRole === 'student') && (
              <button
                className="sd-wipe-btn sd-wipe-content"
                onClick={() => setCalcRows(prev => [...prev, { id: Date.now(), subject: '', score: '', max: '100', grade: 'A' }])}
                style={{ padding: '9px 18px', borderRadius: 8 }}
              ><span>Add Subject</span></button>
            )}
            <button
              className="sd-wipe-btn sd-wipe-content"
              onClick={calcResult}
              style={{ padding: '9px 20px', borderRadius: 8 }}
            ><span>Calculate GPA</span></button>
            {calcGpa !== null && (
              <span style={{ fontSize: 15, fontWeight: 700, color: '#1a202c' }}>Projected GPA: {calcGpa} / 10</span>
            )}
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12 }}>
              {gradesSaved && <span style={{ fontSize: 13, fontWeight: 600, color: '#276749' }}>&#10003; Saved successfully</span>}
              <button
                className="sd-wipe-btn sd-wipe-content"
                onClick={saveGrades}
                disabled={gradesSaving}
                style={{ padding: '9px 24px', borderRadius: 8, opacity: gradesSaving ? 0.6 : 1 }}
              ><span>{gradesSaving ? 'Saving...' : 'Save Grades'}</span></button>
            </div>
          </div>

          {/* Saved CGPA display */}
          {savedCgpa !== null && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 20px', background: '#f7fafc', border: '1.5px solid #e2e8f0', borderRadius: 10, marginTop: 4 }}>
              <div>
                <p style={{ fontSize: 11, fontWeight: 700, color: '#a0aec0', textTransform: 'uppercase', letterSpacing: '0.4px', margin: '0 0 4px 0' }}>Saved CGPA</p>
                <p style={{ fontSize: 26, fontWeight: 700, color: '#1a202c', margin: 0 }}>{savedCgpa} <span style={{ fontSize: 13, color: '#a0aec0', fontWeight: 400 }}>/ 10</span></p>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ height: 8, background: '#e2e8f0', borderRadius: 99, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${(savedCgpa / 10) * 100}%`, background: '#1a202c', borderRadius: 99 }} />
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Semester transcript */}
      {activeSem < GRADE_DATA.length && (
        <>
          {/* GPA summary bar */}
          <div style={{ background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 12, padding: '16px 24px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#a0aec0', textTransform: 'uppercase', letterSpacing: '0.4px', margin: '0 0 4px 0' }}>Semester GPA</p>
              <p style={{ fontSize: 28, fontWeight: 700, color: '#1a202c', margin: 0 }}>{sem.gpa} <span style={{ fontSize: 13, color: '#a0aec0', fontWeight: 400 }}>/ 10</span></p>
            </div>
            <div style={{ flex: 1, minWidth: 160 }}>
              <div style={{ height: 8, background: '#e2e8f0', borderRadius: 99, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${(sem.gpa / 10) * 100}%`, background: '#1a202c', borderRadius: 99 }} />
              </div>
            </div>
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#a0aec0', textTransform: 'uppercase', letterSpacing: '0.4px', margin: '0 0 4px 0' }}>Subjects</p>
              <p style={{ fontSize: 18, fontWeight: 700, color: '#1a202c', margin: 0 }}>{sem.subjects.length}</p>
            </div>
          </div>

          {/* Per-subject cards */}
          {sem.subjects.map(sub => {
            const attPct = Math.round((sub.attended / sub.total) * 100);
            const avgScore = Math.round(sub.assignments.reduce((s, a) => s + (a.score / a.max) * 100, 0) / sub.assignments.length);
            return (
              <div key={sub.name} style={{ background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 12, padding: '20px 24px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', gap: 16 }}>

                {/* Subject header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', paddingBottom: 12, borderBottom: '1px solid #e2e8f0', flexWrap: 'wrap', gap: 8 }}>
                  <div>
                    <p style={{ fontSize: 15, fontWeight: 700, color: '#1a202c', margin: '0 0 3px 0' }}>{sub.name}</p>
                    <p style={{ fontSize: 12, color: '#718096', margin: 0 }}>{sub.teacher}</p>
                  </div>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, border: '1.5px solid #e2e8f0', background: '#f7fafc', color: '#2d3748' }}>Avg: {avgScore}%</span>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, border: '1.5px solid #e2e8f0', background: attPct >= 75 ? '#1a202c' : '#f7fafc', color: attPct >= 75 ? '#fff' : '#2d3748' }}>Attendance: {attPct}%</span>
                  </div>
                </div>

                {/* Attendance bar */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#a0aec0', width: 80, flexShrink: 0 }}>Attendance</span>
                  <div style={{ flex: 1, height: 7, background: '#e2e8f0', borderRadius: 99, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${attPct}%`, background: '#1a202c', borderRadius: 99 }} />
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#1a202c', width: 60, textAlign: 'right' }}>{sub.attended}/{sub.total} ({attPct}%)</span>
                </div>

                {/* Assignments table */}
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr>
                      <th style={th}>Assignment / Exam</th>
                      <th style={th}>Score</th>
                      <th style={th}>Grade</th>
                      <th style={th}>Professor Feedback</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sub.assignments.map((a, i) => {
                      const g = scoreToGrade(a.score, a.max);
                      return (
                        <tr key={i}>
                          <td style={{ ...td, fontWeight: 600, color: '#1a202c' }}>{a.title}</td>
                          <td style={td}>
                            <span style={{ fontWeight: 700 }}>{a.score}</span>
                            <span style={{ color: '#a0aec0' }}>/{a.max}</span>
                            <span style={{ marginLeft: 6, fontSize: 11, color: '#718096' }}>({Math.round((a.score / a.max) * 100)}%)</span>
                          </td>
                          <td style={td}>
                            <span style={{ fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: g === 'O' || g === 'A+' ? '#1a202c' : '#f7fafc', color: g === 'O' || g === 'A+' ? '#fff' : '#2d3748', border: '1.5px solid #e2e8f0' }}>{g}</span>
                          </td>
                          <td style={{ ...td, color: '#718096', fontStyle: 'italic' }}>{a.feedback}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            );
          })}
        </>
      )}
    </div>
  );
}

const CLASS_INFO = { class: '', section: '', academicYear: '', strength: 0 };
const SUBJECTS = [];
const ACADEMIC_SCHEDULE = [];
const SYLLABUS = [];
const MATERIALS = [];

const BW = {
  card:    { background: '#ffffff', border: '1.5px solid #e2e8f0', borderRadius: 12, padding: '20px 24px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' },
  th:      { textAlign: 'left', padding: '9px 12px', fontSize: 11, fontWeight: 700, color: '#a0aec0', textTransform: 'uppercase', letterSpacing: '0.4px', borderBottom: '1px solid #e2e8f0', background: '#f7fafc' },
  td:      { padding: '10px 12px', fontSize: 13, color: '#2d3748', borderBottom: '1px solid #f0f4f8' },
  label:   { fontSize: 11, fontWeight: 700, color: '#a0aec0', textTransform: 'uppercase', letterSpacing: '0.4px' },
  val:     { fontSize: 13, color: '#1a202c', fontWeight: 500 },
  pill:    { fontSize: 11, fontWeight: 700, padding: '2px 10px', borderRadius: 20, border: '1.5px solid #e2e8f0', background: '#f7fafc', color: '#2d3748' },
  secHead: { fontSize: 13, fontWeight: 700, color: '#a0aec0', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 12px 0', paddingBottom: 8, borderBottom: '1px solid #e2e8f0' },
  btn:     { padding: '9px 20px', background: '#1a202c', color: '#fff', fontSize: 13, fontWeight: 600, border: 'none', borderRadius: 8, cursor: 'pointer' },
  outBtn:  { padding: '8px 18px', background: '#fff', color: '#1a202c', fontSize: 13, fontWeight: 600, border: '1.5px solid #1a202c', borderRadius: 8, cursor: 'pointer' },
};

function CourseHubPage({ studentData, userRole, targetStudentId }) {
  const [tab, setTab] = useState('timetable');
  const [notes, setNotes] = useState('');
  const [notesSaved, setNotesSaved] = useState(false);

  // ── Per-tab save state ──
  const [classSaving, setClassSaving] = useState(false);
  const [classSaved, setClassSaved]   = useState(false);

  const saveTabToDB = async (type, content) => {
    if (!targetStudentId) return;
    await fetch(`${BASE}/api/dashboard-data`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentId: String(targetStudentId), type, content }),
    }).catch(() => {});
  };

  const handleClassSave = async () => {
    if (!targetStudentId) {
      alert('Please select a student from the dropdown before saving.');
      return;
    }
    setClassSaving(true);
    if (tab === 'timetable')  await saveTabToDB('timetable',     timetable);
    if (tab === 'schedule')   await saveTabToDB('acad_schedule', acadSchedule);
    if (tab === 'strength')   await saveTabToDB('class_strength', { info: classInfo, subjects: strengthSubjects });
    if (tab === 'syllabus')   await saveTabToDB('syllabus',      syllabus);
    if (tab === 'materials')  await saveTabToDB('materials',     materials);
    if (tab === 'notes')      await saveTabToDB('note',          notes);
    setClassSaving(false);
    setClassSaved(true);
    setTimeout(() => setClassSaved(false), 2500);
  };

  // ── Timetable CRUD ──
  const [timetable, setTimetable] = useState([]);
  const [ttModal, setTtModal] = useState(false);
  const [editTt, setEditTt] = useState(null);
  const [ttForm, setTtForm] = useState({ subject: '', teacher: '', days: '', time: '', room: '' });

  useEffect(() => {
    if (!targetStudentId) return;
    fetch(`${BASE}/api/dashboard-data?studentId=${targetStudentId}&type=timetable`)
      .then(r => r.json())
      .then(d => { if (Array.isArray(d.content)) setTimetable(d.content); else setTimetable([]); })
      .catch(() => {});
  }, [targetStudentId]);

  const openAddTt = () => { setEditTt(null); setTtForm({ subject: '', teacher: '', days: '', time: '', room: '' }); setTtModal(true); };
  const openEditTt = (row) => { setEditTt(row.id); setTtForm({ subject: row.subject, teacher: row.teacher, days: row.days, time: row.time, room: row.room }); setTtModal(true); };

  const saveTt = () => {
    if (!ttForm.subject.trim()) return;
    const updated = editTt
      ? timetable.map(r => r.id === editTt ? { ...r, ...ttForm } : r)
      : [...timetable, { id: Date.now(), ...ttForm }];
    setTimetable(updated);
    setTtModal(false);
  };

  const deleteTt = (id) => setTimetable(prev => prev.filter(r => r.id !== id));

  // ── Academic Schedule CRUD ──
  const [acadSchedule, setAcadSchedule] = useState([]);
  const [asModal, setAsModal] = useState(false);
  const [editAs, setEditAs] = useState(null);
  const [asForm, setAsForm] = useState({ date: '', event: '', type: 'Event' });

  useEffect(() => {
    if (!targetStudentId) return;
    fetch(`${BASE}/api/dashboard-data?studentId=${targetStudentId}&type=acad_schedule`)
      .then(r => r.json())
      .then(d => { if (Array.isArray(d.content)) setAcadSchedule(d.content); else setAcadSchedule([]); })
      .catch(() => {});
  }, [targetStudentId]);

  const openAddAs = () => { setEditAs(null); setAsForm({ date: '', event: '', type: 'Event' }); setAsModal(true); };
  const openEditAs = (row) => { setEditAs(row.id); setAsForm({ date: row.date, event: row.event, type: row.type }); setAsModal(true); };

  const saveAs = () => {
    if (!asForm.event.trim()) return;
    const updated = editAs
      ? acadSchedule.map(r => r.id === editAs ? { ...r, ...asForm } : r)
      : [...acadSchedule, { id: Date.now(), ...asForm }];
    setAcadSchedule(updated);
    setAsModal(false);
  };

  const deleteAs = (id) => setAcadSchedule(prev => prev.filter(r => r.id !== id));

  // ── Class Strength CRUD ──
  const [classInfo, setClassInfo] = useState({ class: '', section: '', academicYear: '', strength: '' });
  const [strengthSubjects, setStrengthSubjects] = useState([]);
  const [csInfoModal, setCsInfoModal] = useState(false);
  const [csInfoForm, setCsInfoForm] = useState({ class: '', section: '', academicYear: '', strength: '' });
  const [csSubModal, setCsSubModal] = useState(false);
  const [editCsSub, setEditCsSub] = useState(null);
  const [csSubForm, setCsSubForm] = useState({ name: '', teacher: '' });

  useEffect(() => {
    if (!targetStudentId) return;
    fetch(`${BASE}/api/dashboard-data?studentId=${targetStudentId}&type=class_strength`)
      .then(r => r.json())
      .then(d => {
        if (d.content) {
          if (d.content.info) setClassInfo(d.content.info);
          if (Array.isArray(d.content.subjects)) setStrengthSubjects(d.content.subjects);
        }
      })
      .catch(() => {});
  }, [targetStudentId]);

  const saveClassInfo = () => { setClassInfo(csInfoForm); setCsInfoModal(false); };

  const openAddCsSub = () => { setEditCsSub(null); setCsSubForm({ name: '', teacher: '' }); setCsSubModal(true); };
  const openEditCsSub = (s) => { setEditCsSub(s.id); setCsSubForm({ name: s.name, teacher: s.teacher }); setCsSubModal(true); };

  const saveCsSub = () => {
    if (!csSubForm.name.trim()) return;
    const updated = editCsSub
      ? strengthSubjects.map(s => s.id === editCsSub ? { ...s, ...csSubForm } : s)
      : [...strengthSubjects, { id: Date.now(), ...csSubForm }];
    setStrengthSubjects(updated);
    setCsSubModal(false);
  };

  const deleteCsSub = (id) => setStrengthSubjects(prev => prev.filter(s => s.id !== id));

  // ── Syllabus CRUD ──
  const [syllabus, setSyllabus] = useState([]);
  const [sylModal, setSylModal] = useState(false);
  const [editSyl, setEditSyl] = useState(null);
  const [sylForm, setSylForm] = useState({ subject: '', units: '' });

  useEffect(() => {
    if (!targetStudentId) return;
    fetch(`${BASE}/api/dashboard-data?studentId=${targetStudentId}&type=syllabus`)
      .then(r => r.json())
      .then(d => { if (Array.isArray(d.content)) setSyllabus(d.content); else setSyllabus([]); })
      .catch(() => {});
  }, [targetStudentId]);

  const openAddSyl = () => { setEditSyl(null); setSylForm({ subject: '', units: '' }); setSylModal(true); };
  const openEditSyl = (s) => { setEditSyl(s.id); setSylForm({ subject: s.subject, units: s.units.join('\n') }); setSylModal(true); };

  const saveSyl = () => {
    if (!sylForm.subject.trim()) return;
    const units = sylForm.units.split('\n').map(u => u.trim()).filter(Boolean);
    const updated = editSyl
      ? syllabus.map(s => s.id === editSyl ? { ...s, subject: sylForm.subject, units } : s)
      : [...syllabus, { id: Date.now(), subject: sylForm.subject, units }];
    setSyllabus(updated);
    setSylModal(false);
  };

  const deleteSyl = (id) => setSyllabus(prev => prev.filter(s => s.id !== id));

  // ── Study Materials CRUD ──
  const [materials, setMaterials] = useState([]);
  const [matModal, setMatModal] = useState(false);
  const [editMat, setEditMat] = useState(null);
  const [matForm, setMatForm] = useState({ subject: '', title: '', type: 'PDF', url: '' });

  useEffect(() => {
    if (!targetStudentId) return;
    fetch(`${BASE}/api/dashboard-data?studentId=${targetStudentId}&type=materials`)
      .then(r => r.json())
      .then(d => { if (Array.isArray(d.content)) setMaterials(d.content); else setMaterials([]); })
      .catch(() => {});
  }, [targetStudentId]);

  const openAddMat = () => { setEditMat(null); setMatForm({ subject: '', title: '', type: 'PDF', url: '' }); setMatModal(true); };
  const openEditMat = (m) => { setEditMat(m.id); setMatForm({ subject: m.subject, title: m.title, type: m.type, url: m.url }); setMatModal(true); };

  const saveMat = () => {
    if (!matForm.title.trim()) return;
    const updated = editMat
      ? materials.map(m => m.id === editMat ? { ...m, ...matForm } : m)
      : [...materials, { id: Date.now(), ...matForm }];
    setMaterials(updated);
    setMatModal(false);
  };

  const deleteMat = (id) => setMaterials(prev => prev.filter(m => m.id !== id));

  // Load notes from DB on mount
  useEffect(() => {
    const sid = studentData?.id;
    if (!sid) return;
    fetch(`${BASE}/api/dashboard-data?studentId=${sid}&type=note`)
      .then(r => r.json())
      .then(d => { if (d.content !== null && d.content !== undefined) setNotes(d.content); })
      .catch(() => {});
  }, [studentData?.id]);

  const saveNotes = async () => {
    const sid = studentData?.id;
    if (!sid) return;
    try {
      await fetch(`${BASE}/api/dashboard-data`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId: sid, type: 'note', content: notes }),
      });
      setNotesSaved(true);
      setTimeout(() => setNotesSaved(false), 2000);
    } catch {}
  };

  const tabs = [
    { key: 'timetable',  label: 'Timetable' },
    { key: 'schedule',   label: 'Academic Schedule' },
    { key: 'strength',   label: 'Class Strength' },
    { key: 'syllabus',   label: 'Syllabus' },
    { key: 'materials',  label: 'Study Materials' },
    { key: 'notes',      label: 'My Notes' },
  ];

  const typeLabel = (t) => {
    if (t === 'Exam')     return { background: '#1a202c', color: '#fff' };
    if (t === 'Holiday')  return { background: '#e2e8f0', color: '#2d3748' };
    return                       { background: '#f7fafc',  color: '#4a5568', border: '1.5px solid #e2e8f0' };
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Header */}
      <div>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: '#1a202c', margin: '0 0 4px 0' }}>Course Hub</h2>
        <p style={{ fontSize: 14, color: '#718096', margin: 0 }}>Class {studentData?.classStudying || CLASS_INFO.class} &mdash; {CLASS_INFO.academicYear}</p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 2, borderBottom: '1.5px solid #e2e8f0', flexWrap: 'wrap' }}>
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              padding: '11px 18px', background: 'none', border: 'none',
              borderBottom: tab === t.key ? '2.5px solid #1a202c' : '2.5px solid transparent',
              fontSize: 13, fontWeight: 600,
              color: tab === t.key ? '#1a202c' : '#a0aec0',
              cursor: 'pointer', marginBottom: -1.5, whiteSpace: 'nowrap',
            }}
          >{t.label}</button>
        ))}
      </div>

      {/* Read-only notice for students on non-notes tabs */}
      {tab !== 'notes' && userRole === 'student' && (
        <div style={{ padding: '8px 14px', background: '#f7fafc', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 12, color: '#a0aec0', fontWeight: 600 }}>
          Read only — this section is managed by your teacher.
        </div>
      )}

      {/* Save Class Button — teacher only, hidden for notes tab */}
      {tab !== 'notes' && userRole === 'teacher' && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 12 }}>
          {classSaved && <span style={{ fontSize: 13, fontWeight: 600, color: '#276749' }}>Saved successfully</span>}
          <button
            onClick={handleClassSave}
            disabled={classSaving}
            className="sd-wipe-btn"
            style={{ padding: '9px 24px', borderRadius: 8, opacity: classSaving ? 0.6 : 1 }}
          ><span>{classSaving ? 'Saving...' : `Save ${tabs.find(t2 => t2.key === tab)?.label || 'Class'}`}</span></button>
        </div>
      )}

      {/* TIMETABLE */}
      {tab === 'timetable' && (
        <div style={BW.card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, paddingBottom: 10, borderBottom: '1px solid #e2e8f0' }}>
            <p style={{ ...BW.secHead, margin: 0, borderBottom: 'none', paddingBottom: 0 }}>Subject Timetable</p>
            {userRole === 'teacher' && (
              <button onClick={openAddTt} className="sd-wipe-btn" style={{ padding: '5px 14px', borderRadius: 7 }}><span>Add</span></button>
            )}
          </div>
          {timetable.length === 0 ? (
            <p style={{ fontSize: 13, color: '#a0aec0' }}>No timetable entries yet.</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr>
                  <th style={BW.th}>Subject</th>
                  <th style={BW.th}>Teacher</th>
                  <th style={BW.th}>Days</th>
                  <th style={BW.th}>Time</th>
                  <th style={BW.th}>Room</th>
                  {userRole === 'teacher' && <th style={BW.th}>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {timetable.map(s => (
                  <tr key={s.id}>
                    <td style={{ ...BW.td, fontWeight: 600, color: '#1a202c' }}>{s.subject}</td>
                    <td style={BW.td}>{s.teacher}</td>
                    <td style={BW.td}>{s.days}</td>
                    <td style={BW.td}>{s.time}</td>
                    <td style={BW.td}><span style={BW.pill}>{s.room}</span></td>
                    {userRole === 'teacher' && (
                      <td style={BW.td}>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="sd-dl-edit-btn" onClick={() => openEditTt(s)}>Edit</button>
                          <button className="sd-dl-del-btn" onClick={() => deleteTt(s.id)}>✕</button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* TIMETABLE MODAL (teacher only) */}
      {ttModal && (
        <div className="sd-modal-overlay" onClick={() => setTtModal(false)}>
          <div className="sd-modal" onClick={e => e.stopPropagation()}>
            <h3>{editTt ? 'Edit Timetable Entry' : 'Add Timetable Entry'}</h3>
            {[['Subject', 'subject', 'e.g. Mathematics'], ['Teacher', 'teacher', 'e.g. Mr. Kumar'], ['Days', 'days', 'e.g. Mon, Wed, Fri'], ['Time', 'time', 'e.g. 09:00 - 10:00'], ['Room', 'room', 'e.g. Room 4']].map(([label, key, ph]) => (
              <React.Fragment key={key}>
                <label>{label}</label>
                <input className="sd-modal-input" placeholder={ph} value={ttForm[key]} onChange={e => setTtForm(p => ({ ...p, [key]: e.target.value }))} />
              </React.Fragment>
            ))}
            <div className="sd-modal-actions">
              <button className="sd-modal-save" onClick={saveTt}>Save</button>
              <button className="sd-modal-cancel" onClick={() => setTtModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* ACADEMIC SCHEDULE */}
      {tab === 'schedule' && (
        <div style={BW.card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, paddingBottom: 10, borderBottom: '1px solid #e2e8f0' }}>
            <p style={{ ...BW.secHead, margin: 0, borderBottom: 'none', paddingBottom: 0 }}>Academic Schedule</p>
            {userRole === 'teacher' && (
              <button onClick={openAddAs} className="sd-wipe-btn" style={{ padding: '5px 14px', borderRadius: 7 }}><span>Add</span></button>
            )}
          </div>
          {acadSchedule.length === 0 ? (
            <p style={{ fontSize: 13, color: '#a0aec0' }}>No schedule entries yet.</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr>
                  <th style={BW.th}>Date</th>
                  <th style={BW.th}>Event</th>
                  <th style={BW.th}>Type</th>
                  {userRole === 'teacher' && <th style={BW.th}>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {acadSchedule.map(ev => (
                  <tr key={ev.id}>
                    <td style={{ ...BW.td, fontWeight: 600 }}>{ev.date}</td>
                    <td style={BW.td}>{ev.event}</td>
                    <td style={BW.td}>
                      <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, ...typeLabel(ev.type) }}>{ev.type}</span>
                    </td>
                    {userRole === 'teacher' && (
                      <td style={BW.td}>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="sd-dl-edit-btn" onClick={() => openEditAs(ev)}>Edit</button>
                          <button className="sd-dl-del-btn" onClick={() => deleteAs(ev.id)}>✕</button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ACADEMIC SCHEDULE MODAL (teacher only) */}
      {asModal && (
        <div className="sd-modal-overlay" onClick={() => setAsModal(false)}>
          <div className="sd-modal" onClick={e => e.stopPropagation()}>
            <h3>{editAs ? 'Edit Schedule Entry' : 'Add Schedule Entry'}</h3>
            <label>Date</label>
            <input className="sd-modal-input" type="date" value={asForm.date} onChange={e => setAsForm(p => ({ ...p, date: e.target.value }))} />
            <label>Event</label>
            <input className="sd-modal-input" placeholder="e.g. Mid-term Exam" value={asForm.event} onChange={e => setAsForm(p => ({ ...p, event: e.target.value }))} />
            <label>Type</label>
            <select className="sd-modal-input" value={asForm.type} onChange={e => setAsForm(p => ({ ...p, type: e.target.value }))}>
              <option>Event</option>
              <option>Exam</option>
              <option>Holiday</option>
            </select>
            <div className="sd-modal-actions">
              <button className="sd-modal-save" onClick={saveAs}>Save</button>
              <button className="sd-modal-cancel" onClick={() => setAsModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* CLASS STRENGTH */}
      {tab === 'strength' && (
        <div style={BW.card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, paddingBottom: 10, borderBottom: '1px solid #e2e8f0' }}>
            <p style={{ ...BW.secHead, margin: 0, borderBottom: 'none', paddingBottom: 0 }}>Class Strength</p>
            {userRole === 'teacher' && (
              <button onClick={() => { setCsInfoForm({ ...classInfo }); setCsInfoModal(true); }} className="sd-wipe-btn" style={{ padding: '5px 14px', borderRadius: 7 }}><span>Edit Info</span></button>
            )}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16, marginBottom: 20 }}>
            {[
              { label: 'Class',          val: classInfo.class || studentData?.classStudying || '—' },
              { label: 'Section',        val: classInfo.section || '—' },
              { label: 'Academic Year',  val: classInfo.academicYear || '—' },
              { label: 'Total Students', val: classInfo.strength || '—' },
            ].map(r => (
              <div key={r.label} style={{ background: '#f7fafc', border: '1.5px solid #e2e8f0', borderRadius: 10, padding: '14px 16px' }}>
                <p style={{ ...BW.label, margin: '0 0 6px 0' }}>{r.label}</p>
                <p style={{ ...BW.val, fontSize: 18, fontWeight: 700, margin: 0 }}>{r.val}</p>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, paddingBottom: 8, borderBottom: '1px solid #e2e8f0' }}>
            <p style={{ ...BW.secHead, margin: 0, borderBottom: 'none', paddingBottom: 0 }}>Subject-wise Strength</p>
            {userRole === 'teacher' && (
              <button onClick={openAddCsSub} className="sd-wipe-btn" style={{ padding: '5px 14px', borderRadius: 7 }}><span>Add Subject</span></button>
            )}
          </div>
          {strengthSubjects.length === 0 ? (
            <p style={{ fontSize: 13, color: '#a0aec0' }}>No subjects added yet.</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr>
                  <th style={BW.th}>Subject</th>
                  <th style={BW.th}>Teacher</th>
                  <th style={BW.th}>Enrolled</th>
                  {userRole === 'teacher' && <th style={BW.th}>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {strengthSubjects.map(s => (
                  <tr key={s.id}>
                    <td style={{ ...BW.td, fontWeight: 600 }}>{s.name}</td>
                    <td style={BW.td}>{s.teacher}</td>
                    <td style={BW.td}>{classInfo.strength || '—'}</td>
                    {userRole === 'teacher' && (
                      <td style={BW.td}>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="sd-dl-edit-btn" onClick={() => openEditCsSub(s)}>Edit</button>
                          <button className="sd-dl-del-btn" onClick={() => deleteCsSub(s.id)}>✕</button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* CLASS INFO MODAL */}
      {csInfoModal && (
        <div className="sd-modal-overlay" onClick={() => setCsInfoModal(false)}>
          <div className="sd-modal" onClick={e => e.stopPropagation()}>
            <h3>Edit Class Info</h3>
            {[['Class', 'class', 'e.g. 10'], ['Section', 'section', 'e.g. A'], ['Academic Year', 'academicYear', 'e.g. 2024-25'], ['Total Students', 'strength', 'e.g. 40']].map(([label, key, ph]) => (
              <React.Fragment key={key}>
                <label>{label}</label>
                <input className="sd-modal-input" placeholder={ph} value={csInfoForm[key]} onChange={e => setCsInfoForm(p => ({ ...p, [key]: e.target.value }))} />
              </React.Fragment>
            ))}
            <div className="sd-modal-actions">
              <button className="sd-modal-save" onClick={saveClassInfo}>Save</button>
              <button className="sd-modal-cancel" onClick={() => setCsInfoModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* CLASS SUBJECT MODAL */}
      {csSubModal && (
        <div className="sd-modal-overlay" onClick={() => setCsSubModal(false)}>
          <div className="sd-modal" onClick={e => e.stopPropagation()}>
            <h3>{editCsSub ? 'Edit Subject' : 'Add Subject'}</h3>
            <label>Subject Name</label>
            <input className="sd-modal-input" placeholder="e.g. Mathematics" value={csSubForm.name} onChange={e => setCsSubForm(p => ({ ...p, name: e.target.value }))} />
            <label>Teacher</label>
            <input className="sd-modal-input" placeholder="e.g. Mr. Kumar" value={csSubForm.teacher} onChange={e => setCsSubForm(p => ({ ...p, teacher: e.target.value }))} />
            <div className="sd-modal-actions">
              <button className="sd-modal-save" onClick={saveCsSub}>Save</button>
              <button className="sd-modal-cancel" onClick={() => setCsSubModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* SYLLABUS */}
      {tab === 'syllabus' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {userRole === 'teacher' && (
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={openAddSyl} className="sd-wipe-btn" style={{ padding: '7px 18px', borderRadius: 7 }}><span>Add Subject</span></button>
            </div>
          )}
          {syllabus.length === 0 ? (
            <p style={{ fontSize: 13, color: '#a0aec0' }}>No syllabus entries yet.</p>
          ) : (
            syllabus.map(s => (
              <div key={s.id} style={BW.card}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, paddingBottom: 10, borderBottom: '1px solid #e2e8f0' }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#1a202c' }}>{s.subject}</span>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span style={BW.pill}>{s.units.length} Units</span>
                    {userRole === 'teacher' && (
                      <>
                        <button className="sd-dl-edit-btn" onClick={() => openEditSyl(s)}>Edit</button>
                        <button className="sd-dl-del-btn" onClick={() => deleteSyl(s.id)}>✕</button>
                      </>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {s.units.map((u, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 12px', background: '#f7fafc', border: '1px solid #e2e8f0', borderRadius: 8 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#a0aec0', width: 20, flexShrink: 0 }}>U{i + 1}</span>
                      <span style={{ fontSize: 13, color: '#2d3748', fontWeight: 500 }}>{u}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* SYLLABUS MODAL (teacher only) */}
      {sylModal && (
        <div className="sd-modal-overlay" onClick={() => setSylModal(false)}>
          <div className="sd-modal" onClick={e => e.stopPropagation()}>
            <h3>{editSyl ? 'Edit Syllabus' : 'Add Syllabus'}</h3>
            <label>Subject Name</label>
            <input className="sd-modal-input" placeholder="e.g. Mathematics" value={sylForm.subject} onChange={e => setSylForm(p => ({ ...p, subject: e.target.value }))} />
            <label>Units (one per line)</label>
            <textarea className="sd-modal-input" placeholder="Unit 1: Introduction&#10;Unit 2: Algebra" rows={5} value={sylForm.units} onChange={e => setSylForm(p => ({ ...p, units: e.target.value }))} style={{ resize: 'vertical' }} />
            <div className="sd-modal-actions">
              <button className="sd-modal-save" onClick={saveSyl}>Save</button>
              <button className="sd-modal-cancel" onClick={() => setSylModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* STUDY MATERIALS */}
      {tab === 'materials' && (
        <div style={BW.card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, paddingBottom: 10, borderBottom: '1px solid #e2e8f0' }}>
            <p style={{ ...BW.secHead, margin: 0, borderBottom: 'none', paddingBottom: 0 }}>Study Materials</p>
            {userRole === 'teacher' && (
              <button onClick={openAddMat} className="sd-wipe-btn" style={{ padding: '5px 14px', borderRadius: 7 }}><span>Add</span></button>
            )}
          </div>
          {materials.length === 0 ? (
            <p style={{ fontSize: 13, color: '#a0aec0' }}>No materials added yet.</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr>
                  <th style={BW.th}>Subject</th>
                  <th style={BW.th}>Title</th>
                  <th style={BW.th}>Type</th>
                  <th style={BW.th}>Action</th>
                  {userRole === 'teacher' && <th style={BW.th}>Manage</th>}
                </tr>
              </thead>
              <tbody>
                {materials.map(m => (
                  <tr key={m.id}>
                    <td style={{ ...BW.td, fontWeight: 600 }}>{m.subject}</td>
                    <td style={BW.td}>{m.title}</td>
                    <td style={BW.td}><span style={BW.pill}>{m.type}</span></td>
                    <td style={BW.td}>
                      <a href={m.url} target="_blank" rel="noreferrer" style={{ fontSize: 12, fontWeight: 600, color: '#1a202c', textDecoration: 'none', padding: '5px 12px', border: '1.5px solid #1a202c', borderRadius: 6, display: 'inline-block' }}>Download</a>
                    </td>
                    {userRole === 'teacher' && (
                      <td style={BW.td}>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="sd-dl-edit-btn" onClick={() => openEditMat(m)}>Edit</button>
                          <button className="sd-dl-del-btn" onClick={() => deleteMat(m.id)}>✕</button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* STUDY MATERIALS MODAL (teacher only) */}
      {matModal && (
        <div className="sd-modal-overlay" onClick={() => setMatModal(false)}>
          <div className="sd-modal" onClick={e => e.stopPropagation()}>
            <h3>{editMat ? 'Edit Material' : 'Add Material'}</h3>
            <label>Subject</label>
            <input className="sd-modal-input" placeholder="e.g. Physics" value={matForm.subject} onChange={e => setMatForm(p => ({ ...p, subject: e.target.value }))} />
            <label>Title</label>
            <input className="sd-modal-input" placeholder="e.g. Chapter 1 Notes" value={matForm.title} onChange={e => setMatForm(p => ({ ...p, title: e.target.value }))} />
            <label>Type</label>
            <select className="sd-modal-input" value={matForm.type} onChange={e => setMatForm(p => ({ ...p, type: e.target.value }))}>
              <option>PDF</option>
              <option>Video</option>
              <option>Link</option>
              <option>Doc</option>
            </select>
            <label>URL</label>
            <input className="sd-modal-input" placeholder="https://..." value={matForm.url} onChange={e => setMatForm(p => ({ ...p, url: e.target.value }))} />
            <div className="sd-modal-actions">
              <button className="sd-modal-save" onClick={saveMat}>Save</button>
              <button className="sd-modal-cancel" onClick={() => setMatModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* MY NOTES (student-editable) */}
      {tab === 'notes' && (
        <div style={BW.card}>
          <p style={BW.secHead}>My Notes</p>
          <p style={{ fontSize: 12, color: '#a0aec0', margin: '0 0 12px 0' }}>Only this section is editable by you. All other information is set by the institution.</p>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Write your personal class notes here..."
            style={{ width: '100%', minHeight: 200, padding: '12px 14px', fontSize: 14, color: '#1a202c', background: '#f7fafc', border: '1.5px solid #e2e8f0', borderRadius: 8, outline: 'none', resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box' }}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 14, marginTop: 12 }}>
            {notesSaved && <span style={{ fontSize: 13, fontWeight: 600, color: '#2d3748' }}>Saved</span>}
            <button className="sd-wipe-btn sd-wipe-content" onClick={saveNotes} style={{ padding: '9px 20px', borderRadius: 8 }}><span>Save Notes</span></button>
          </div>
        </div>
      )}

    </div>
  );
}

function HomeDashboard({ studentData, navigate, onGoToGrades, userRole, targetStudentId }) {
  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good Morning';
    if (h < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  // ── Home Save state ──
  const [homeSaving, setHomeSaving] = useState(false);
  const [homeSaved, setHomeSaved] = useState(false);

  // ── Student task save state ──
  const [taskSaving, setTaskSaving] = useState(false);
  const [taskSaved, setTaskSaved] = useState(false);

  // ── CGPA from DB ──
  const [homeCgpa, setHomeCgpa] = useState(null);

  useEffect(() => {
    const sid = userRole === 'teacher' ? targetStudentId : studentData?.id;
    if (!sid) return;
    fetch(`${BASE}/api/dashboard-data?studentId=${sid}&type=gpa_calc`)
      .then(r => r.json())
      .then(d => {
        if (d.content && !Array.isArray(d.content) && d.content.cgpa !== undefined)
          setHomeCgpa(d.content.cgpa);
      })
      .catch(() => {});
  }, [targetStudentId, studentData?.id, userRole]);

  const now = new Date();
  const dateStr = now.toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  // ── Semester config (teacher-editable, stored in DB) ──
  const [semStart, setSemStart] = useState('2025-01-06');
  const [semEnd,   setSemEnd]   = useState('2025-06-30');
  const [semModal, setSemModal] = useState(false);
  const [semForm,  setSemForm]  = useState({ start: '2025-01-06', end: '2025-06-30' });

  useEffect(() => {
    if (!targetStudentId) return;
    fetch(`${BASE}/api/dashboard-data?studentId=${targetStudentId}&type=semester`)
      .then(r => r.json())
      .then(d => {
        if (d.content?.start) setSemStart(d.content.start);
        if (d.content?.end)   setSemEnd(d.content.end);
      })
      .catch(() => {});
  }, [targetStudentId]);

  const saveSemester = async () => {
    setSemStart(semForm.start);
    setSemEnd(semForm.end);
    setSemModal(false);
    if (!targetStudentId) return;
    await fetch(`${BASE}/api/dashboard-data`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentId: String(targetStudentId), type: 'semester', content: { start: semForm.start, end: semForm.end } }),
    }).catch(() => {});
  };

  // ── Notices (teacher posts, student reads) ──
  const [notices, setNotices]         = useState([]);
  const [noticesLoaded, setNoticesLoaded] = useState(false);
  const [noticeModal, setNoticeModal] = useState(false);
  const [editNotice, setEditNotice]   = useState(null);
  const [noticeForm, setNoticeForm]   = useState({ title: '', body: '', tag: 'Info' });

  const fetchNotices = () => {
    if (!targetStudentId) { setNoticesLoaded(true); return; }
    fetch(`${BASE}/api/dashboard-data?studentId=${targetStudentId}&type=notice`)
      .then(r => r.json())
      .then(d => { setNotices(Array.isArray(d.content) ? d.content : []); setNoticesLoaded(true); })
      .catch(() => { setNoticesLoaded(true); });
  };
  useEffect(() => { fetchNotices(); }, [targetStudentId]);

  const saveNotice = async () => {
    if (!noticeForm.title.trim()) return;
    const updated = editNotice
      ? notices.map(n => n.id === editNotice ? { ...n, ...noticeForm } : n)
      : [...notices, { id: Date.now(), ...noticeForm, date: new Date().toLocaleDateString() }];
    setNotices(updated);
    setNoticeModal(false);
    setEditNotice(null);
    setNoticeForm({ title: '', body: '', tag: 'Info' });
    if (!targetStudentId) return;
    await fetch(`${BASE}/api/dashboard-data`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentId: String(targetStudentId), type: 'notice', content: updated }),
    }).catch(() => {});
  };

  const deleteNoticeAndSave = async (id) => {
    const updated = notices.filter(n => n.id !== id);
    setNotices(updated);
    if (!targetStudentId) return;
    await fetch(`${BASE}/api/dashboard-data`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentId: String(targetStudentId), type: 'notice', content: updated }),
    }).catch(() => {});
  };

  const openEditNotice = (n) => {
    setEditNotice(n.id);
    setNoticeForm({ title: n.title, body: n.body, tag: n.tag });
    setNoticeModal(true);
  };

  // ── Course Performance (teacher CRUD) ──
  const [perfList, setPerfList] = useState([]);
  const [perfModal, setPerfModal] = useState(false);
  const [editPerf, setEditPerf] = useState(null);
  const [perfForm, setPerfForm] = useState({ subject: '', score: '', total: '', remark: '' });

  useEffect(() => {
    if (!targetStudentId) return;
    fetch(`${BASE}/api/dashboard-data?studentId=${targetStudentId}&type=performance`)
      .then(r => r.json())
      .then(d => { if (Array.isArray(d.content)) setPerfList(d.content); else setPerfList([]); })
      .catch(() => {});
  }, [targetStudentId]);

  const savePerf = async () => {
    if (!perfForm.subject.trim()) return;
    const updated = editPerf
      ? perfList.map(p => p.id === editPerf ? { ...p, ...perfForm } : p)
      : [...perfList, { id: Date.now(), ...perfForm }];
    setPerfList(updated); setPerfModal(false); setEditPerf(null);
    setPerfForm({ subject: '', score: '', total: '', remark: '' });
    if (!targetStudentId) return;
    await fetch(`${BASE}/api/dashboard-data`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentId: String(targetStudentId), type: 'performance', content: updated }),
    }).catch(() => {});
  };

  const deletePerf = async (id) => {
    const updated = perfList.filter(p => p.id !== id);
    setPerfList(updated);
    if (!targetStudentId) return;
    await fetch(`${BASE}/api/dashboard-data`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentId: String(targetStudentId), type: 'performance', content: updated }),
    }).catch(() => {});
  };

  // ── Attendance (teacher CRUD per subject) ──
  const [attendance, setAttendance] = useState([]);
  const [attModal, setAttModal] = useState(false);
  const [editAtt, setEditAtt] = useState(null);
  const [attForm, setAttForm] = useState({ subject: '', attended: '', total: '' });

  useEffect(() => {
    if (!targetStudentId) return;
    fetch(`${BASE}/api/dashboard-data?studentId=${targetStudentId}&type=attendance`)
      .then(r => r.json())
      .then(d => { if (Array.isArray(d.content)) setAttendance(d.content); else setAttendance([]); })
      .catch(() => {});
  }, [targetStudentId]);

  const saveAtt = async () => {
    if (!attForm.subject.trim()) return;
    const updated = editAtt
      ? attendance.map(a => a.id === editAtt ? { ...a, ...attForm } : a)
      : [...attendance, { id: Date.now(), ...attForm }];
    setAttendance(updated); setAttModal(false); setEditAtt(null);
    setAttForm({ subject: '', attended: '', total: '' });
    if (!targetStudentId) return;
    await fetch(`${BASE}/api/dashboard-data`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentId: String(targetStudentId), type: 'attendance', content: updated }),
    }).catch(() => {});
  };

  const deleteAtt = async (id) => {
    const updated = attendance.filter(a => a.id !== id);
    setAttendance(updated);
    if (!targetStudentId) return;
    await fetch(`${BASE}/api/dashboard-data`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentId: String(targetStudentId), type: 'attendance', content: updated }),
    }).catch(() => {});
  };

  // ── Schedule state ──
  const [schedule, setSchedule] = useState([]);
  const [scheduleLoaded, setScheduleLoaded] = useState(false);
  const [schedModal, setSchedModal] = useState(false);
  const [editSched, setEditSched] = useState(null);
  const [schedForm, setSchedForm] = useState({ hour: '09', min: '00', ampm: 'AM', label: '', tag: '', tagColor: 'grey' });
  const [schedSaved, setSchedSaved] = useState(false);
  const [schedSaving, setSchedSaving] = useState(false);

  // Load schedule from DB
  useEffect(() => {
    if (!targetStudentId) { setSchedule([]); setScheduleLoaded(true); return; }
    setScheduleLoaded(false);
    fetch(`${BASE}/api/dashboard-data?studentId=${targetStudentId}&type=schedule`)
      .then(r => r.json())
      .then(d => {
        setSchedule(Array.isArray(d.content) ? d.content : []);
        setScheduleLoaded(true);
      })
      .catch(() => { setSchedule([]); setScheduleLoaded(true); });
  }, [targetStudentId]);

  // (schedule no longer auto-saves — use Save button)

  // auto-delete past schedule items every minute
  useEffect(() => {
    const tick = () => setSchedule(prev => prev.filter(s => toMinutes(s.time) > nowMinutes() - 2));
    const id = setInterval(tick, 60000);
    return () => clearInterval(id);
  }, []);

  const ampmTo24 = (hour, min, ampm) => {
    let h = parseInt(hour, 10);
    if (ampm === 'AM' && h === 12) h = 0;
    if (ampm === 'PM' && h !== 12) h += 12;
    return `${String(h).padStart(2,'0')}:${min}`;
  };
  const time24ToDisplay = (time24) => {
    const [h, m] = time24.split(':').map(Number);
    const ampm = h < 12 ? 'AM' : 'PM';
    const h12 = h % 12 || 12;
    return `${String(h12).padStart(2,'0')}:${String(m).padStart(2,'0')} ${ampm}`;
  };

  const openAddSched = () => { setEditSched(null); setSchedForm({ hour: '09', min: '00', ampm: 'AM', label: '', tag: '', tagColor: 'grey' }); setSchedModal(true); };
  const openEditSched = (s) => {
    const [h, m] = s.time.split(':').map(Number);
    const ampm = h < 12 ? 'AM' : 'PM';
    const h12 = String(h % 12 || 12).padStart(2, '0');
    setEditSched(s.id);
    setSchedForm({ hour: h12, min: String(m).padStart(2,'0'), ampm, label: s.label, tag: s.tag, tagColor: s.tagColor });
    setSchedModal(true);
  };
  const saveSched = async () => {
    if (!schedForm.label) return;
    const sid = targetStudentId;
    if (!sid) { alert('Please select a student from the dropdown before saving.'); return; }
    const time24 = ampmTo24(schedForm.hour || '09', schedForm.min || '00', schedForm.ampm || 'AM');
    const updated = editSched
      ? schedule.map(s => s.id === editSched ? { ...s, time: time24, label: schedForm.label, tag: schedForm.tag, tagColor: schedForm.tagColor } : s)
      : [...schedule, { id: Date.now(), time: time24, label: schedForm.label, tag: schedForm.tag, tagColor: schedForm.tagColor }];
    setSchedule(updated);
    setSchedModal(false);
    await fetch(`${BASE}/api/dashboard-data`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentId: String(sid), type: 'schedule', content: updated }),
    }).catch(() => {});
  };
  const delSched = async (id) => {
    const sid = targetStudentId;
    if (!sid) return;
    const updated = schedule.filter(s => s.id !== id);
    setSchedule(updated);
    await fetch(`${BASE}/api/dashboard-data`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentId: String(sid), type: 'schedule', content: updated }),
    }).catch(() => {});
  };
  const saveScheduleToDB = async () => {
    const sid = targetStudentId;
    if (!sid) return;
    setSchedSaving(true);
    await fetch(`${BASE}/api/dashboard-data`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentId: String(sid), type: 'schedule', content: schedule }),
    }).catch(() => {});
    setSchedSaving(false);
    setSchedSaved(true);
    setTimeout(() => setSchedSaved(false), 2000);
  };

  // ── Deadlines state ──
  const [deadlines, setDeadlines] = useState([]);
  const [deadlinesLoaded, setDeadlinesLoaded] = useState(false);
  const [dlSaved, setDlSaved] = useState(false);
  const [dlSaving, setDlSaving] = useState(false);

  // Load deadlines from DB
  useEffect(() => {
    if (!targetStudentId) { setDeadlines([]); setDeadlinesLoaded(true); return; }
    setDeadlinesLoaded(false);
    fetch(`${BASE}/api/dashboard-data?studentId=${targetStudentId}&type=deadline`)
      .then(r => r.json())
      .then(d => {
        setDeadlines(Array.isArray(d.content) ? d.content : []);
        setDeadlinesLoaded(true);
      })
      .catch(() => { setDeadlines([]); setDeadlinesLoaded(true); });
  }, [targetStudentId]);

  // (deadlines no longer auto-saves — use Save button)
  const [dlModal, setDlModal] = useState(false);
  const [editDl, setEditDl] = useState(null);
  const [dlForm, setDlForm] = useState({ color: 'grey', title: '', due: '' });

  const openAddDl = () => { setEditDl(null); setDlForm({ color: 'grey', title: '', due: '' }); setDlModal(true); };
  const openEditDl = (d) => { setEditDl(d.id); setDlForm({ color: d.color, title: d.title, due: d.due }); setDlModal(true); };
  const saveDl = async () => {
    if (!dlForm.title) return;
    const updated = editDl
      ? deadlines.map(d => d.id === editDl ? { ...d, ...dlForm } : d)
      : [...deadlines, { id: Date.now(), ...dlForm }];
    setDeadlines(updated);
    setDlModal(false);
    // teacher saves immediately; student must click Save button
    if (userRole === 'teacher') {
      if (!targetStudentId) return;
      await fetch(`${BASE}/api/dashboard-data`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId: String(targetStudentId), type: 'deadline', content: updated }),
      }).catch(() => {});
    }
  };
  const delDl = async (id) => {
    const updated = deadlines.filter(d => d.id !== id);
    setDeadlines(updated);
    if (userRole === 'teacher') {
      if (!targetStudentId) return;
      await fetch(`${BASE}/api/dashboard-data`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId: String(targetStudentId), type: 'deadline', content: updated }),
      }).catch(() => {});
    }
  };
  const saveDeadlinesToDB = async () => {
    if (!targetStudentId) return;
    setDlSaving(true);
    await fetch(`${BASE}/api/dashboard-data`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentId: String(targetStudentId), type: 'deadline', content: deadlines }),
    }).catch(() => {});
    setDlSaving(false);
    setDlSaved(true);
    setTimeout(() => setDlSaved(false), 2000);
  };

  // ── Free Payments page ──
  const [showPayments, setShowPayments] = useState(false);

  // ── Semester Progress ──
  const SEMESTER_START = new Date(semStart);
  const SEMESTER_END   = new Date(semEnd);
  const totalDays   = Math.max(1, Math.round((SEMESTER_END - SEMESTER_START) / 86400000));
  const elapsedDays = Math.min(totalDays, Math.max(0, Math.round((now - SEMESTER_START) / 86400000)));
  const daysLeft    = Math.max(0, totalDays - elapsedDays);
  const timePct     = Math.round((elapsedDays / totalDays) * 100);

  // ── Academic Tasks ──
  const TASK_TYPES = ['Assignment', 'Online Test', 'Homework', 'Project', 'Quiz', 'Lab Report'];
  const [tasks, setTasks] = useState([]);
  const [tasksLoaded, setTasksLoaded] = useState(false);
  const [taskExpanded, setTaskExpanded] = useState(false);
  const [taskModal, setTaskModal] = useState(false);
  const [taskForm, setTaskForm] = useState({ type: 'Assignment', title: '' });
  const completedTasks = tasks.filter(t => t.done).length;
  const TOTAL_TASKS = tasks.length || 1;
  const taskPct = Math.round((completedTasks / TOTAL_TASKS) * 100);

  useEffect(() => {
    if (!targetStudentId) { setTasksLoaded(true); return; }
    setTasksLoaded(false);
    fetch(`${BASE}/api/dashboard-data?studentId=${targetStudentId}&type=tasks`)
      .then(r => r.json())
      .then(d => { setTasks(Array.isArray(d.content) ? d.content : []); setTasksLoaded(true); })
      .catch(() => { setTasksLoaded(true); });
  }, [targetStudentId]);

  // (tasks no longer auto-saves — use Save button)

  const toggleTask = (id) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t));
  };

  const saveTasksStudent = async () => {
    const sid = studentData?.id;
    if (!sid) return;
    setTaskSaving(true);
    await fetch(`${BASE}/api/dashboard-data`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentId: String(sid), type: 'tasks', content: tasks }),
    }).catch(() => {});
    setTaskSaving(false);
    setTaskSaved(true);
    setTimeout(() => setTaskSaved(false), 2000);
  };
  const addTask = () => {
    if (!taskForm.title.trim()) return;
    setTasks(prev => [...prev, { id: Date.now(), type: taskForm.type, title: taskForm.title, done: false }]);
    setTaskForm({ type: 'Assignment', title: '' });
    setTaskModal(false);
  };

  // ── Save all Home data ──
  const saveHomeData = async () => {
    if (!targetStudentId) {
      alert('Please select a student from the dropdown before saving.');
      return;
    }
    setHomeSaving(true);
    const saves = [
      { type: 'schedule',    content: schedule },
      { type: 'deadline',    content: deadlines },
      { type: 'tasks',       content: tasks },
      { type: 'attendance',  content: attendance },
      { type: 'performance', content: perfList },
      { type: 'notice',      content: notices },
      { type: 'semester',    content: { start: semStart, end: semEnd } },
    ];
    const results = await Promise.all(saves.map(s =>
      fetch(`${BASE}/api/dashboard-data`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId: String(targetStudentId), type: s.type, content: s.content }),
      })
        .then(r => { if (!r.ok) return { success: false, status: r.status }; return r.json(); })
        .catch(() => ({ success: false }))
    ));
    setHomeSaving(false);
    const failed = results.filter(r => r.success === false);
    if (failed.length === 0) {
      setHomeSaved(true);
      setTimeout(() => setHomeSaved(false), 2500);
    } else {
      alert(`${failed.length} item(s) failed to save. Please try again.`);
    }
  };

  // ── Attendance overall ──
  const totalAttended = attendance.reduce((a, c) => a + Number(c.attended || 0), 0);
  const totalClasses  = attendance.reduce((a, c) => a + Number(c.total || 0), 0);
  const overallPct    = totalClasses > 0 ? Math.round((totalAttended / totalClasses) * 100) : 0;

  return (
    <>
      <div className="sd-greeting" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
        <div>
          <h2>{getGreeting()}, {studentData?.firstName || 'Student'}</h2>
          <p>Class: {studentData?.classStudying || 'N/A'} &nbsp;·&nbsp; {dateStr}</p>
        </div>

      </div>

      {/* Home Save Button — teacher only */}
      {!showPayments && userRole === 'teacher' && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 12, marginBottom: 4 }}>
          {homeSaved && <span style={{ fontSize: 13, fontWeight: 600, color: '#276749' }}>Saved successfully</span>}
          <button
            onClick={saveHomeData}
            disabled={homeSaving}
            className="sd-wipe-btn"
            style={{ padding: '9px 24px', borderRadius: 8, opacity: homeSaving ? 0.6 : 1 }}
          ><span>{homeSaving ? 'Saving...' : 'Save Home'}</span></button>
        </div>
      )}

      {showPayments ? (
        <FreePaymentsPage onBack={() => setShowPayments(false)} userRole={userRole} targetStudentId={targetStudentId} studentData={studentData} />
      ) : (
      <>
      <div className="sd-progress-card">
        {/* Time Elapsed */}
        <div className="sd-progress-row">
          <div className="sd-progress-info">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="sd-progress-label-title">Time Elapsed</span>
              <span style={{ fontSize: 11, color: '#a0aec0', fontWeight: 400 }}>
                {semStart} → {semEnd}
              </span>
              {userRole === 'teacher' && (
                <button
                  onClick={() => { setSemForm({ start: semStart, end: semEnd }); setSemModal(true); }}
                  style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', background: '#f7fafc', border: '1.5px solid #e2e8f0', borderRadius: 5, cursor: 'pointer', color: '#4a5568', lineHeight: 1.4 }}
                >Edit</button>
              )}
            </div>
            <span className="sd-progress-label-val">{timePct}% &nbsp;<span style={{ fontSize: 11, color: '#a0aec0', fontWeight: 400 }}>({daysLeft} days left)</span></span>
          </div>
          <div className="sd-progress-bar">
            <div className="sd-progress-fill" style={{ width: `${timePct}%` }}></div>
          </div>
        </div>

        <div className="sd-progress-divider" />

        {/* CGPA */}
        {homeCgpa !== null && (
          <div className="sd-progress-row">
            <div className="sd-progress-info">
              <span className="sd-progress-label-title">CGPA</span>
              <span className="sd-progress-label-val">
                {homeCgpa} / 10 &nbsp;<span style={{ fontSize: 11, color: '#a0aec0', fontWeight: 400 }}>({Math.round((homeCgpa / 10) * 100)}%)</span>
              </span>
            </div>
            <div className="sd-progress-bar">
              <div className="sd-progress-fill" style={{ width: `${(homeCgpa / 10) * 100}%`, background: '#2d3748' }}></div>
            </div>
          </div>
        )}

        {/* Academic Tasks */}
        <div className="sd-progress-row">
          <div
            className="sd-progress-info"
            onClick={() => setTaskExpanded(e => !e)}
            style={{ cursor: 'pointer', userSelect: 'none' }}
          >
            <span className="sd-progress-label-title">Academic Tasks</span>
            <span className="sd-progress-label-val">
              {completedTasks}/{TOTAL_TASKS} &nbsp;
              <span style={{ fontSize: 11, color: '#a0aec0', fontWeight: 400 }}>({taskPct}%)</span>
              &nbsp;<span style={{ fontSize: 11, color: '#a0aec0' }}>{taskExpanded ? '▲' : '▼'}</span>
            </span>
          </div>
          <div className="sd-progress-bar" style={{ cursor: 'pointer' }} onClick={() => setTaskExpanded(e => !e)}>
            <div className="sd-progress-fill" style={{ width: `${taskPct}%`, background: '#4a5568' }}></div>
          </div>
          {taskExpanded && (
            <>
              {userRole === 'teacher' && (
              <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                <button
                  className="sd-wipe-btn"
                  style={{ padding: '4px 12px', borderRadius: 6 }}
                  onClick={() => setTaskModal(true)}
                ><span>Add Task</span></button>
              </div>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
                {tasks.map(t => (
                  <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', background: '#f7fafc', border: '1px solid #e2e8f0', borderRadius: 7 }}>
                    <input
                      type="checkbox"
                      checked={t.done}
                      onChange={() => toggleTask(t.id)}
                      style={{ accentColor: '#1a202c', width: 14, height: 14, cursor: 'pointer', flexShrink: 0 }}
                    />
                    <span style={{ flex: 1, fontSize: 12, color: t.done ? '#a0aec0' : '#2d3748', textDecoration: t.done ? 'line-through' : 'none', fontWeight: 500 }}>{t.title}</span>
                    <span style={{ fontSize: 10, fontWeight: 700, background: '#e2e8f0', color: '#4a5568', padding: '2px 7px', borderRadius: 20 }}>{t.type}</span>
                  </div>
                ))}
              </div>
              {userRole === 'student' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8 }}>
                  {taskSaved && <span style={{ fontSize: 12, fontWeight: 600, color: '#276749' }}>Saved</span>}
                  <button
                    className="sd-wipe-btn"
                    style={{ padding: '5px 14px', borderRadius: 6, opacity: taskSaving ? 0.6 : 1 }}
                    onClick={saveTasksStudent}
                    disabled={taskSaving}
                  ><span>{taskSaving ? 'Saving...' : 'Save'}</span></button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ROW 1 */}
      </>)}
      {!showPayments && <>
      <div className="sd-cards-row">

        {/* TODAY'S SCHEDULE */}
        <div className="sd-card">
          <div className="sd-card-header">
            <h3>Today's Schedule</h3>
            {userRole === 'teacher' && <button className="sd-add-btn sd-wipe-btn" onClick={openAddSched}><span>Add</span></button>}
          </div>
          {userRole === 'student' && <p style={{ fontSize: 11, color: '#a0aec0', margin: '0 0 8px 0' }}>Read only — managed by your teacher.</p>}
          {schedule.length === 0 ? (
            <p className="sd-no-schedule">No upcoming classes today.</p>
          ) : (
            <ul className="sd-schedule-list">
              {schedule
                .slice()
                .sort((a, b) => toMinutes(a.time) - toMinutes(b.time))
                .map(s => (
                  <li key={s.id}>
                    <span>{time24ToDisplay(s.time)} — {s.label}</span>
                    <div className="sd-sched-actions">
                      <button className={`sd-tag ${s.tagColor}`}>{s.tag}</button>
                      {userRole === 'teacher' && <button className="sd-dl-edit-btn" onClick={() => openEditSched(s)}>Edit</button>}
                      {userRole === 'teacher' && <button className="sd-dl-del-btn" onClick={() => delSched(s.id)}>✕</button>}
                    </div>
                  </li>
                ))}
            </ul>
          )}

        </div>

        {/* UPCOMING DEADLINES */}
        <div className="sd-card">
          <div className="sd-card-header">
            <h3>Upcoming Deadlines</h3>
            {userRole === 'teacher' && <button className="sd-add-btn sd-wipe-btn" onClick={openAddDl}><span>Add</span></button>}
          </div>
          {deadlines.length === 0 ? (
            <p className="sd-no-schedule">No upcoming deadlines.</p>
          ) : (
            <ul className="sd-deadline-list">
              {deadlines.map(d => (
                <li key={d.id}>
                  <span className={`sd-dot ${d.color}`}></span>
                  <span className="sd-deadline-title">{d.title}</span>
                  <span className="sd-due">{d.due}</span>
                  {userRole === 'teacher' && <button className="sd-dl-edit-btn" onClick={() => openEditDl(d)}>Edit</button>}
                  {userRole === 'teacher' && <button className="sd-dl-del-btn" onClick={() => delDl(d.id)}>✕</button>}
                </li>
              ))}
            </ul>
          )}

        </div>

      </div>

      {/* ROW 2 - ATTENDANCE */}
      <div className="sd-cards-row">
        <div className="sd-card" style={{ gridColumn: '1 / -1' }}>
          <div className="sd-card-header">
            <h3>Attendance</h3>
            {userRole === 'teacher' && (
              <button className="sd-add-btn sd-wipe-btn" onClick={() => { setEditAtt(null); setAttForm({ subject: '', attended: '', total: '' }); setAttModal(true); }}><span>Add</span></button>
            )}
          </div>
          {userRole === 'student' && <p style={{ fontSize: 11, color: '#a0aec0', margin: '0 0 8px 0' }}>Read only — managed by your teacher.</p>}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#a0aec0', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Overall</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#2d3748' }}>{overallPct}%</span>
          </div>
          {attendance.length === 0 ? (
            <p className="sd-no-schedule">No attendance data yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {attendance.map(a => {
                const pct = Number(a.total) > 0 ? Math.round((Number(a.attended) / Number(a.total)) * 100) : 0;
                return (
                  <div key={a.id} className="sd-attend-row" style={{ alignItems: 'center' }}>
                    <div className="sd-attend-meta">
                      <span className="sd-attend-name">{a.subject}</span>
                      <span className="sd-attend-count">{a.attended}/{a.total} classes</span>
                    </div>
                    <div className="sd-attend-bar-wrap">
                      <div className="sd-attend-bar-fill" style={{ width: `${pct}%`, background: pct < 75 ? '#718096' : '#2d3748' }} />
                    </div>
                    <span className="sd-attend-pct" style={{ color: pct < 75 ? '#718096' : '#2d3748' }}>{pct}%</span>
                    {userRole === 'teacher' && (
                      <div style={{ display: 'flex', gap: 4, marginLeft: 6 }}>
                        <button className="sd-dl-edit-btn" onClick={() => { setEditAtt(a.id); setAttForm({ subject: a.subject, attended: a.attended, total: a.total }); setAttModal(true); }}>Edit</button>
                        <button className="sd-dl-del-btn" onClick={() => deleteAtt(a.id)}>✕</button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ROW 3 - COURSE PERFORMANCE */}
      <div className="sd-cards-row">
        <div className="sd-card">
          <div className="sd-card-header">
            <h3>Course Performance</h3>
            {userRole === 'teacher' && (
              <button className="sd-add-btn sd-wipe-btn" onClick={() => { setEditPerf(null); setPerfForm({ subject: '', score: '', total: '', remark: '' }); setPerfModal(true); }}><span>Add</span></button>
            )}
          </div>
          {userRole === 'student' && <p style={{ fontSize: 11, color: '#a0aec0', margin: '0 0 8px 0' }}>Read only — managed by your teacher.</p>}
          {perfList.length === 0 ? (
            <p className="sd-no-schedule">No performance data yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {perfList.map(p => {
                const pct = p.total > 0 ? Math.round((Number(p.score) / Number(p.total)) * 100) : 0;
                return (
                  <div key={p.id} style={{ padding: '10px 12px', background: '#f7fafc', border: '1px solid #e2e8f0', borderRadius: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#1a202c' }}>{p.subject}</span>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: '#2d3748' }}>{p.score}/{p.total} ({pct}%)</span>
                        {userRole === 'teacher' && (
                          <>
                            <button className="sd-dl-edit-btn" onClick={() => { setEditPerf(p.id); setPerfForm({ subject: p.subject, score: p.score, total: p.total, remark: p.remark }); setPerfModal(true); }}>Edit</button>
                            <button className="sd-dl-del-btn" onClick={() => deletePerf(p.id)}>✕</button>
                          </>
                        )}
                      </div>
                    </div>
                    <div style={{ height: 7, background: '#e2e8f0', borderRadius: 99, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: '#2d3748', borderRadius: 99 }} />
                    </div>
                    {p.remark && <p style={{ fontSize: 11, color: '#718096', margin: '4px 0 0 0' }}>{p.remark}</p>}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ROW 4 - QUICK LINKS + NOTICES */}
      <div className="sd-cards-row">

        {/* NOTICES */}
        <div className="sd-card">
          <div className="sd-card-header">
            <h3>Notices & Announcements</h3>
            {userRole === 'teacher' && (
              <button className="sd-add-btn sd-wipe-btn" onClick={() => { setEditNotice(null); setNoticeForm({ title: '', body: '', tag: 'Info' }); setNoticeModal(true); }}><span>Post</span></button>
            )}
          </div>
          {!noticesLoaded ? (
            <p style={{ fontSize: 13, color: '#a0aec0' }}>Loading...</p>
          ) : notices.length === 0 ? (
            <p className="sd-no-schedule">No notices yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {notices.map(n => (
                <div key={n.id} style={{ padding: '10px 12px', background: '#f7fafc', border: '1px solid #e2e8f0', borderRadius: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#1a202c' }}>{n.title}</span>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: n.tag === 'Urgent' ? '#2d3748' : '#e2e8f0', color: n.tag === 'Urgent' ? '#fff' : '#4a5568' }}>{n.tag}</span>
                      <span style={{ fontSize: 11, color: '#a0aec0' }}>{n.date}</span>
                      {userRole === 'teacher' && (
                        <>
                          <button className="sd-dl-edit-btn" onClick={() => openEditNotice(n)}>Edit</button>
                          <button className="sd-dl-del-btn" onClick={() => deleteNoticeAndSave(n.id)}>✕</button>
                        </>
                      )}
                    </div>
                  </div>
                  {n.body && <p style={{ fontSize: 12, color: '#4a5568', margin: 0 }}>{n.body}</p>}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* QUICK LINKS */}
        <div className="sd-card">
          <h3>Quick Links</h3>
          <div className="sd-quick-links">
            <button className="sd-link-btn sd-ql-btn" onClick={() => navigate('/student-details')}>Student Details</button>
            <button className="sd-link-btn sd-ql-btn" onClick={onGoToGrades}>Grades</button>
            <button className="sd-link-btn sd-ql-btn" onClick={() => window.open('https://www.annacentenarylibrary.org/', '_blank')}>Library</button>
            <button className="sd-link-btn sd-ql-btn" onClick={() => setShowPayments(true)}>Fee Payments</button>
          </div>
          <div className="sd-profile-mini">
            {[
              { label: 'Name',         value: studentData?.firstName || '—' },
              { label: 'Email',        value: studentData?.email || '—' },
              { label: 'DOB',          value: studentData?.dob || '—' },
              { label: 'Gender',       value: studentData?.gender || '—' },
              { label: 'Blood Type',   value: studentData?.bloodType || '—' },
              { label: 'Phone',        value: studentData?.guardianPhone || '—' },
              { label: 'Class',        value: studentData?.classStudying || '—' },
              { label: 'Address',      value: studentData?.address || '—' },
            ].map(r => (
              <div key={r.label} style={{ display: 'flex', gap: 6, fontSize: 13, color: '#4a5568' }}>
                <span style={{ color: '#a0aec0', flexShrink: 0, minWidth: 70 }}>{r.label}:</span>
                <span style={{ color: '#2d3748', wordBreak: 'break-word' }}>{r.value}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      </>
      }

      {/* PERFORMANCE MODAL */}
      {perfModal && (
        <div className="sd-modal-overlay" onClick={() => setPerfModal(false)}>
          <div className="sd-modal" onClick={e => e.stopPropagation()}>
            <h3>{editPerf ? 'Edit Performance' : 'Add Performance'}</h3>
            <label>Subject</label>
            <input className="sd-modal-input" placeholder="e.g. Mathematics" value={perfForm.subject} onChange={e => setPerfForm(p => ({ ...p, subject: e.target.value }))} />
            <label>Score</label>
            <input className="sd-modal-input" placeholder="e.g. 85" value={perfForm.score} onChange={e => setPerfForm(p => ({ ...p, score: e.target.value }))} />
            <label>Total</label>
            <input className="sd-modal-input" placeholder="e.g. 100" value={perfForm.total} onChange={e => setPerfForm(p => ({ ...p, total: e.target.value }))} />
            <label>Remark (optional)</label>
            <input className="sd-modal-input" placeholder="e.g. Good improvement" value={perfForm.remark} onChange={e => setPerfForm(p => ({ ...p, remark: e.target.value }))} />
            <div className="sd-modal-actions">
              <button className="sd-modal-save" onClick={savePerf}>Save</button>
              <button className="sd-modal-cancel" onClick={() => setPerfModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* ATTENDANCE MODAL */}
      {attModal && (
        <div className="sd-modal-overlay" onClick={() => setAttModal(false)}>
          <div className="sd-modal" onClick={e => e.stopPropagation()}>
            <h3>{editAtt ? 'Edit Attendance' : 'Add Attendance'}</h3>
            <label>Subject</label>
            <input className="sd-modal-input" placeholder="e.g. Physics" value={attForm.subject} onChange={e => setAttForm(p => ({ ...p, subject: e.target.value }))} />
            <label>Classes Attended</label>
            <input className="sd-modal-input" placeholder="e.g. 18" value={attForm.attended} onChange={e => setAttForm(p => ({ ...p, attended: e.target.value }))} />
            <label>Total Classes</label>
            <input className="sd-modal-input" placeholder="e.g. 24" value={attForm.total} onChange={e => setAttForm(p => ({ ...p, total: e.target.value }))} />
            <div className="sd-modal-actions">
              <button className="sd-modal-save" onClick={saveAtt}>Save</button>
              <button className="sd-modal-cancel" onClick={() => setAttModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* SEMESTER MODAL (teacher only) */}
      {semModal && (
        <div className="sd-modal-overlay" onClick={() => setSemModal(false)}>
          <div className="sd-modal" onClick={e => e.stopPropagation()}>
            <h3>Edit Semester Dates</h3>
            <label>Start Date</label>
            <input className="sd-modal-input" type="date" value={semForm.start} onChange={e => setSemForm(p => ({ ...p, start: e.target.value }))} />
            <label>End Date</label>
            <input className="sd-modal-input" type="date" value={semForm.end} onChange={e => setSemForm(p => ({ ...p, end: e.target.value }))} />
            <div className="sd-modal-actions">
              <button className="sd-modal-save" onClick={saveSemester}>Save</button>
              <button className="sd-modal-cancel" onClick={() => setSemModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* NOTICE MODAL (teacher only) */}
      {noticeModal && (
        <div className="sd-modal-overlay" onClick={() => setNoticeModal(false)}>
          <div className="sd-modal" onClick={e => e.stopPropagation()}>
            <h3>{editNotice ? 'Edit Notice' : 'Post Notice'}</h3>
            <label>Title</label>
            <input className="sd-modal-input" placeholder="e.g. Exam Postponed" value={noticeForm.title} onChange={e => setNoticeForm(p => ({ ...p, title: e.target.value }))} />
            <label>Message (optional)</label>
            <textarea className="sd-modal-input" placeholder="Details..." rows={3} value={noticeForm.body} onChange={e => setNoticeForm(p => ({ ...p, body: e.target.value }))} style={{ resize: 'vertical' }} />
            <label>Tag</label>
            <select className="sd-modal-input" value={noticeForm.tag} onChange={e => setNoticeForm(p => ({ ...p, tag: e.target.value }))}>
              <option>Info</option>
              <option>Urgent</option>
              <option>Holiday</option>
              <option>Exam</option>
              <option>Event</option>
            </select>
            <div className="sd-modal-actions">
              <button className="sd-modal-save" onClick={saveNotice}>Save</button>
              <button className="sd-modal-cancel" onClick={() => setNoticeModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* TASK MODAL */}
      {taskModal && (
        <div className="sd-modal-overlay" onClick={() => setTaskModal(false)}>
          <div className="sd-modal" onClick={e => e.stopPropagation()}>
            <h3>Add Academic Task</h3>
            <label>Type</label>
            <select className="sd-modal-input" value={taskForm.type} onChange={e => setTaskForm(p => ({ ...p, type: e.target.value }))}>
              {TASK_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
            <label>Title</label>
            <input className="sd-modal-input" placeholder="e.g. Math Assignment" value={taskForm.title} onChange={e => setTaskForm(p => ({ ...p, title: e.target.value }))} />
            <div className="sd-modal-actions">
              <button className="sd-modal-save" onClick={addTask}>Add</button>
              <button className="sd-modal-cancel" onClick={() => setTaskModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* SCHEDULE MODAL */}
      {schedModal && (
        <div className="sd-modal-overlay" onClick={() => setSchedModal(false)}>
          <div className="sd-modal" onClick={e => e.stopPropagation()}>
            <h3>{editSched ? 'Edit Schedule' : 'Add Schedule'}</h3>
            <label>Hour</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <select
                className="sd-modal-input"
                style={{ flex: 1 }}
                value={schedForm.hour || '09'}
                onChange={e => setSchedForm(p => ({ ...p, hour: e.target.value }))}
              >
                {Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0')).map(h => <option key={h}>{h}</option>)}
              </select>
              <select
                className="sd-modal-input"
                style={{ flex: 1 }}
                value={schedForm.min || '00'}
                onChange={e => setSchedForm(p => ({ ...p, min: e.target.value }))}
              >
                {['00','15','30','45'].map(m => <option key={m}>{m}</option>)}
              </select>
              <select
                className="sd-modal-input"
                style={{ flex: 1 }}
                value={schedForm.ampm || 'AM'}
                onChange={e => setSchedForm(p => ({ ...p, ampm: e.target.value }))}
              >
                <option>AM</option>
                <option>PM</option>
              </select>
            </div>
            <label>Subject / Label</label>
            <input className="sd-modal-input" placeholder="e.g. Data Structures" value={schedForm.label} onChange={e => setSchedForm(p => ({ ...p, label: e.target.value }))} />
            <label>Tag</label>
            <input className="sd-modal-input" placeholder="e.g. Room 4 or Join" value={schedForm.tag} onChange={e => setSchedForm(p => ({ ...p, tag: e.target.value }))} />
            <div className="sd-modal-actions">
              <button className="sd-modal-save" onClick={saveSched}>Save</button>
              <button className="sd-modal-cancel" onClick={() => setSchedModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* DEADLINE MODAL */}
      {dlModal && (
        <div className="sd-modal-overlay" onClick={() => setDlModal(false)}>
          <div className="sd-modal" onClick={e => e.stopPropagation()}>
            <h3>{editDl ? 'Edit Deadline' : 'Add Deadline'}</h3>
            <label>Title</label>
            <input className="sd-modal-input" placeholder="e.g. Math Quiz" value={dlForm.title} onChange={e => setDlForm(p => ({ ...p, title: e.target.value }))} />
            <label>Due</label>
            <input className="sd-modal-input" placeholder="e.g. Today, 11 PM" value={dlForm.due} onChange={e => setDlForm(p => ({ ...p, due: e.target.value }))} />
            <label>Color</label>
            <select className="sd-modal-input" value={dlForm.color} onChange={e => setDlForm(p => ({ ...p, color: e.target.value }))}>
              <option value="red">Red (Urgent)</option>
              <option value="orange">Orange (Soon)</option>
              <option value="grey">Grey (Later)</option>
            </select>
            <div className="sd-modal-actions">
              <button className="sd-modal-save" onClick={saveDl}>Save</button>
              <button className="sd-modal-cancel" onClick={() => setDlModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}


    </>
  );
}

function StudentDashboard() {
  const navigate = useNavigate();
  const [studentData, setStudentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeNav, setActiveNav] = useState('home');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [allStudents, setAllStudents] = useState([]);
  const [studentDropOpen, setStudentDropOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(() => {
    try { return JSON.parse(localStorage.getItem('selectedStudent')) || null; } catch { return null; }
  });
  const userRole = localStorage.getItem('userRole');

  // targetStudentId: for teacher = selected student's id, for student = own id
  const targetStudentId = userRole === 'teacher'
    ? (selectedStudent?.id || null)
    : (studentData?.id || null);

  const SEARCH_INDEX = [
    ...SUBJECTS.map(s => ({ title: s.name, sub: `Course · ${s.teacher} · ${s.days} · ${s.time} · ${s.room}`, nav: 'class' })),
    ...GRADE_DATA.flatMap(sem => sem.subjects.map(s => ({ title: s.name, sub: `Grades · ${sem.sem} · GPA ${sem.gpa} · Teacher: ${s.teacher}`, nav: 'grades' }))),
    ...GRADE_DATA.flatMap(sem => sem.subjects.flatMap(s => s.assignments.map(a => ({ title: a.title, sub: `Grade · ${s.name} · Score ${a.score}/${a.max}`, nav: 'grades' })))),
    ...ACADEMIC_SCHEDULE.map(e => ({ title: e.event, sub: `Schedule · ${e.date} · ${e.type}`, nav: 'class' })),
    ...SYLLABUS.flatMap(s => s.units.map(u => ({ title: u, sub: `Syllabus · ${s.subject}`, nav: 'class' }))),
    ...MATERIALS.map(m => ({ title: m.title, sub: `Study Material · ${m.subject} · ${m.type}`, nav: 'class' })),
  ];

  const searchResults = searchQuery.trim().length > 0
    ? SEARCH_INDEX.filter(r =>
        r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.sub.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 8)
    : [];

  const fetchIndividualProfile = async () => {
    const email = localStorage.getItem('userEmail');
    if (!email) {
      navigate('/login');
      return;
    }
    if (userRole === 'teacher') {
      setStudentData({ firstName: localStorage.getItem('userIdNo') || 'Teacher', email, role: 'teacher' });
      setLoading(false);
      return;
    }
    try {
      const res = await fetch(`${BASE}/api/students?email=${encodeURIComponent(email)}`);
      const data = await res.json();
      // Backend returns single object for email lookup
      const record = Array.isArray(data) ? data[0] : (data && data.id ? data : null);
      if (record) {
        setStudentData(record);
      } else {
        navigate('/student-form');
      }
    } catch {
      navigate('/login');
    }
    setLoading(false);
  };

  const fetchAllStudents = async () => {
    try {
      const res = await fetch(`${BASE}/api/students`);
      const data = await res.json();
      setAllStudents(Array.isArray(data) ? data : []);
    } catch { setAllStudents([]); }
  };

  useEffect(() => {
    fetchIndividualProfile();
    fetchAllStudents();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('token');
    localStorage.removeItem('hasExistingProfile');
    localStorage.removeItem('userRole');
    localStorage.removeItem('selectedStudent');
    navigate('/login');
  };

  const navItems = [
    { key: 'home',   label: 'Home',     icon: 'bx bx-grid-alt' },
    { key: 'class',  label: 'Class',    icon: 'bx bx-book-open' },
    { key: 'grades', label: 'Grades',   icon: 'bx bx-pie-chart-alt-2' },
    { key: 'files',  label: 'Files',    icon: 'bx bx-folder' },
    { key: 'config', label: 'Settings', icon: 'bx bx-cog' },
  ];

  if (loading) {
    return <div className="sd-loading">Loading your dashboard...</div>;
  }

  return (
    <div className="sd-layout">

      {/* SIDEBAR */}
      <aside className={`sd-sidebar${sidebarOpen ? ' open' : ''}`}>
        <div className="sd-logo-details">
          <i className='bx bxl-codepen sd-logo-icon'></i>
          <span className="sd-logo" style={{ cursor: 'pointer' }} onClick={() => setActiveNav('home')}>Student Portal</span>
          <button
            className="sd-toggle-btn"
            onClick={() => setSidebarOpen(o => !o)}
            title={sidebarOpen ? 'Collapse' : 'Expand'}
          >
            <i className={sidebarOpen ? 'bx bx-menu-alt-right' : 'bx bx-menu'}></i>
          </button>
        </div>

        <div className="sd-sidebar-search-wrap">
          <input
            className="sd-sidebar-search"
            type="text"
            placeholder="Search..."
            value={sidebarOpen ? searchQuery : ''}
            onChange={e => { setSearchQuery(e.target.value); setSearchOpen(true); }}
            readOnly={!sidebarOpen}
          />
          <i
            className='bx bx-search sd-sidebar-search-icon'
            onClick={() => setSidebarOpen(o => !o)}
          ></i>
        </div>

        <ul className="sd-nav">
          {navItems.map(item => (
            <li key={item.key}>
              <button
                className={`sd-nav-item${activeNav === item.key ? ' active' : ''}`}
                onClick={() => setActiveNav(item.key)}
              >
                <i className={`${item.icon} sd-nav-icon`}></i>
                <span className="sd-nav-label">{item.label}</span>
              </button>
              <span className="sd-tooltip">{item.label}</span>
            </li>
          ))}
        </ul>

        <div className={`sd-profile-section${sidebarOpen ? ' open' : ''}`}>
          <div className="sd-profile-details">
            <div className="sd-avatar" style={{ flexShrink: 0, width: 36, height: 36, fontSize: 14 }}>
              {studentData?.recentPhotoPath ? (
                <ProfileImage
                  src={`${BASE}/api/students/files?path=${encodeURIComponent(studentData.recentPhotoPath)}&t=${studentData.id}`}
                  fallback={studentData?.firstName?.charAt(0) || '?'}
                />
              ) : (
                <span>{studentData?.firstName?.charAt(0) || '?'}</span>
              )}
            </div>
            {sidebarOpen && (
              <div style={{ overflow: 'hidden' }}>
                <p className="sd-profile-name">{studentData?.firstName || 'User'}</p>
                <p className="sd-profile-role">{userRole === 'teacher' ? 'Teacher' : 'Student'}</p>
              </div>
            )}
          </div>
          <button
            className="sd-logout-btn"
            onClick={handleLogout}
            title="Logout"
          >
            <i className='bx bx-log-out'></i>
          </button>
        </div>
      </aside>

      {/* MAIN AREA */}
      <div className={`sd-main${sidebarOpen ? ' sd-main-open' : ''}`}>

        {/* TOP BAR */}
        <header className="sd-topbar">
          <div className="sd-topbar-right" style={{ marginLeft: 'auto' }}>
            {/* Student dropdown — teacher only */}
            {userRole === 'teacher' && <div style={{ position: 'relative' }}>
              <button
                onClick={() => setStudentDropOpen(o => !o)}
                onBlur={() => setTimeout(() => setStudentDropOpen(false), 150)}
                className="sd-wipe-btn"
                style={{ padding: '7px 14px', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <span>{selectedStudent
                  ? `${selectedStudent.firstName}${selectedStudent.rollNumber ? ' · Roll ' + selectedStudent.rollNumber : ''}${selectedStudent.classStudying ? ' · ' + selectedStudent.classStudying : ''}`
                  : `Students (${allStudents.length})`} {studentDropOpen ? '▲' : '▼'}</span>
              </button>
              {studentDropOpen && (
                <div style={{ position: 'absolute', top: 'calc(100% + 6px)', right: 0, minWidth: 200, background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.10)', zIndex: 999, maxHeight: 280, overflowY: 'auto' }}>
                  {userRole === 'teacher' && selectedStudent && (
                    <div
                      onMouseDown={() => { setSelectedStudent(null); localStorage.removeItem('selectedStudent'); setStudentDropOpen(false); }}
                      style={{ padding: '10px 14px', fontSize: 12, color: '#718096', fontWeight: 600, borderBottom: '1px solid #f0f4f8', cursor: 'pointer', background: '#f7fafc' }}
                    >Clear selection</div>
                  )}
                  {allStudents.length === 0 ? (
                    <div style={{ padding: '12px 14px', fontSize: 13, color: '#a0aec0' }}>No students found</div>
                  ) : (
                    allStudents.map(s => (
                      <div
                        key={s.id}
                        onMouseDown={() => { if (userRole === 'teacher') { setSelectedStudent(s); localStorage.setItem('selectedStudent', JSON.stringify(s)); } setStudentDropOpen(false); }}
                        style={{ padding: '10px 14px', fontSize: 13, color: '#1a202c', fontWeight: 500, borderBottom: '1px solid #f0f4f8', cursor: userRole === 'teacher' ? 'pointer' : 'default', background: selectedStudent?.id === s.id ? '#f0f4f8' : '#fff' }}
                        onMouseEnter={e => { if (userRole === 'teacher') e.currentTarget.style.background = '#f7fafc'; }}
                        onMouseLeave={e => { if (userRole === 'teacher') e.currentTarget.style.background = selectedStudent?.id === s.id ? '#f0f4f8' : '#fff'; }}
                      >
                        <span style={{ fontWeight: 600 }}>{s.firstName} {s.lastName || ''}</span>
                        {s.rollNumber && <span style={{ fontSize: 11, color: '#a0aec0', marginLeft: 6 }}>· Roll {s.rollNumber}</span>}
                        {s.classStudying && <span style={{ fontSize: 11, color: '#a0aec0', marginLeft: 6 }}>· Class {s.classStudying}</span>}
                        {s.email && <div style={{ fontSize: 11, color: '#a0aec0', marginTop: 1 }}>{s.email}</div>}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>}

            <button
              className="sd-wipe-btn sd-wipe-topbar"
              onClick={() => navigate('/')}
              style={{ padding: '7px 14px', borderRadius: 8 }}
            ><span>Back to Home</span></button>
            <div
              className="sd-avatar"
              style={{ cursor: 'pointer' }}
              onClick={() => { if (userRole === 'student') navigate('/student-profile'); else if (userRole === 'teacher') navigate('/teacher-profile'); }}
              title={userRole === 'student' ? 'Go to Profile' : 'Go to Teacher Profile'}
            >
              {studentData?.recentPhotoPath ? (
                <ProfileImage
                  src={`${BASE}/api/students/files?path=${encodeURIComponent(studentData.recentPhotoPath)}&t=${studentData.id}`}
                  fallback={studentData?.firstName?.charAt(0) || '?'}
                />
              ) : (
                <span>{studentData?.firstName?.charAt(0) || '?'}</span>
              )}
            </div>
          </div>
        </header>

        {/* CONTENT */}
        <main className="sd-content">
          {/* SETTINGS PAGE */}
          {activeNav === 'config' && (
            <SettingsPage studentData={studentData} onStudentUpdate={setStudentData} userRole={userRole} targetStudentId={targetStudentId} />
          )}

          {/* CLASS PAGE */}
          {activeNav === 'class' && <CourseHubPage studentData={studentData} userRole={userRole} targetStudentId={targetStudentId} />}

          {/* GRADES PAGE */}
          {activeNav === 'grades' && <GradesPage studentData={studentData} userRole={userRole} targetStudentId={targetStudentId} />}

          {/* FILES PAGE */}
          {activeNav === 'files' && <FilesPage studentData={studentData} userRole={userRole} targetStudentId={targetStudentId} />}

          {activeNav === 'home' && <HomeDashboard studentData={studentData} navigate={navigate} onGoToGrades={() => setActiveNav('grades')} userRole={userRole} targetStudentId={targetStudentId} />}

        </main>
      </div>
    </div>
  );
}

export default StudentDashboard;

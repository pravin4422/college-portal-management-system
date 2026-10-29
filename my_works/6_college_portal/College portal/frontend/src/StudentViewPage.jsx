import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import './css/studentviewpage.css';

const BASE = 'https://studentportal-production-3f43.up.railway.app';

function PhotoAvatar({ path, name }) {
  const [failed, setFailed] = useState(false);
  if (path && !failed) {
    return (
      <img
        src={`${BASE}/api/students/files?path=${encodeURIComponent(path)}`}
        alt={name}
        className="svp-avatar-img"
        onError={() => setFailed(true)}
      />
    );
  }
  return <div className="svp-avatar-fallback">{name?.charAt(0) || '?'}</div>;
}

function InfoRow({ label, value }) {
  return (
    <div className="svp-info-row">
      <span className="svp-info-label">{label}</span>
      <span className="svp-info-value">{value || '—'}</span>
    </div>
  );
}

export default function StudentViewPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [student, setStudent]       = useState(null);
  const [loading, setLoading]       = useState(true);
  const [semester, setSemester]     = useState({ start: '', end: '' });
  const [attendance, setAttendance] = useState([]);
  const [performance, setPerformance] = useState([]);
  const [fees, setFees]             = useState([]);
  const [gpaCalc, setGpaCalc]       = useState([]);
  const [acadDetails, setAcadDetails] = useState([]);

  const fetchDB = (type, setter) =>
    fetch(`${BASE}/api/dashboard-data?studentId=${id}&type=${type}`)
      .then(r => r.json())
      .then(d => { if (d.content !== undefined && d.content !== null) setter(d.content); })
      .catch(() => {});

  useEffect(() => {
    if (!id) return;
    fetch(`${BASE}/api/students`)
      .then(r => r.json())
      .then(data => {
        const found = (Array.isArray(data) ? data : []).find(s => String(s.id) === String(id));
        setStudent(found || null);
      })
      .catch(() => setStudent(null))
      .finally(() => setLoading(false));

    fetchDB('semester',     d => setSemester(d || { start: '', end: '' }));
    fetchDB('attendance',   d => setAttendance(Array.isArray(d) ? d : []));
    fetchDB('performance',  d => setPerformance(Array.isArray(d) ? d : []));
    fetchDB('fees',         d => setFees(Array.isArray(d) ? d : []));
    fetchDB('gpa_calc',     d => setGpaCalc(Array.isArray(d) ? d : []));
    fetchDB('acad_details', d => setAcadDetails(Array.isArray(d) ? d : []));
  }, [id]);

  // ── Semester data ──
  const now        = new Date();
  const semStart   = semester.start ? new Date(semester.start) : null;
  const semEnd     = semester.end   ? new Date(semester.end)   : null;
  const totalDays  = semStart && semEnd ? Math.max(1, Math.round((semEnd - semStart) / 86400000)) : 1;
  const elapsed    = semStart ? Math.min(totalDays, Math.max(0, Math.round((now - semStart) / 86400000))) : 0;
  const daysLeft   = Math.max(0, totalDays - elapsed);
  const timePct    = Math.round((elapsed / totalDays) * 100);

  // ── Attendance overall ──
  const totalAttended = attendance.reduce((a, c) => a + Number(c.attended || 0), 0);
  const totalClasses  = attendance.reduce((a, c) => a + Number(c.total || 0), 0);
  const overallPct    = totalClasses > 0 ? Math.round((totalAttended / totalClasses) * 100) : 0;

  // ── GPA ──
  const gradePoints  = { O: 10, 'A+': 9, A: 8, 'B+': 7, B: 6, C: 5, F: 0 };
  const validGpa     = gpaCalc.filter(r => r.score !== '' && !isNaN(r.score));
  const projectedGpa = validGpa.length
    ? (validGpa.reduce((s, r) => s + (gradePoints[r.grade] || 0), 0) / validGpa.length).toFixed(2)
    : null;

  // ── Export ──
  const handleExport = () => {
    const today = new Date().toISOString().split('T')[0];
    const rows  = [];

    // ── Section 1: Personal Details ──
    rows.push({ Section: '--- PERSONAL DETAILS ---', Field: '', Value: '' });
    rows.push({ Section: '', Field: 'Student ID',           Value: student.id            || '' });
    rows.push({ Section: '', Field: 'First Name',           Value: student.firstName     || '' });
    rows.push({ Section: '', Field: 'Email',                Value: student.email         || '' });
    rows.push({ Section: '', Field: 'Date of Birth',        Value: student.dob           || '' });
    rows.push({ Section: '', Field: 'Gender',               Value: student.gender        || '' });
    rows.push({ Section: '', Field: 'Blood Type',           Value: student.bloodType     || '' });
    rows.push({ Section: '', Field: 'Class Studying',       Value: student.classStudying || '' });
    rows.push({ Section: '', Field: 'Address',              Value: student.address       || '' });
    rows.push({ Section: '', Field: 'Guardian Name',        Value: student.guardianName  || '' });
    rows.push({ Section: '', Field: 'Guardian Phone',       Value: student.guardianPhone || '' });
    rows.push({ Section: '', Field: 'Guardian Email',       Value: student.guardianEmail || '' });
    rows.push({ Section: '', Field: 'Student ID Document',  Value: student.studentIdDocPath ? 'Uploaded' : 'Not Uploaded' });
    rows.push({ Section: '', Field: 'Recent Photo',         Value: student.recentPhotoPath  ? 'Uploaded' : 'Not Uploaded' });
    rows.push({ Section: '', Field: '', Value: '' });

    // ── Section 2: Time Elapsed ──
    rows.push({ Section: '--- TIME ELAPSED ---', Field: '', Value: '' });
    rows.push({ Section: '', Field: 'Semester Start Date',  Value: semester.start || 'Not set' });
    rows.push({ Section: '', Field: 'Semester End Date',    Value: semester.end   || 'Not set' });
    rows.push({ Section: '', Field: 'Total Days',           Value: totalDays });
    rows.push({ Section: '', Field: 'Days Elapsed',         Value: elapsed });
    rows.push({ Section: '', Field: 'Days Left',            Value: daysLeft });
    rows.push({ Section: '', Field: 'Progress (%)',         Value: timePct + '%' });
    rows.push({ Section: '', Field: '', Value: '' });

    // ── Section 3: Attendance ──
    rows.push({ Section: '--- ATTENDANCE ---', Field: '', Value: '' });
    rows.push({ Section: '', Field: 'Overall Attended',     Value: totalAttended });
    rows.push({ Section: '', Field: 'Overall Total',        Value: totalClasses });
    rows.push({ Section: '', Field: 'Overall Percentage',   Value: overallPct + '%' });
    if (attendance.length) {
      rows.push({ Section: '', Field: '-- Subject Wise --', Value: '' });
      attendance.forEach(a => {
        const pct = Number(a.total) > 0 ? Math.round((Number(a.attended) / Number(a.total)) * 100) : 0;
        rows.push({ Section: '', Field: a.subject || '', Value: `${a.attended} / ${a.total}  (${pct}%)  ${pct >= 75 ? 'Good' : 'Low'}` });
      });
    }
    rows.push({ Section: '', Field: '', Value: '' });

    // ── Section 4: Course Performance ──
    rows.push({ Section: '--- COURSE PERFORMANCE ---', Field: '', Value: '' });
    if (performance.length) {
      performance.forEach(p => {
        const pct = Number(p.total) > 0 ? Math.round((Number(p.score) / Number(p.total)) * 100) : 0;
        rows.push({ Section: '', Field: p.subject || '', Value: `${p.score} / ${p.total}  (${pct}%)${p.remark ? '  Remark: ' + p.remark : ''}` });
      });
    } else {
      rows.push({ Section: '', Field: 'No performance data', Value: '' });
    }
    rows.push({ Section: '', Field: '', Value: '' });

    // ── Section 5: Fee Payments ──
    rows.push({ Section: '--- FEE PAYMENTS ---', Field: '', Value: '' });
    if (fees.length) {
      fees.forEach(f => {
        rows.push({ Section: '', Field: f.name || '', Value: `Amount: ${f.amount || ''}  |  Student: ${f.studentStatus || 'Pending'}  |  Approval: ${f.approvedByTeacher ? 'Approved' : 'Pending'}` });
      });
    } else {
      rows.push({ Section: '', Field: 'No fee records', Value: '' });
    }
    rows.push({ Section: '', Field: '', Value: '' });

    // ── Section 6: Academic Report Card ──
    rows.push({ Section: '--- ACADEMIC REPORT CARD ---', Field: '', Value: '' });
    rows.push({ Section: '', Field: 'Projected GPA', Value: projectedGpa ? projectedGpa + ' / 10' : 'N/A' });
    if (gpaCalc.length) {
      rows.push({ Section: '', Field: '-- Subject Wise --', Value: '' });
      gpaCalc.forEach(r => {
        rows.push({ Section: '', Field: r.subject || '', Value: `Score: ${r.score !== '' && r.score !== undefined ? r.score : '—'} / ${r.max || '—'}  |  Grade: ${r.grade || '—'}  |  Points: ${gradePoints[r.grade] !== undefined ? gradePoints[r.grade] : '—'}` });
      });
    } else {
      rows.push({ Section: '', Field: 'No grade data', Value: '' });
    }
    rows.push({ Section: '', Field: '', Value: '' });

    // ── Section 7: Academic Details ──
    rows.push({ Section: '--- ACADEMIC DETAILS ---', Field: '', Value: '' });
    if (acadDetails.length) {
      acadDetails.forEach(r => rows.push({ Section: '', Field: r.label || '', Value: r.value || '' }));
    } else {
      rows.push({ Section: '', Field: 'No academic details', Value: '' });
    }
    rows.push({ Section: '', Field: '', Value: '' });

    // ── Section 8: Profile & Academic Information ──
    rows.push({ Section: '--- PROFILE & ACADEMIC INFORMATION ---', Field: '', Value: '' });
    rows.push({ Section: '', Field: 'Preferred Name',      Value: student.firstName     || '' });
    rows.push({ Section: '', Field: 'School Email',        Value: student.email         || '' });
    rows.push({ Section: '', Field: 'Phone',               Value: student.guardianPhone || '' });
    rows.push({ Section: '', Field: 'Date of Birth',       Value: student.dob           || '' });
    rows.push({ Section: '', Field: 'Gender',              Value: student.gender        || '' });
    rows.push({ Section: '', Field: 'Blood Type',          Value: student.bloodType     || '' });
    rows.push({ Section: '', Field: 'Class Studying',      Value: student.classStudying || '' });
    rows.push({ Section: '', Field: 'Address',             Value: student.address       || '' });
    rows.push({ Section: '', Field: 'Guardian Name',       Value: student.guardianName  || '' });
    rows.push({ Section: '', Field: 'Guardian Phone',      Value: student.guardianPhone || '' });
    rows.push({ Section: '', Field: 'Guardian Email',      Value: student.guardianEmail || '' });
    rows.push({ Section: '', Field: 'Student ID Document', Value: student.studentIdDocPath ? 'Uploaded' : 'Not Uploaded' });
    rows.push({ Section: '', Field: 'Recent Photo',        Value: student.recentPhotoPath  ? 'Uploaded' : 'Not Uploaded' });

    const ws = XLSX.utils.json_to_sheet(rows);
    ws['!cols'] = [{ wch: 40 }, { wch: 30 }, { wch: 60 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Student Report');
    XLSX.writeFile(wb, `${student.firstName}_report_${today}.xlsx`);
  };

  if (loading) return <div className="svp-loading">Loading student record...</div>;
  if (!student) return <div className="svp-loading">Student not found.</div>;

  return (
    <div className="svp-container">

      {/* ── Top Bar ── */}
      <div className="svp-top-bar">
        <button className="svp-back-btn" onClick={() => navigate(-1)}>Back</button>
        <button className="svp-export-btn" onClick={handleExport}>Export to Excel</button>
      </div>

      {/* ── Student Header ── */}
      <div className="svp-header-info">
        <PhotoAvatar path={student.recentPhotoPath} name={student.firstName} />
        <div>
          <h1 className="svp-student-name">{student.firstName}</h1>
          <p className="svp-student-sub">{student.email || '—'} · Class {student.classStudying || '—'}</p>
        </div>
      </div>

      <div className="svp-grid">

        {/* ── 1. Personal Details ── */}
        <div className="svp-section svp-section-personal">
          <h3 className="svp-section-title">Personal Details</h3>
          <InfoRow label="Student ID"     value={student.id} />
          <InfoRow label="Date of Birth"  value={student.dob} />
          <InfoRow label="Gender"         value={student.gender} />
          <InfoRow label="Blood Type"     value={student.bloodType} />
          <InfoRow label="Class"          value={student.classStudying} />
          <InfoRow label="Address"        value={student.address} />
          <div className="svp-divider" />
          <p className="svp-sub-title">Guardian Contact</p>
          <InfoRow label="Guardian Name"  value={student.guardianName} />
          <InfoRow label="Phone"          value={student.guardianPhone} />
          <InfoRow label="Guardian Email" value={student.guardianEmail} />
          {student.studentIdDocPath && (
            <a href={`${BASE}/api/students/files?path=${encodeURIComponent(student.studentIdDocPath)}`}
              target="_blank" rel="noreferrer" className="svp-doc-link">
              View Student ID Document (PDF)
            </a>
          )}
        </div>

        {/* ── 2. Time Elapsed ── */}
        <div className="svp-section svp-section-time">
          <h3 className="svp-section-title">Time Elapsed</h3>
          {semester.start && semester.end ? (
            <>
              <InfoRow label="Semester Start" value={semester.start} />
              <InfoRow label="Semester End"   value={semester.end} />
              <InfoRow label="Days Elapsed"   value={`${elapsed} days`} />
              <InfoRow label="Days Left"      value={`${daysLeft} days`} />
              <InfoRow label="Progress"       value={`${timePct}%`} />
            </>
          ) : (
            <p className="svp-empty">No semester dates configured.</p>
          )}
        </div>

        {/* ── 3. Attendance ── */}
        <div className="svp-section svp-section-attendance">
          <h3 className="svp-section-title">Attendance</h3>
          {attendance.length === 0 ? (
            <p className="svp-empty">No attendance data.</p>
          ) : (
            <>
              <InfoRow label="Overall" value={`${overallPct}%  (${totalAttended}/${totalClasses} classes)`} />
              <div className="svp-divider" />
              <table className="svp-table">
                <thead>
                  <tr>
                    <th>Subject</th>
                    <th>Attended</th>
                    <th>Total</th>
                    <th>Percentage</th>
                  </tr>
                </thead>
                <tbody>
                  {attendance.map(a => {
                    const pct = Number(a.total) > 0
                      ? Math.round((Number(a.attended) / Number(a.total)) * 100) : 0;
                    return (
                      <tr key={a.id}>
                        <td>{a.subject}</td>
                        <td>{a.attended}</td>
                        <td>{a.total}</td>
                        <td>
                          <span className={`svp-badge ${pct < 75 ? 'svp-badge-low' : 'svp-badge-good'}`}>
                            {pct}%
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </>
          )}
        </div>

        {/* ── 4. Course Performance ── */}
        <div className="svp-section svp-section-performance">
          <h3 className="svp-section-title">Course Performance</h3>
          {performance.length === 0 ? (
            <p className="svp-empty">No performance data.</p>
          ) : (
            <table className="svp-table">
              <thead>
                <tr>
                  <th>Subject</th>
                  <th>Score</th>
                  <th>Total</th>
                  <th>Percentage</th>
                  <th>Remark</th>
                </tr>
              </thead>
              <tbody>
                {performance.map(p => {
                  const pct = Number(p.total) > 0
                    ? Math.round((Number(p.score) / Number(p.total)) * 100) : 0;
                  return (
                    <tr key={p.id}>
                      <td>{p.subject}</td>
                      <td>{p.score}</td>
                      <td>{p.total}</td>
                      <td><span className="svp-badge svp-badge-good">{pct}%</span></td>
                      <td className="svp-remark-cell">{p.remark || '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* ── 5. Fee Payments ── */}
        <div className="svp-section svp-section-fees">
          <h3 className="svp-section-title">Fee Payments</h3>
          {fees.length === 0 ? (
            <p className="svp-empty">No fee records.</p>
          ) : (
            <table className="svp-table">
              <thead>
                <tr>
                  <th>Fee Type</th>
                  <th>Amount</th>
                  <th>Student Status</th>
                  <th>Approval</th>
                </tr>
              </thead>
              <tbody>
                {fees.map(f => (
                  <tr key={f.id}>
                    <td>{f.name}</td>
                    <td>{f.amount}</td>
                    <td>
                      <span className={`svp-badge ${f.studentStatus === 'Paid' ? 'svp-badge-paid' : 'svp-badge-pending'}`}>
                        {f.studentStatus || 'Pending'}
                      </span>
                    </td>
                    <td>
                      <span className={`svp-badge ${f.approvedByTeacher ? 'svp-badge-approved' : 'svp-badge-pending'}`}>
                        {f.approvedByTeacher ? 'Approved' : 'Pending'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* ── 6. Academic Report Card ── */}
        <div className="svp-section svp-section-grades">
          <h3 className="svp-section-title">Academic Report Card</h3>
          {gpaCalc.length === 0 ? (
            <p className="svp-empty">No grade data.</p>
          ) : (
            <>
              {projectedGpa && (
                <div className="svp-gpa-row">
                  <span className="svp-gpa-label">Projected GPA</span>
                  <span className="svp-gpa-value">{projectedGpa} / 10</span>
                </div>
              )}
              <table className="svp-table">
                <thead>
                  <tr>
                    <th>Subject</th>
                    <th>Score</th>
                    <th>Max</th>
                    <th>Grade</th>
                    <th>Points</th>
                  </tr>
                </thead>
                <tbody>
                  {gpaCalc.map(r => (
                    <tr key={r.id}>
                      <td>{r.subject || '—'}</td>
                      <td>{r.score !== '' ? r.score : '—'}</td>
                      <td>{r.max}</td>
                      <td><span className="svp-grade-pill">{r.grade}</span></td>
                      <td>{gradePoints[r.grade] ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </div>

        {/* ── 7. Academic Details ── */}
        <div className="svp-section svp-section-acaddetails">
          <h3 className="svp-section-title">Academic Details</h3>
          {acadDetails.length === 0 ? (
            <p className="svp-empty">No academic details.</p>
          ) : (
            acadDetails.map(r => <InfoRow key={r.id} label={r.label} value={r.value} />)
          )}
        </div>

        {/* ── 8. Profile & Academic Information ── */}
        <div className="svp-section svp-section-profile">
          <h3 className="svp-section-title">Profile & Academic Information</h3>
          <InfoRow label="Preferred Name" value={student.firstName} />
          <InfoRow label="School Email"   value={student.email} />
          <InfoRow label="Phone"          value={student.guardianPhone} />
          <InfoRow label="Date of Birth"  value={student.dob} />
          <InfoRow label="Gender"         value={student.gender} />
          <InfoRow label="Blood Type"     value={student.bloodType} />
          <InfoRow label="Address"        value={student.address} />
          <div className="svp-divider" />
          <p className="svp-sub-title">Uploaded Files</p>
          <div className="svp-file-item">
            <span className="svp-file-tag">PDF</span>
            <span>Student ID Document</span>
            <span className="svp-file-status">{student.studentIdDocPath ? 'Uploaded' : 'Not uploaded'}</span>
            {student.studentIdDocPath && (
              <a href={`${BASE}/api/students/files?path=${encodeURIComponent(student.studentIdDocPath)}`}
                target="_blank" rel="noreferrer" className="svp-file-view">View</a>
            )}
          </div>
          <div className="svp-file-item">
            <span className="svp-file-tag">IMG</span>
            <span>Recent Photo</span>
            <span className="svp-file-status">{student.recentPhotoPath ? 'Uploaded' : 'Not uploaded'}</span>
            {student.recentPhotoPath && (
              <a href={`${BASE}/api/students/files?path=${encodeURIComponent(student.recentPhotoPath)}`}
                target="_blank" rel="noreferrer" className="svp-file-view">View</a>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

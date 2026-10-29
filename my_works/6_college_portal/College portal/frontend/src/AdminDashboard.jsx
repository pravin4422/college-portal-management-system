import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './css/admindashboard.css';

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

function StatCard({ icon, label, value }) {
  return (
    <div className="ad-stat-card">
      <div className="ad-stat-icon"><i className={icon}></i></div>
      <div className="ad-stat-info">
        <span className="ad-stat-value">{value}</span>
        <span className="ad-stat-label">{label}</span>
      </div>
    </div>
  );
}

function TeacherCard({ teacher }) {
  const navigate = useNavigate();
  const displayName = teacher.name || '—';
  const initial = displayName.charAt(0).toUpperCase();
  const email = teacher.userEmail || '';
  return (
    <div
      className="ad-profile-card"
      style={{ cursor: email ? 'pointer' : 'default' }}
      onClick={() => email && navigate(`/teacher-profile/${encodeURIComponent(email)}`)}
    >
      <div className="ad-card-avatar"><span>{initial}</span></div>
      <div className="ad-card-info">
        <p className="ad-card-name">{displayName}</p>
        <p className="ad-card-sub">Class: {teacher.classTeacherOf || '—'}</p>
        <p className="ad-card-meta">{teacher.experience ? `${teacher.experience} yrs exp` : '—'}</p>
      </div>
      <span className="ad-card-badge">Teacher</span>
    </div>
  );
}

function StudentCard({ student, rank }) {
  const navigate = useNavigate();
  const hasClass = !!student.classStudying;
  return (
    <div
      className="ad-profile-card"
      style={{ cursor: hasClass ? 'pointer' : 'default' }}
      onClick={() => hasClass && navigate(`/student-view/${student.id}`)}
    >
      {rank && <span className="ad-rank-badge">{rank}</span>}
      <div className="ad-card-avatar">
        {student.recentPhotoPath ? (
          <ProfileImage
            src={`${BASE}/api/students/files?path=${encodeURIComponent(student.recentPhotoPath)}&t=${student.id}`}
            fallback={student.firstName?.charAt(0) || 'S'}
          />
        ) : (
          <span>{student.firstName?.charAt(0) || 'S'}</span>
        )}
      </div>
      <div className="ad-card-info">
        <p className="ad-card-name">{student.firstName} {student.lastName || ''}</p>
        <p className="ad-card-sub">Class: {student.classStudying || '—'}</p>
        <p className="ad-card-meta">{student.email || '—'}</p>
      </div>
      <span className="ad-card-badge">Student</span>
    </div>
  );
}

function OverviewPage({ students, teachers }) {
  const navigate = useNavigate();
  return (
    <div className="ad-section">
      <div className="ad-greeting">
        <h2>Welcome, Principal</h2>
      </div>

      <div className="ad-stats-row">
        <StatCard icon="bx bxs-graduation" label="Total Students" value={students.length} />
        <StatCard icon="bx bxs-user-badge" label="Total Teachers" value={teachers.length} />
        <StatCard icon="bx bxs-book-open" label="Active Classes" value={Math.max(1, Math.ceil(students.length / 30))} />
        <StatCard icon="bx bxs-trophy" label="Top Performers" value={Math.min(5, students.length)} />
      </div>

      <div className="ad-section-block">
        <div className="ad-block-header">
          <h3>Top Teachers</h3>
          <span className="ad-block-count">{teachers.slice(0, 4).length} shown</span>
        </div>
        {teachers.length === 0 ? (
          <p className="ad-empty">No teacher records found.</p>
        ) : (
          <div className="ad-cards-grid">
            {teachers.slice(0, 4).map((t, i) => {
              const tEmail = t.userEmail || '';
              return (
              <div key={t.id || i} className="ad-profile-card"
                style={{ cursor: tEmail ? 'pointer' : 'default' }}
                onClick={() => tEmail && navigate(`/teacher-profile/${encodeURIComponent(tEmail)}`)}>
                <span className="ad-rank-badge">{i + 1}</span>
                <div className="ad-card-avatar"><span>{(t.name || 'T').charAt(0).toUpperCase()}</span></div>
                <div className="ad-card-info">
                  <p className="ad-card-name">{t.name || '—'}</p>
                  <p className="ad-card-sub">Class: {t.classTeacherOf || '—'}</p>
                  <p className="ad-card-meta">{t.experience ? `${t.experience} yrs exp` : '—'}</p>
                </div>
                <span className="ad-card-badge">Teacher</span>
              </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="ad-section-block">
        <div className="ad-block-header">
          <h3> Top Rank Students</h3>
          <span className="ad-block-count">{students.slice(0, 5).length} shown</span>
        </div>
        {students.length === 0 ? (
          <p className="ad-empty">No student records found.</p>
        ) : (
          <div className="ad-cards-grid">
            {students.slice(0, 5).map((s, i) => (
              <StudentCard key={s.id || i} student={s} rank={i + 1} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function TeachersPage({ teachers }) {
  const [search, setSearch] = useState('');
  const filtered = teachers.filter(t =>
    `${t.name || ''} ${t.firstName || ''} ${t.lastName || ''} ${t.email || ''} ${t.idNo || ''}`.toLowerCase().includes(search.toLowerCase())
  );
  return (
    <div className="ad-section">
      <div className="ad-page-header">
        <h2>Teacher Profiles</h2>
        <input className="ad-search-input" placeholder="Search teachers..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>
      {filtered.length === 0 ? <p className="ad-empty">No teachers found.</p> : (
        <div className="ad-cards-grid">
          {filtered.map((t, i) => <TeacherCard key={t.id || i} teacher={t} />)}
        </div>
      )}
    </div>
  );
}

function StudentsPage({ students }) {
  const [expandedStd, setExpandedStd] = useState(null);

  // extract leading number from classStudying e.g. "10A" -> 10, "9" -> 9
  const getStd = (cls) => {
    const m = (cls || '').trim().match(/^(\d+)/);
    return m ? parseInt(m[1], 10) : null;
  };

  // build map: standard -> students[]
  const stdMap = {};
  students.forEach(s => {
    const std = getStd(s.classStudying);
    if (std === null) return;
    if (!stdMap[std]) stdMap[std] = [];
    stdMap[std].push(s);
  });
  const standards = Object.keys(stdMap).map(Number).sort((a, b) => a - b);

  return (
    <div className="ad-section">
      <div className="ad-page-header">
        <h2>Student Profiles</h2>
        <span className="ad-block-count">{students.length} total students</span>
      </div>
      {standards.length === 0 ? <p className="ad-empty">No students found.</p> : (
        <div className="ad-std-grid">
          {standards.map(std => {
            const list = stdMap[std];
            const isOpen = expandedStd === std;
            return (
              <div key={std} className="ad-std-block">
                <div
                  className={`ad-std-card${isOpen ? ' active' : ''}`}
                  onClick={() => setExpandedStd(isOpen ? null : std)}
                >
                  <span className="ad-std-label">Class {std}</span>
                  <span className="ad-std-count">{list.length} Students</span>
                  <i className={`bx ${isOpen ? 'bx-chevron-up' : 'bx-chevron-down'} ad-std-chevron`}></i>
                </div>
                {isOpen && (
                  <div className="ad-cards-grid" style={{ marginTop: 12 }}>
                    {list.map((s, i) => <StudentCard key={s.id || i} student={s} />)}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function TopRankPage({ students }) {
  const navigate = useNavigate();
  return (
    <div className="ad-section">
      <div className="ad-page-header">
        <h2>Top Rank Students</h2>
        <span className="ad-block-count">{Math.min(10, students.length)} students</span>
      </div>
      {students.length === 0 ? <p className="ad-empty">No student records found.</p> : (
        <div className="ad-rank-list">
          {students.slice(0, 10).map((s, i) => (
            <div key={s.id || i} className="ad-rank-row"
              style={{ cursor: s.classStudying ? 'pointer' : 'default' }}
              onClick={() => s.classStudying && navigate(`/student-view/${s.id}`)}>
              <span className="ad-rank-num">{i + 1}</span>
              <div className="ad-card-avatar ad-rank-avatar">
                {s.recentPhotoPath ? (
                  <ProfileImage src={`${BASE}/api/students/files?path=${encodeURIComponent(s.recentPhotoPath)}&t=${s.id}`} fallback={s.firstName?.charAt(0) || 'S'} />
                ) : <span>{s.firstName?.charAt(0) || 'S'}</span>}
              </div>
              <div className="ad-rank-info">
                <span className="ad-card-name">{s.firstName} {s.lastName || ''}</span>
                <span className="ad-card-sub">Class: {s.classStudying || '—'} &nbsp;·&nbsp; {s.email || '—'}</span>
              </div>
              <span className="ad-card-badge">Student</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function TopTeachersPage({ teachers }) {
  const navigate = useNavigate();
  return (
    <div className="ad-section">
      <div className="ad-page-header">
        <h2>Top Teacher Profiles</h2>
        <span className="ad-block-count">{Math.min(10, teachers.length)} teachers</span>
      </div>
      {teachers.length === 0 ? <p className="ad-empty">No teacher records found.</p> : (
        <div className="ad-rank-list">
          {teachers.slice(0, 10).map((t, i) => {
            const tEmail = t.userEmail || '';
            return (
            <div key={t.id || i} className="ad-rank-row"
              style={{ cursor: tEmail ? 'pointer' : 'default' }}
              onClick={() => tEmail && navigate(`/teacher-profile/${encodeURIComponent(tEmail)}`)}>
              <span className="ad-rank-num">{i + 1}</span>
              <div className="ad-card-avatar ad-rank-avatar"><span>{(t.name || 'T').charAt(0).toUpperCase()}</span></div>
              <div className="ad-rank-info">
                <span className="ad-card-name">{t.name || '—'}</span>
                <span className="ad-card-sub">Class: {t.classTeacherOf || '—'} &nbsp;·&nbsp; {t.experience ? `${t.experience} yrs exp` : '—'}</span>
              </div>
              <span className="ad-card-badge">Teacher</span>
            </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeNav, setActiveNav] = useState('overview');
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`${BASE}/api/students`).then(r => r.json()).catch(() => []),
      fetch(`${BASE}/api/teachers`).then(r => r.json()).catch(() => [])
    ]).then(([studentsData, teachersData]) => {
      setStudents(Array.isArray(studentsData) ? studentsData : []);
      setTeachers(Array.isArray(teachersData) ? teachersData : []);
    }).finally(() => setLoading(false));
  }, []);

  const navItems = [
    { key: 'overview',     label: 'Overview',    icon: 'bx bx-grid-alt' },
    { key: 'teachers',     label: 'Teachers',    icon: 'bx bxs-user-badge' },
    { key: 'students',     label: 'Students',    icon: 'bx bxs-graduation' },
    { key: 'top-teachers', label: 'Top Teachers',icon: 'bx bxs-star' },
    { key: 'top-students', label: 'Top Students',icon: 'bx bxs-medal' },
  ];

  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    navigate('/login');
  };

  if (loading) return <div className="sd-loading">Loading admin dashboard...</div>;

  return (
    <div className="sd-layout">

      <aside className={`sd-sidebar${sidebarOpen ? ' open' : ''}`}>
        <div className="sd-logo-details">
          <i className="bx bxs-school sd-logo-icon"></i>
          <span className="sd-logo">Admin Portal</span>
          <button className="sd-toggle-btn" onClick={() => setSidebarOpen(o => !o)}>
            <i className={sidebarOpen ? 'bx bx-menu-alt-right' : 'bx bx-menu'}></i>
          </button>
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
              <span>P</span>
            </div>
            {sidebarOpen && (
              <div style={{ overflow: 'hidden' }}>
                <p className="sd-profile-name">Principal</p>
                <p className="sd-profile-role">Admin</p>
              </div>
            )}
          </div>
          <button className="sd-logout-btn" onClick={handleLogout} title="Logout">
            <i className="bx bx-log-out"></i>
          </button>
        </div>
      </aside>

      <div className={`sd-main${sidebarOpen ? ' sd-main-open' : ''}`}>
        <header className="sd-topbar">
          <div className="ad-topbar-title">
            <i className="bx bxs-school" style={{ fontSize: 22 }}></i>
            <span>Principal Dashboard</span>
          </div>
          <div className="sd-topbar-right">
            <button
              className="sd-wipe-btn sd-wipe-topbar"
              onClick={() => navigate('/')}
              style={{ padding: '7px 14px', borderRadius: 8 }}
            ><span>Back to Home</span></button>
            <div className="sd-avatar"><span>P</span></div>
          </div>
        </header>

        <main className="sd-content">
          {activeNav === 'overview'     && <OverviewPage students={students} teachers={teachers} />}
          {activeNav === 'teachers'     && <TeachersPage teachers={teachers} />}
          {activeNav === 'students'     && <StudentsPage students={students} />}
          {activeNav === 'top-teachers' && <TopTeachersPage teachers={teachers} />}
          {activeNav === 'top-students' && <TopRankPage students={students} />}
        </main>
      </div>
    </div>
  );
}

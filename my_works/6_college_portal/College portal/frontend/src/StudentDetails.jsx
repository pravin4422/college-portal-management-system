import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { useNavbar } from './navbar/NavbarContext';
import './css/studentdetails.css';

const BASE = 'https://studentportal-production-3f43.up.railway.app';

function StudentPhoto({ path, name }) {
  const [failed, setFailed] = useState(false);
  return (
    <div className="student-photo">
      {path && !failed ? (
        <img
          src={`${BASE}/api/students/files?path=${encodeURIComponent(path)}`}
          alt={name}
          className="student-avatar"
          onError={() => setFailed(true)}
        />
      ) : (
        <div className="avatar-fallback">{failed ? 'No Image Found' : 'No Image'}</div>
      )}
    </div>
  );
}

function StudentDetails() {
  const [students, setStudents] = useState([]);
  const navigate = useNavigate();
  const { setNavActions } = useNavbar();

  const [editingId, setEditingId] = useState(null);
  const [editFormData, setEditFormData] = useState({});

  // Fetch from Java Tomcat Context Path instead of port 5000
  const handleExport = () => {
    if (students.length === 0) {
      alert('No student records to export.');
      return;
    }

    const rows = students.map((s, i) => ({
      'S.No': i + 1,
      'Student ID': s.id || '',
      'First Name': s.firstName || '',
      'Class': s.classStudying || '',
      'Date of Birth': s.dob || '',
      'Gender': s.gender || '',
      'Blood Type': s.bloodType || '',
      'Address': s.address || '',
      'Guardian Name': s.guardianName || '',
      'Guardian Phone': s.guardianPhone || '',
      'Guardian Email': s.guardianEmail || ''
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);

    // Set column widths
    worksheet['!cols'] = [
      { wch: 6 },   // S.No
      { wch: 12 },  // Student ID
      { wch: 18 },  // First Name
      { wch: 10 },  // Class
      { wch: 15 },  // Date of Birth
      { wch: 10 },  // Gender
      { wch: 12 },  // Blood Type
      { wch: 30 },  // Address
      { wch: 20 },  // Guardian Name
      { wch: 16 },  // Guardian Phone
      { wch: 25 },  // Guardian Email
    ];

    // Bold + background color on header row
    const headerKeys = Object.keys(rows[0]);
    headerKeys.forEach((key, colIndex) => {
      const cellRef = XLSX.utils.encode_cell({ r: 0, c: colIndex });
      if (worksheet[cellRef]) {
        worksheet[cellRef].s = {
          font: { bold: true, color: { rgb: 'FFFFFF' } },
          fill: { fgColor: { rgb: '2D3748' } },
          alignment: { horizontal: 'center' }
        };
      }
    });

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Students');

    const today = new Date().toISOString().split('T')[0];
    XLSX.writeFile(workbook, `student_profiles_${today}.xlsx`);
  };

  const fetchRecords = () => {
      fetch(`${BASE}/api/students`)
      .then(res => res.json())
      .then(data => setStudents(Array.isArray(data) ? data : []))
      .catch(err => console.error("Error loading records:", err));
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  useEffect(() => {
    setNavActions(
      <button onClick={() => navigate('/')} className="navbar-btn navbar-login"><span>Back to Home</span></button>
    );
    return () => setNavActions(null);
  }, [navigate]);

  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this student profile?")) {
      fetch(`${BASE}/api/students?id=${id}`, {
        method: 'DELETE'
      })
        .then(res => {
          if (res.ok) {
            setStudents(students.filter(student => student.id !== id));
          } else {
            alert("Failed to delete the record from the database.");
          }
        })
        .catch(err => console.error("Error deleting record:", err));
    }
  };

  const handleEditClick = (student) => {
    setEditingId(student.id);
    setEditFormData({
      firstName: student.firstName || '',
      classStudying: student.classStudying || '',
      dob: student.dob || '',
      gender: student.gender || '',
      bloodType: student.bloodType || '',
      address: student.address || '',
      guardianName: student.guardianName || '',
      guardianPhone: student.guardianPhone || '',
      guardianEmail: student.guardianEmail || ''
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({ ...prev, [name]: value }));
  };

   const handleSaveSubmit = (id) => {
    // Standardize object layout to match what the Java Servlet getReader routine extracts
    const jsonUpdatePayload = {
      firstName: editFormData.firstName.trim(),
      dob: editFormData.dob,
      gender: editFormData.gender,
      classStudying: editFormData.classStudying.trim(),
      bloodType: editFormData.bloodType.trim(),
      address: editFormData.address.trim(),
      guardianName: editFormData.guardianName.trim(),
      guardianPhone: editFormData.guardianPhone.trim(),
      guardianEmail: editFormData.guardianEmail.trim()
    };

    fetch(`${BASE}/api/students?id=${id}`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json' 
      },
      body: JSON.stringify(jsonUpdatePayload)
    })
      .then(res => {
        // Handle responses whether your backend prints raw text strings or JSON payloads
        return res.text().then(text => {
          try {
            return JSON.parse(text);
          } catch(e) {
            return { success: res.ok, message: text };
          }
        });
      })
      .then(data => {
        if (data.success || data.status === "success") {
          // Instantly patch the specific student entry in the local application state array
          setStudents(students.map(s => s.id === id ? { ...s, ...editFormData } : s));
          setEditingId(null);
          alert("Student record updated successfully!");
        } else {
          alert(data.error || "Update transaction failed on server.");
        }
      })
      .catch(err => {
        console.error("Error updating record inside details grid view:", err);
        alert("Network error processing update sequence.");
      });
  };


  return (
    <div className="student-details-container">
      <div className="student-title-row">
        <h2 className="student-title">Registered Student Profiles</h2>
        <button onClick={handleExport} className="btn btn-export"><span>Export to Excel</span></button>
      </div>
      <div className="student-grid">
        {students.length === 0 ? (
          <p className="no-records">No records found.</p>
        ) : (
          students.map((s) => (
            <div key={s.id} className="student-card">
              
              <StudentPhoto path={s.recentPhotoPath} name={s.firstName} />
              
              {editingId === s.id ? (
                <>
                  <div className="form-group">
                    <label>First Name</label>
                    <input type="text" name="firstName" value={editFormData.firstName} onChange={handleInputChange} />
                  </div>

                  <div className="card-section">
                    <h5>Personal Details</h5>
                    <label>Class</label>
                    <input type="text" name="classStudying" value={editFormData.classStudying} onChange={handleInputChange} />
                    
                    <label>DOB</label>
                    <input type="date" name="dob" value={editFormData.dob} onChange={handleInputChange} />
                    
                    <label>Gender</label>
                    <input type="text" name="gender" value={editFormData.gender} onChange={handleInputChange} />
                    
                    <label>Blood Type</label>
                    <input type="text" name="bloodType" value={editFormData.bloodType} onChange={handleInputChange} />
                    
                    <label>Address</label>
                    <textarea name="address" value={editFormData.address} onChange={handleInputChange} />
                  </div>

                  <div className="card-section">
                    <h5>Guardian Contact Info</h5>
                    <label>Guardian Name</label>
                    <input type="text" name="guardianName" value={editFormData.guardianName} onChange={handleInputChange} />
                    
                    <label>Phone</label>
                    <input type="text" name="guardianPhone" value={editFormData.guardianPhone} onChange={handleInputChange} />
                    
                    <label>Email</label>
                    <input type="email" name="guardianEmail" value={editFormData.guardianEmail} onChange={handleInputChange} />
                  </div>

                  <div className="card-actions">
                    <button onClick={() => setEditingId(null)} className="btn btn-secondary"><span>Cancel</span></button>
                    <button onClick={() => handleSaveSubmit(s.id)} className="btn btn-success"><span>Save</span></button>
                  </div>
                </>
              ) : (
                <>
                  <h4 className="student-name">{s.firstName}</h4>  
                  
                  <div className="card-section">
                    <h5>Personal Details</h5>
                    <p><strong>Class:</strong> {s.classStudying}</p>
                    <p><strong>DOB:</strong> {s.dob}</p>
                    <p><strong>Gender:</strong> {s.gender}</p>
                    <p><strong>Blood Type:</strong> {s.bloodType}</p>
                    <p><strong>Address:</strong> {s.address}</p>
                  </div>

                  <div className="card-section">
                    <h5>Guardian Contact Info</h5>
                    <p><strong>Guardian Name:</strong> {s.guardianName}</p>
                    <p><strong>Phone Number:</strong> {s.guardianPhone}</p>
                    <p><strong>Email ID:</strong> {s.guardianEmail}</p>
                  </div>

                  <div className="card-section">
                    <h5>Uploaded Documents</h5>
                    {s.studentIdDocPath ? (
                      <a href={`${BASE}/api/students/files?path=${encodeURIComponent(s.studentIdDocPath)}`} target="_blank" rel="noreferrer" className="doc-link">
                        View Student ID Document (PDF)
                      </a>
                    ) : (
                      <span className="no-file">No document attached</span>
                    )}
                  </div>

                  <div className="card-actions">
                    <button onClick={() => handleEditClick(s)} className="btn btn-primary"><span>Edit</span></button>
                    <button onClick={() => navigate(`/student-view/${s.id}`)} className="btn btn-view"><span>View</span></button>
                    <button onClick={() => handleDelete(s.id)} className="btn btn-danger"><span>Delete Profile</span></button>
                  </div>
                </>
              )}

            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default StudentDetails;

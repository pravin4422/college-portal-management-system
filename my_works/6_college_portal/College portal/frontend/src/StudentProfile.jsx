import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './css/studentprofile.css';

const BASE = 'https://studentportal-production-3f43.up.railway.app';

function StudentProfile() {
  const navigate = useNavigate();
  const [studentData, setStudentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [photoFailed, setPhotoFailed] = useState(false);

  // States handling inline profile modifications
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState({});
  const [studentIdDoc, setStudentIdDoc] = useState(null);
  const [recentPhoto, setRecentPhoto] = useState(null);

  const fetchIndividualProfile = async () => {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    const loggedInEmail = localStorage.getItem('userEmail');

    if (!isLoggedIn || !loggedInEmail) {
      alert('Please log in first to access your profile.');
      navigate('/');
      return;
    }

    try {
      const response = await fetch(`https://studentportal-production-3f43.up.railway.app/api/students?email=${encodeURIComponent(loggedInEmail)}`);

      if (response.ok) {
        const data = await response.json();
        let record = null;

        if (Array.isArray(data) && data.length > 0) {
          record = data[0];
        } else if (data && !Array.isArray(data) && Object.keys(data).length > 0) {
          record = data;
        }

        if (record) {
          setStudentData(record);
          setPhotoFailed(false);
          localStorage.setItem('hasExistingProfile', 'true');
          setEditFormData({
            firstName: record.firstName || '',
            dob: record.dob || '',
            gender: record.gender || '',
            classStudying: record.classStudying || '',
            bloodType: record.bloodType || '',
            address: record.address || '',
            guardianName: record.guardianName || '',
            guardianPhone: record.guardianPhone || '',
            guardianEmail: record.guardianEmail || ''
          });
        } else {
          localStorage.setItem('hasExistingProfile', 'false');
          setStudentData(null);
        }
      } else {
        localStorage.setItem('hasExistingProfile', 'false');
        setStudentData(null);
      }
    } catch (err) {
      console.error('Error connecting to backend server:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIndividualProfile();
  }, [navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({ ...prev, [name]: value }));
  };
  const handleSaveSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

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

    try {
      const response = await fetch(`https://studentportal-production-3f43.up.railway.app/api/students?id=${studentData.id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify(jsonUpdatePayload)
      });

      const responseText = await response.text();
      let data = {};
      if (responseText) {
        try { data = JSON.parse(responseText); } catch (e) {}
      }

      if (response.ok || data.success === true) {
        alert("profile details updated successfully");
        setIsEditing(false);
        setStudentIdDoc(null);
        setRecentPhoto(null);
        await fetchIndividualProfile(); 
      } else {
        alert(data.error || 'Failed to save profile changes.');
      }
    } catch (err) {
      console.error("Profile error:", err);
      alert('Network error connecting to system backend database path');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProfile = async () => {
    if (window.confirm("want to delete your student profile permanently.")) {
      try {
        const response = await fetch(`https://studentportal-production-3f43.up.railway.app/api/students?id=${studentData.id}`, {
          method: 'DELETE'
        });

        if (response.ok) {
          alert("Your profile has been deleted successfully.");
          localStorage.setItem('hasExistingProfile', 'false');
          navigate('/'); 
        } else {
          alert("Failed to delete profile record from database server.");
        }
      } catch (err) {
        alert("Network error processing deletion action");
      }
    }
  };

  if (loading) {
    return <div className="dashboard-loading">Processing your request...</div>;
  }
  return (
    <div className="dashboard-container">
      <div className="dashboard-wrapper">
        <div className="dashboard-box">
          <div className="dashboard-top-bar">
            <button
              onClick={() => navigate(-1)}
              style={{ padding: '8px 18px', background: '#fff', color: '#1a202c', fontSize: 13, fontWeight: 600, border: '1.5px solid #1a202c', borderRadius: 8, cursor: 'pointer', marginRight: 'auto' }}
            ><span>Back</span></button>
            {!isEditing && (
              <button onClick={() => setIsEditing(true)} className="dashboard-nav-btn dashboard-edit-btn"><span>Edit Profile</span></button>
            )}
            <button onClick={handleDeleteProfile} className="dashboard-nav-btn dashboard-logout-btn"><span>Delete Profile</span></button>
          </div>
          <h2>
            <button
              onClick={() => navigate('/student-dashboard')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 'inherit', fontWeight: 'inherit', color: 'inherit', padding: 0 }}
            >
              Student Dashboard
            </button>
            {isEditing && " (Editing Mode)"}
          </h2>

          {studentData ? (
            isEditing ? (
              /* --- EDITING LAYOUT MODE VIEW --- */
              <form className="dashboard-edit-form" onSubmit={handleSaveSubmit}>
                <div className="dashboard-grid">
                  <div className="dashboard-info-group">
                    <label>First Name</label>
                    <input type="text" name="firstName" value={editFormData.firstName} onChange={handleInputChange} required />
                  </div>

                  <div className="dashboard-info-group">
                    <label>Date of Birth</label>
                    <input type="date" name="dob" value={editFormData.dob} onChange={handleInputChange} required />
                  </div>

                  <div className="dashboard-info-group">
                    <label>Gender</label>
                    <select name="gender" value={editFormData.gender} onChange={handleInputChange} required>
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div className="dashboard-info-group">
                    <label>Class Studying</label>
                    <input type="text" name="classStudying" value={editFormData.classStudying} onChange={handleInputChange} required />
                  </div>

                  <div className="dashboard-info-group">
                    <label>Blood Type</label>
                    <input type="text" name="bloodType" value={editFormData.bloodType} onChange={handleInputChange} required />
                  </div>

                  <div className="dashboard-info-group full-width">
                    <label>Residential Address</label>
                    <textarea name="address" value={editFormData.address} onChange={handleInputChange} required />
                  </div>
                </div>

                <h3 className="dashboard-subheading">Emergency & Legal Guardian Contacts</h3>
                <div className="dashboard-grid">
                  <div className="dashboard-info-group">
                    <label>Primary Parent/Guardian Name</label>
                    <input type="text" name="guardianName" value={editFormData.guardianName} onChange={handleInputChange} required />
                  </div>

                  <div className="dashboard-info-group">
                    <label>Phone Number</label>
                    <input type="tel" name="guardianPhone" value={editFormData.guardianPhone} onChange={handleInputChange} required />
                  </div>

                  <div className="dashboard-info-group full-width">
                    <label>Guardian Email ID</label>
                    <input type="email" name="guardianEmail" value={editFormData.guardianEmail} onChange={handleInputChange} required />
                  </div>
                </div>

                <div className="dashboard-action-row">
                  <button type="button" onClick={() => setIsEditing(false)} className="dashboard-btn dashboard-cancel-btn"><span>Cancel</span></button>
                  <button type="submit" className="dashboard-btn dashboard-save-btn"><span>Save Changes</span></button>
                </div>
              </form>
            ) : (
              /* --- READ-ONLY PROFILE DISPLAY --- */
              <div className="dashboard-profile-section">
                <div className="dashboard-photo-container">
                  {studentData.recentPhotoPath && !photoFailed ? (
                    <img 
                      src={`${BASE}/api/students/files?path=${encodeURIComponent(studentData.recentPhotoPath)}&t=${studentData.id}`}
                      alt={studentData.firstName} 
                      className="dashboard-profile-img"
                      onError={() => setPhotoFailed(true)}
                    />
                  ) : (
                    <div className="dashboard-photo-placeholder">
                      {photoFailed ? 'Image Not Found' : 'No Image Uploaded'}
                    </div>
                  )}
                  <h3>{studentData.firstName}</h3>
                  <span className="dashboard-badge">Active Student Account</span>
                </div>

                <div className="dashboard-grid">
                  <div className="dashboard-info-group">
                    <label>Class Studying</label>
                    <p>{studentData.classStudying || 'Not Provided'}</p>
                  </div>
                  <div className="dashboard-info-group">
                    <label>Date of Birth</label>
                    <p>{studentData.dob || 'Not Provided'}</p>
                  </div>
                  <div className="dashboard-info-group">
                    <label>Gender</label>
                    <p>{studentData.gender || 'Not Provided'}</p>
                  </div>
                  <div className="dashboard-info-group">
                    <label>Blood Type</label>
                    <p>{studentData.bloodType || 'Not Provided'}</p>
                  </div>
                  <div className="dashboard-info-group full-width">
                    <label>Residential Address</label>
                    <p>{studentData.address || 'Not Provided'}</p>
                  </div>
                </div>

                <h3 className="dashboard-subheading">Emergency & Legal Guardian Contacts</h3>
                <div className="dashboard-grid">
                  <div className="dashboard-info-group">
                    <label>Primary Parent/Guardian Name</label>
                    <p>{studentData.guardianName || 'Not Provided'}</p>
                  </div>
                  <div className="dashboard-info-group">
                    <label>Phone Number</label>
                    <p>{studentData.guardianPhone || 'Not Provided'}</p>
                  </div>
                  <div className="dashboard-info-group full-width">
                    <label>Guardian Email ID</label>
                    <p>{studentData.guardianEmail || 'Not Provided'}</p>
                  </div>
                </div>

                <h3 className="dashboard-subheading">Verification Documents</h3>
                <div className="dashboard-document-box">
                  <label> Student ID Verification (PDF)</label>
                  {studentData.studentIdDocPath ? (
                    <a 
                      href={`${BASE}/api/students/files?path=${encodeURIComponent(studentData.studentIdDocPath)}`} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="dashboard-download-link"
                    >
                      View/Download Uploaded PDF Document
                    </a>
                  ) : (
                    <p className="no-doc-text">No document file found on server.</p>
                  )}
                </div>


              </div>
            )
          ) : (
            <div className="dashboard-error-state">
              <p>No student profile data found linked to this account.</p>
              <button onClick={() => navigate('/student-form')} className="dashboard-register-now-btn"><span>Complete Profile Registration</span></button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default StudentProfile;

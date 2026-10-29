import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import collegeImg from './assets/college.jpg';
import './css/home.css';
import Award from './assets/award.jpg'
import ecoImage from './assets/eco.jpg';
function Home() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(false);
  const userRole = localStorage.getItem('userRole'); 

  const checkProfile = async () => {
    const email = localStorage.getItem('userEmail');
    if (!email) return false;
    try {
      const res = await fetch(
        `https://studentportal-production-3f43.up.railway.app/api/students?email=${encodeURIComponent(email)}`
      );
      if (!res.ok) return false;
      const data = await res.json();
      const exists = Array.isArray(data) ? data.length > 0 : (data && Object.keys(data).length > 0);
      localStorage.setItem('hasExistingProfile', exists ? 'true' : 'false');
      return exists;
    } catch {
      return localStorage.getItem('hasExistingProfile') === 'true';
    }
  };

  const handleFormGridClick = async () => {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    if (!isLoggedIn) {
      alert('Please log in first to access the Student Registration Form.');
      navigate('/signup');
      return;
    }
        if (userRole !== 'student') {
      alert('Only students can access the Student Registration Form.');
      return;
    }

    setChecking(true);
    const hasProfile = await checkProfile();
    setChecking(false);
    if (hasProfile) {
      alert('You already have a profile. Redirecting to Dashboard...');
      navigate('/student-dashboard');
    } else {
      navigate('/student-form');
    }
  };

  const handleDashboardGridClick = async () => {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    if (!isLoggedIn) {
      alert('Please log in first to access the Student Dashboard.');
      navigate('/signup');
      return;
    }
    if (userRole === 'teacher') {
      navigate('/student-dashboard');
      return;
    }
    setChecking(true);
    const hasProfile = await checkProfile();
    setChecking(false);
    if (hasProfile) {
      navigate('/student-dashboard');
    } else {
      alert('No profile found. Please fill the Student Registration Form first.');
    }
  };

  const handleDetailsGridClick = () => {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    if (!isLoggedIn) {
      alert('Please log in first to access Student Details.');
      navigate('/signup');
      return;
    }
    if (userRole !== 'teacher') {
      alert('Only teachers can access Student Details.');
      return;
    }
    navigate('/student-details');
  };

  const handleAdminGridClick = () => {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    if (!isLoggedIn) {
      alert('Please log in first to access the Admin Dashboard.');
      navigate('/signup');
      return;
    }
    if (userRole !== 'admin') {
      alert('Access denied. Only the Admin can access this page.');
      return;
    }
    navigate('/admin-dashboard');
  };

  return (
    <div className="portal-layout">
      


      <section className="hero-section">
        <img src={collegeImg} alt="College" className="hero-bg-img" />
        <div className="hero-overlay">
          <div className="hero-left">
            <h1 className='for-styles'>WELCOME TO COLLEGE</h1>
            <p>Shaping leaders, engineers, and creators for tomorrow's challenges.</p>
            <div className="search-bar-wrapper">
              <input type="search" placeholder="Search majors, courses, or portals..." />
            </div>
          </div>
          <div className="hero-right-highlight">
            <div className="highlight-tag">Research Highlight</div>
            <h3>Quantum Computing Lab</h3>
            <p>College opens a brand new, multi-million dollar facility pushing tech boundaries.</p>
          </div>
        </div>
      </section>

     
      <section className="portal-gateways-container">
        <h2 className='for-styles'>QUICK ENTRY PORTALS</h2>
        <div className="services-grid">
    
          <div className="grid-box form-grid-tile" onClick={handleFormGridClick}>
            <div className="grid-box-icon"></div>
            <h3>Student Registration Form</h3>
            <p>File your personal attributes, emergency contacts, and upload required documents for enrollment verification.</p>
          </div>

        
          <div className="grid-box dashboard-grid-tile" onClick={handleDashboardGridClick}>
            <div className="grid-box-icon"></div>
            <h3>Student Dashboard</h3>
            <p>Access your student dashboard to view classes, grades, files, and manage your account settings.</p>
          </div>

          
          <div className="grid-box details-grid-tile" onClick={handleDetailsGridClick}>
            <div className="grid-box-icon"></div>
            <h3>See Student Details</h3>
            <p>Access the complete registry overview. Monitor, update, or remove student profiles records across the database grid.</p>
          </div>

          <div className="grid-box admin-grid-tile" onClick={handleAdminGridClick}>
            <div className="grid-box-icon"></div>
            <h3>Admin / Principal Dashboard</h3>
            <p>View teacher profiles, student profiles, top performers, and institution-wide stats from the principal's control panel.</p>
          </div>
        </div>
      </section>

  
      <section className="news-events-section">
        <div className="news-column">
          <h2>CAMPUS NEWS & ANNOUNCEMENTS</h2>
          
             <article className="news-card">
           
            <div className="news-img-placeholder">
              <img 
                src={Award} 
                alt="Engineering Award Rocketry Showcase" 
                className="news-card-img"
              />
            </div>
            
            <div className="news-body">
              <h3>Engineering Team Wins National Rocketry Award</h3>
              <p>Our undergraduate aeronautics crew secured first place in high-altitude deployment.</p>
              <a href="#story1" className="read-more-link">Read the story...</a>
            </div>
          </article>


          <article className="news-card">
            <div className="news-img-placeholder">
              <img 
                src={ecoImage} 
                alt="Engineering Award Rocketry Showcase" 
                className="news-card-img"
              />
            </div>
            <div className="news-body">
              <h3>New Library Eco-Wing Opens This Fall</h3>
              <p>Constructed entirely with sustainable materials and carbon-neutral energy grids.</p>
              <a href="#story2" className="read-more-link">Read the story...</a>
            </div>
          </article>
        </div>

        <div className="events-column">
          <h2>UPCOMING EVENTS</h2>
          <div className="events-list">
            <div className="event-item">
              <div className="event-date">
                <span className="month">JUL</span>
                <span className="day">24</span>
              </div>
              <div className="event-desc">
                <h4>Annual Tech Symposium</h4>
                <p>Keynotes from global tech giants.</p>
              </div>
            </div>

            <div className="event-item">
              <div className="event-date">
                <span className="month">AUG</span>
                <span className="day">02</span>
              </div>
              <div className="event-desc">
                <h4>New Student Orientation</h4>
                <p>Welcoming our incoming freshman class.</p>
              </div>
            </div>
            <div className="event-item">
             
              <div className="event-date">
                <span className="month">SEP</span>
                <span className="day">15</span>
              </div>
              
              
              <div className="event-desc">
                <h4>Annual Innovation Summit</h4>
                <p>Showcasing cutting-edge engineering and research projects.</p>
              </div>
            </div>

            <button className="btn-view-events">View All Events</button>
          </div>
        </div>
      </section>

      {/* 6. Stats Bar Component */}

<section class="stats-bar">
  <div class="stat-item"><strong>15:1</strong> Student-Faculty Ratio</div>
  <div class="stat-item"><strong>94%</strong> Graduate Employment</div>
  <div class="stat-item"><strong>$12M+</strong> Research Funding</div>
  <div class="stat-item"><strong>85%</strong> Receive Financial Aid</div>
  <div class="stat-item"><strong>50+</strong> Academic Majors</div>
</section>


      {/* 7. Footer Sitemap Grid */}
      <footer className="portal-footer">
        <div className="footer-grid">
          <div className="footer-col">
            <h4>CONTACT INFO</h4>
            <p>123 College </p>
            <p>Phone: +91 8653489576</p>
          </div>
          <div className="footer-col">
            <h4>ACADEMICS</h4>
            <a href="/">Majors & Minors</a>
            <a href="/">Graduate School</a>
            <a href="/">Online Learning</a>
          </div>
          <div className="footer-col">
            <h4>ADMISSIONS</h4>
            <a href="/">Apply Online</a>
            <a href="/">Tuition & Fees</a>
            <a href="/">Schedule a Tour</a>
          </div>
          <div className="footer-col">
            <h4>RESOURCES</h4>
            <a href="/">Library</a>
            <a href="/">IT Help Desk</a>
            <a href="/">Canvas Login</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Home;

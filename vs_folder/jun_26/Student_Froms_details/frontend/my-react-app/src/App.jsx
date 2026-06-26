import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Signup from './Signup';
import Login from './Login';
import StudentForm from './StudentForm';
import StudentDetails from './StudentDetails'; 

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/signup" />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/student-form" element={<StudentForm />} />
        <Route path="/student-details" element={<StudentDetails />} />
      </Routes>
    </Router>
  );
}

export default App;

const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());
// Added urlencoded parsing middleware to safely process FormData text chunks
app.use(express.urlencoded({ extended: true })); 

// Set up file storage paths
const uploadDir = './uploads';
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage: storage });

const db = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'YourPasswordHere', // Put your database password here
    database: 'student_form',
    connectionLimit: 10
});

// 1. Signup Route
app.post('/api/signup', (req, res) => {
    const { name, age, email, password } = req.body;
    const query = "INSERT INTO users (name, age, email, password) VALUES (?, ?, ?, ?)";
    db.query(query, [name, age, email, password], (err, result) => {
        if (err) return res.status(500).json({ error: "Email already exists or server error" });
        res.status(201).json({ message: "User registered" });
    });
});

// 2. Login Route
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    const query = "SELECT * FROM users WHERE email = ? AND password = ?";
    db.query(query, [email, password], (err, results) => {
        if (err || results.length === 0) return res.status(401).json({ error: "Invalid credentials" });
        res.json({ message: "Login successful" });
    });
});

// 3. Student Form Route (Handles files safely)
app.post('/api/students', upload.fields([
    { name: 'studentIdDoc', maxCount: 1 },
    { name: 'recentPhoto', maxCount: 1 }
]), (req, res) => {
    const { firstName, dob, gender, classStudying, bloodType, address, guardianName, guardianPhone, guardianEmail } = req.body;
    
    // FIXED: Added safety logic (req.files && ...) to prevent crashes if files are missing or indexed improperly
    const docPath = req.files && req.files['studentIdDoc'] && req.files['studentIdDoc'][0] ? req.files['studentIdDoc'][0].path : null;
    const photoPath = req.files && req.files['recentPhoto'] && req.files['recentPhoto'][0] ? req.files['recentPhoto'][0].path : null;

    const query = `INSERT INTO students 
    (first_name, dob, gender, class_studying, blood_type, address, guardian_name, guardian_phone, guardian_email, student_id_doc, recent_photo) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    
    const values = [firstName, dob, gender, classStudying, bloodType, address, guardianName, guardianPhone, guardianEmail, docPath, photoPath];

    db.query(query, values, (err, result) => {
        if (err) {
            console.error("MySQL Insertion Error Detail:", err); // Prints the exact SQL database problem to your VS Code terminal
            return res.status(500).json({ error: "Database profile writing runtime error" });
        }
        res.status(201).json({ message: "Student records synced" });
    });
});

// 4. GET: Read information to show in StudentDetails.jsx
app.get('/api/students', (req, res) => {
    db.query("SELECT * FROM students ORDER BY id DESC", (err, results) => {
        if (err) return res.status(500).json({ error: "Read parsing error" });
        res.json(results);
    });
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));

const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();
app.use(cors());        
app.use(express.json()); 

// 1. Connect to MySQL Database
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',     
    password: 'YourPasswordHere',     
    database: 'crud_db'
});

db.connect((err) => {
    if (err) {
        console.error('Error connecting to MySQL:', err);
        return;
    }
    console.log('Connected to MySQL database!');
});

// 2. READ: Get all items
app.get('/api/items', (req, res) => {
    db.query('SELECT * FROM items', (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
    });
});

// 3. CREATE: Add a new item
app.post('/api/items', (req, res) => {
    const { name } = req.body;
    db.query('INSERT INTO items (name) VALUES (?)', [name], (err, result) => {
        if (err) return res.status(500).json(err);
        res.json({ id: result.insertId, name });
    });
});

// 4. UPDATE: Edit an item
app.put('/api/items/:id', (req, res) => {
    const { id } = req.params;
    const { name } = req.body;
    db.query('UPDATE items SET name = ? WHERE id = ?', [name, id], (err, result) => {
        if (err) return res.status(500).json(err);
        res.json({ message: 'Updated successfully' });
    });
});

// 5. DELETE: Remove an item
app.delete('/api/items/:id', (req, res) => {
    const { id } = req.params;
    db.query('DELETE FROM items WHERE id = ?', [id], (err, result) => {
        if (err) return res.status(500).json(err);
        res.json({ message: 'Deleted successfully' });
    });
});

// Start backend on port 5000
app.listen(5000, () => {
    console.log('Backend server running on http://localhost:5000');
});

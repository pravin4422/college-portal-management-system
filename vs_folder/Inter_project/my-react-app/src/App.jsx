import { useState, useEffect } from 'react';

export default function App() {
  const [items, setItems] = useState([]);
  const [newItemName, setNewItemName] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState('');

  const API_URL = 'http://localhost:5000/api/items';

  // 1. READ
  const fetchItems = async () => {
    try {
      const response = await fetch(API_URL);
      const data = await response.json();
      setItems(data);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  // 2. CREATE
  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newItemName.trim()) return;

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newItemName })
      });
      if (response.ok) {
        setNewItemName('');
        fetchItems(); 
      }
    } catch (error) {
      console.error('Error creating item:', error);
    }
  };

  // 3. UPDATE
  const handleUpdate = async (id) => {
    try {
      const response = await fetch(`${API_URL}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editingName })
      });
      if (response.ok) {
        setEditingId(null);
        setEditingName('');
        fetchItems(); 
      }
    } catch (error) {
      console.error('Error updating item:', error);
    }
  };

  const startEdit = (item) => {
    setEditingId(item.id);
    setEditingName(item.name);
  };

  // 4. DELETE
  const handleDelete = async (id) => {
    try {
      const response = await fetch(`${API_URL}/${id}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        fetchItems(); // Refresh the list
      }
    } catch (error) {
      console.error('Error deleting item:', error);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', maxWidth: '400px' }}>
      <h2>Full-Stack MySQL CRUD </h2>

    
      <form onSubmit={handleCreate} style={{ marginBottom: '20px' }}>
        <input
          type="text"
          placeholder="Add new item..."
          value={newItemName}
          onChange={(e) => setNewItemName(e.target.value)}
          style={{ padding: '8px', marginRight: '5px' }}
        />
        <button type="submit" style={{ padding: '8px' }}>Add</button>
      </form>

      
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {items.map((item) => (
          <li key={item.id} style={{ padding: '10px 0', borderBottom: '1px solid #ccc' }}>
            {editingId === item.id ? (
              <div>
                <input
                  type="text"
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  style={{ padding: '5px', marginRight: '5px' }}
                />
                <button onClick={() => handleUpdate(item.id)} style={{ marginRight: '5px' }}>Save</button>
                <button onClick={() => setEditingId(null)}>Cancel</button>
              </div>
            ) : (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>{item.name}</span>
                <div>
                  <button onClick={() => startEdit(item)} style={{ marginRight: '5px' }}>Edit</button>
                  <button onClick={() => handleDelete(item.id)} style={{ color: 'red' }}>Delete</button>
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

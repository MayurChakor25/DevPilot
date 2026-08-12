const express = require('express');
const app = express();

app.get('/api/users', (req, res) => {
  res.json({ users: [] });
});

app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  res.json({ token: 'fake' });
});

app.listen(3000);

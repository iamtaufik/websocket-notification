require('dotenv').config();
const express = require('express');
const path = require('path');
const app = express();
const fs = require('fs');
const server = require('http').createServer(app);
const io = require('socket.io')(server);
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));

app.get('/chat', (req, res) => {
  res.render('index');
});

io.on('connection', (client) => {
  console.log('New user connected');
  client.on('chat message', (msg, name) => {
    io.emit('chat message', msg, name);
  });
});

app.get('/', (req, res) => {
  res.render('home');
});
app.get('/notification', (req, res) => {
  let notifications = require('./db.json');
  const { user_id } = req.query;
  if (user_id) {
    notifications = notifications.filter((notification) => notification.user_id == user_id);
  }

  res.render('notification', { user_id, notifications });
});

app.post('/notification', (req, res) => {
  const { user_id, title, body } = req.body;
  const notifications = require('./db.json');

  fs.writeFileSync('./db.json', JSON.stringify([...notifications, { id: notifications.length + 1, user_id, title, body, is_read: false }]));

  io.emit(`user-${user_id}`, { user_id, id: notifications.length + 1, title, body });

  res.json({
    status: true,
    data: {
      id: notifications.length + 1,
      user_id,
      title,
      body,
      is_read: false,
    },
  });
});

app.get('/notification/:id/mark-is-read', (req, res) => {
  const { id } = req.params;
  const notifications = require('./db.json');
  const index = notifications.findIndex((notification) => notification.id == id);
  notifications[index].is_read = true;
  fs.writeFileSync('./db.json', JSON.stringify(notifications));
  res.redirect(`/notification?user_id=${notifications[index].user_id}`);
});

server.listen(PORT, () => {
  console.log(`Server is running on port http://localhost:${PORT}.`);
});

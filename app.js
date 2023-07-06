var express = require('express');
var cors = require('cors');
var app = express();
var bodyParser = require('body-parser');
var jsonParser = bodyParser.json();
const bcrypt = require('bcrypt');
const saltRounds = 10;
var jwt = require('jsonwebtoken');
const secret = process.env.JWT_SECRET || 'defaultsecret'; // Use environment variable for JWT secret

app.use(cors());
const mysql = require('mysql2');
require('dotenv').config(); // Load environment variables from .env file

const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE
});

// Global error handler middleware
app.use(function (err, req, res, next) {
  console.error(err);
  res.status(500).json({ status: 'error', message: 'Internal Server Error' });
});

app.get('/', (req, res) => {
  res.send('This is my API running...');
});

app.post('/register', jsonParser, function (req, res, next) {
  bcrypt.hash(req.body.password, saltRounds, function (err, hash) {
    if (err) {
      res.status(500).json({ status: 'error', message: 'Error occurred during registration', error: err });
      return;
    }

    connection.execute(
      'INSERT INTO users (username, password, fname, lname) VALUES (?, ?, ?, ?)',
      [req.body.username, hash, req.body.fname, req.body.lname],
      function (err, results, fields) {
        if (err) {
          res.status(500).json({ status: 'error', message: 'Registration failed', error: err });
          return;
        }
        res.json({ status: 'ok', message: 'Registration success' });
      }
    );
  });
});

app.post('/login', jsonParser, function (req, res, next) {
  connection.execute(
    'SELECT * FROM users WHERE username=?',
    [req.body.username],
    function (err, users, fields) {
      if (err) {
        res.status(500).json({ status: 'error', message: 'Error occurred during login', error: err });
        return;
      }
      if (users.length === 0) {
        res.status(404).json({ status: 'error', message: 'User not found' });
        return;
      }
      bcrypt.compare(req.body.password, users[0].password, function (err, isLogin) {
        if (isLogin) {
          var token = jwt.sign({ username: users[0].username }, secret, { expiresIn: '1h' });
          res.json({ status: 'ok', message: 'Login success', token });
        } else {
          res.json({ status: 'error', message: 'Login failed' });
        }
      });
    }
  );
});

function authenticateToken(req, res, next) {
  const token = req.headers.authorization;
  const tokenValue = token ? token.split(' ')[1] : null;

  if (!tokenValue) {
    return res.status(401).json({ status: 'error', message: 'No token provided' });
  }

  jwt.verify(tokenValue, secret, function (err, decoded) {
    if (err) {
      return res.status(401).json({ status: 'error', message: 'Invalid token' });
    }

    req.decoded = decoded;
    next();
  });
}

app.post('/authen', jsonParser, authenticateToken, function (req, res, next) {
  res.json({ status: 'ok', message: 'Login success', decoded: req.decoded });
});

app.listen(3306, function () {
  console.log('CORS-enabled web server listening on port 3306');
});

module.exports = app;

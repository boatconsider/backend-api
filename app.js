var express = require('express')
var cors = require('cors')
var app = express()
var bodyParser = require('body-parser')
var jsonParser = bodyParser.json()
const bcrypt = require('bcrypt');
const saltRounds = 10;
var jwt = require('jsonwebtoken');
const secret = 'login'
app.use(cors());
const mysql = require('mysql2');
require('dotenv').config(); // Load environment variables from .env file

const multer = require('multer'); // เรียกใช้ multer เพื่ออัปโหลดไฟล์
const path = require('path');
const fs = require('fs');
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); // กำหนดโฟลเดอร์ที่จะเก็บไฟล์ที่อัปโหลด
  },
  filename: function (req, file, cb) {
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname)); // กำหนดชื่อไฟล์
  }
});

app.get('/sneakers', function (req, res, next) {
  connection.query(
    'SELECT * FROM `sneakers` ',
    function (err, results, fields) {
      res.json({ results });
      console.log(results);
    }
  );
});

app.post('/register', jsonParser, function (req, res, next) {
  bcrypt.hash(req.body.password, saltRounds, function (err, hash) {
    connection.execute(
      'INSERT INTO users (username, password, fname, lname) VALUES (?, ?, ?, ?)',
      [req.body.username, hash, req.body.fname, req.body.lname],
      function (err, results, fields) {
        if (err) {
          res.json({ status: 'error', message: 'register failed' });
          return;
        }
        res.json({ status: 'ok', message: 'register success' });
      }
    );
  });
});

app.post('/login', jsonParser, function (req, res, next) {
  connection.execute(
    'SELECT * FROM users WHERE username=?',
    [req.body.username,],
    function (err, users, fields) {
      if (err) {
        res.json({ status: 'error', message: err });
        return;
      }
      if (users.length == 0) {
        res.json({ status: 'users not found', message: err });
        return;
      }
      bcrypt.compare(req.body.password, users[0].password, function (err, islogin) {
        if (islogin) {
          var token = jwt.sign({ username: users[0].username }, secret, { expiresIn: '1h' });
          res.json({ status: 'ok', message: 'login success', token });
        } else {
          res.json({ status: 'error', message: 'login failed' });
        }
      });
    }
  );
});

app.get('/getsdo', function (req, res, next) {
  connection.query(
    'SELECT * FROM `rsmsdo` ',
    function (err, results, fields) {
      res.json({ results });
      console.log(results);
    }
  );
});

app.get('/getpdcdc', function (req, res, next) {
  connection.query(
    'SELECT * FROM `rsmpdcdc` ',
    function (err, results, fields) {
      res.json({ results });
      console.log(results);
    }
  );
});

app.get('/getvan', function (req, res, next) {
  connection.query(
    'SELECT * FROM `rsmvan` ',
    function (err, results, fields) {
      res.json({ results });
      console.log(results);
    }
  );
});

const connection = mysql.createConnection({
  connectionLimit: 10,
  host: process.env.DB_HOST,
  user: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
});

app.post('/rsmsdo', upload.single('img'), function (req, res, next) {
  const imgPath = req.file.path; // รับพาธไฟล์รูปภาพที่อัปโหลด
  const imgLink = '/uploads/' + path.basename(imgPath); // สร้างลิงค์ไปยังไฟล์รูปภาพ

  connection.execute(
    'INSERT INTO rsmsdo (name, passwordsell, problem, img) VALUES (?, ?, ?, ?)',
    [req.body.name, req.body.passwordsell, req.body.problem, imgLink],
    function (err, results, fields) {
      if (err) {
        res.json({ status: 'error', message: 'แจ้งปัญหาไม่สำเร็จ' });
        return;
      }
      res.json({ status: 'ok', message: 'แจ้งปัญหาสำเร็จ' });
    }
  );
});

app.post('/rsmpdcdc', jsonParser, function (req, res, next) {
  connection.execute(
    'INSERT INTO rsmpdcdc (name, passwordsell, problem, img) VALUES (?, ?, ?, ?)',
    [req.body.name, req.body.passwordsell, req.body.problem, req.body.img],
    function (err, results, fields) {
      if (err) {
        res.json({ status: 'error', message: 'แจ้งปัญหาไม่สำเร็จ' });
        return;
      }
      res.json({ status: 'ok', message: 'แจ้งปัญหาสำเร็จ' });
    }
  );
});

app.post('/rsmvan', jsonParser, function (req, res, next) {
  connection.execute(
    'INSERT INTO rsmvan (name, passwordsell, problem, img) VALUES (?, ?, ?, ?)',
    [req.body.name, req.body.passwordsell, req.body.problem, req.body.img],
    function (err, results, fields) {
      if (err) {
        res.json({ status: 'error', message: 'แจ้งปัญหาไม่สำเร็จ' });
        return;
      }
      res.json({ status: 'ok', message: 'แจ้งปัญหาสำเร็จ' });
    }
  );
});

app.post('/authen', jsonParser, function (req, res, next) {
  const token = req.headers.authorization;
  const tokenValue = token ? token.split(' ')[1] : null;
  let decoded;

  let status;
  let message;

  try {
    decoded = jwt.verify(tokenValue, secret);
    status = 'ok';
    message = 'Login success';
  } catch (err) {
    decoded = null;
    status = 'error';
    message = 'Login error';
  }

  res.json({ status, message, decoded });
});

app.listen(3306, function () {
  console.log('CORS-enabled web server listening on port 3306');
});

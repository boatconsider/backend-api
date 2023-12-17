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
const multer = require('multer');
const path = require('path');
const {notifyLine} =require('./functions/Notify')
const tokenLine ='8oUoUpcHQbvA9Y5DtqLUvMomOA5uYQ2rkvDdpqxTy3G'
const tokenLinecut ='w6nKwab4bioBPftEKeBWcoeZNxMkJ38OW2nVt6PVGwy'
const tokenLineedit ='bxbwpQBi8RJ6bU0q7Vw5fqDX2di8eyw4pux9HKsPKOd'
const imageStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'images/');
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + ext);
  }
});

const upload = multer({ storage: imageStorage });


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

app.get('/getfam', function (req, res, next) {
  connection.query(
    'SELECT * FROM `rsmfam` ',
    function (err, results, fields) {
      res.json({ results });
      console.log(results);
    }
  );
});

app.get('/getdel', function (req, res, next) {
  connection.query(
    'SELECT * FROM `rsmdel` ',
    function (err, results, fields) {
      res.json({ results });
      console.log(results);
    }
  );
});

app.get('/getedit', function (req, res, next) {
  connection.query(
    'SELECT * FROM `rsmedit` ',
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
app.post('/rsmfam', jsonParser, function (req, res, next) {
  connection.execute(
    'INSERT INTO rsmfam (passsell, cardcode, cardname, oldfam, newfam, problem) VALUES (?, ?, ?, ?, ?, ?)',
    [req.body.passsell, req.body.cardcode, req.body.cardname, req.body.oldfam, req.body.newfam, req.body.problem],
    async function (err, results, fields) {
      if (err) {
        res.json({ status: 'error', message: 'แจ้งปัญหาไม่สำเร็จ' });
        return;
      }

      // หากการเพิ่มข้อมูลเข้าฐานข้อมูลสำเร็จ ให้ทำการส่ง Line Notify
      const message = `แจ้งย้ายแฟ้ม\nPasssell: ${req.body.passsell}\nCardcode: ${req.body.cardcode}\nCardname: ${req.body.cardname}\nOldfam: ${req.body.oldfam}\nNewfam: ${req.body.newfam}\nProblem: ${req.body.problem}`;
      
      try {
        await notifyLine(tokenLine, message);
        res.json({ status: 'ok', message: 'แจ้งปัญหาสำเร็จ' });
      } catch (notifyError) {
        console.error('Line Notify error:', notifyError);
        res.json({ status: 'ok', message: 'แจ้งปัญหาสำเร็จ แต่มีปัญหาในการส่ง Line Notify' });
      }
    }
  );
});

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});

app.post('/rsmdel', jsonParser, async function (req, res, next) {
  connection.execute(
    'INSERT INTO rsmdel (passsell, cardcode, cardname, problem) VALUES (?, ?, ?, ?)',
    [req.body.passsell, req.body.cardcode, req.body.cardname, req.body.problem],
    async function (err, results, fields) {
      if (err) {
        res.json({ status: 'error', message: 'แจ้งปัญหาไม่สำเร็จ' });
        return;
      }

      // หากการเพิ่มข้อมูลเข้าฐานข้อมูลสำเร็จ ให้ทำการส่ง Line Notify
      const message = `แจ้งตัดร้าน\nPasssell: ${req.body.passsell}\nCardcode: ${req.body.cardcode}\nCardname: ${req.body.cardname}\nProblem: ${req.body.problem}`;
      
      try {
        await notifyLine(tokenLinecut, message);
        res.json({ status: 'ok', message: 'แจ้งปัญหาสำเร็จ' });
      } catch (notifyError) {
        console.error('Line Notify error:', notifyError);
        res.json({ status: 'ok', message: 'แจ้งปัญหาสำเร็จ แต่มีปัญหาในการส่ง Line Notify' });
      }
    }
  );
});

app.post('/rsmedit', jsonParser, async function (req, res, next) {
  connection.execute(
    'INSERT INTO rsmedit (passsell, cardcode, cardname, newcardname, tax, problem) VALUES (?, ?, ?, ?, ?, ?)',
    [req.body.passsell, req.body.cardcode, req.body.cardname, req.body.newcardname, req.body.tax, req.body.problem],
    async function (err, results, fields) {
      if (err) {
        res.json({ status: 'error', message: 'แจ้งปัญหาไม่สำเร็จ' });
        return;
      }

      // หากการเพิ่มข้อมูลเข้าฐานข้อมูลสำเร็จ ให้ทำการส่ง Line Notify
      const message = `แจ้งแก้ไขชื่อร้านและเลขที่เสียภาษี\nPasssell: ${req.body.passsell}\nCardcode: ${req.body.cardcode}\nCardname: ${req.body.cardname}\nNewcardname: ${req.body.newcardname}\nTax: ${req.body.tax}\nProblem: ${req.body.problem}`;
      
      try {
        await notifyLine(tokenLineedit, message);
        res.json({ status: 'ok', message: 'แจ้งปัญหาสำเร็จ' });
      } catch (notifyError) {
        console.error('Line Notify error:', notifyError);
        res.json({ status: 'ok', message: 'แจ้งปัญหาสำเร็จ แต่มีปัญหาในการส่ง Line Notify' });
      }
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

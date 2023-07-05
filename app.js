var express = require('express')
var cors = require('cors')
var app = express()
var bodyParser = require('body-parser')
var jsonParser = bodyParser.json()
const bcrypt = require('bcrypt');
const saltRounds = 10;
var jwt = require('jsonwebtoken');
const secret='login'
app.use(cors());
const mysql = require('mysql2');
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'mydb'
  });
  
app.get('/' , (req,res)=>{
  res.send('This is my Api running...')
}
)
app.post('/register', jsonParser, function (req, res, next) {
    bcrypt.hash(req.body.password, saltRounds, function(err, hash) {
        connection.execute(
            'INSERT INTO users (username, password, fname, lname) VALUES (?, ?, ?, ?)',
            [req.body.username, hash, req.body.fname, req.body.lname],
            function (err, results, fields) {
              if (err) {
                res.json({ status: 'error', message :'register failed' });
                return;
              }
              res.json({ status: 'ok' ,message:'register success' });
            }
          );
        });
        
    });
app.post('/login' ,jsonParser,function(req,res,next){
    connection.execute(
        'SELECT *FROM users WHERE username=?',
        [req.body.username, ],
        function (err, users, fields) {
          if (err) {
            res.json({ status: 'error', message: err }); return;}
            if(users.length==0) {  res.json({ status: 'users not found', message: err }); return;}
            bcrypt.compare(req.body.password, users[0].password, function(err, islogin) {
       if(islogin){
        var token =jwt.sign({username:users[0].username},secret, { expiresIn: '1h' })
        res.json({ status:'ok', message:'login success',token})
       
       }else{
        res.json({ status:'error', message:'login failed'})
       }
            });
        }
      );
}
)
app.post('/authen', jsonParser, function(req, res, next) {
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
  
  
app.listen(4000 , function () {
  console.log('CORS-enabled web server listening on port 4000')
})
module.exports=app
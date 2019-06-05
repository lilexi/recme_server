var express = require('express');
var router = express.Router();
var cors = require('cors');
var app = express();
router.use(cors());
const mysql = require('mysql');
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '123',
  database: 'recme'
});

connection.connect(function (err) {
  (err)? console.log(err): console.log('[DB] Connection');
});
/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.use(function(req, res, next) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.use(cors());

router.get('/posts', function(req, res) {
  connection.query('SELECT * FROM content_db', function (err, data) {
    (err)? res.send(err):res.json({posts :data});
  })
});

module.exports = router;

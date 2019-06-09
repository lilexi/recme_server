var express = require('express');
var router = express.Router();
var cors = require('cors');
var app = express();
const bodyParser = require('body-parser');

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

router.get('/trands', function(req, res) {
  connection.query('SELECT c.id, c.cat_info, c.`like`, c.Title FROM recme.content_db c, recme.trands t where c.id = t.p_id', function (err, data) {
    (err)? res.send(err):res.json({trands :data});
  })
});

router.post('/getUserlike', function(req, res) {
  // console.log(req.body.u_id.toString());
  const u_id = req.body.u_id.toString();
  connection.query(`select pl.id from u_like l, content_db pl where l.u_id = ${u_id} and pl.id = l.post_id`, function (err, data) {
    (err)? res.send(err):res.json({like :data});
  })
});

app.use(
    bodyParser.urlencoded({
      extended: true
    })
);

app.use(bodyParser.json());

router.post('/likeINSERT', function (req, res) {
  // console.log(req.body);
  connection.query(`INSERT INTO u_like (u_id,post_id) value (${req.body.u_id}, ${req.body.post_id})`, function (err, data) {
    (err) ? res.send(err) : res.json({like :data});
  });
});

router.post('/likeUPDATE', function (req, res) {
  // console.log(req.body);
  // console.log(`UPDATE content_db set \`like\` = ${req.body.like} where id = ${req.body.post_id}`);
  // connection.query(`UPDATE content_db set \`like\` = ${req.body.like} where id = (select post_id from u_like where u_id = ${req.body.u_id} and post_id = ${req.body.post_id})`, function (err, data) {
  //   (err) ? res.send(err) : res.json({like :data});
  // });
  connection.query(`UPDATE content_db c set c.\`like\` = ${req.body.like} where c.id = ${req.body.post_id}`, function (err, data) {
    (err) ? res.send(err) : res.json({like :data});
  });
});

router.post('/likeDELETE', function (req, res) {
  // console.log(req.body);
  // console.log(`DELETE FROM u_like where u_id = ${req.body.u_id} and post_id = ${req.body.post_id}`);
  connection.query(`DELETE FROM u_like where u_id = ${req.body.u_id} and post_id = ${req.body.post_id}`, function (err, data) {
    (err) ? res.send(err) :res.json({like :data});
  });
});

router.post('/postsID', function(req, res) {
  console.log(req.body);
  connection.query(`SELECT * FROM content_db where id = ${req.body.id}`, function (err, data) {
    (err)? res.send(err):res.json({posts :data});
  })
});

module.exports = router;

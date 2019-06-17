const express = require('express');
const router = express.Router();
const cors = require('cors');
const app = express();
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
    (err) ? console.log(err) : console.log('[DB] Connection');
});

/* GET home page. */
router.get('/', function (req, res, next) {
    res.render('index', {title: 'Express'});
});

router.use(function (req, res, next) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

const CreateUsersFeed = () => {
    return new Promise(((resolve, reject) => {
        // let data = null;
        let time = new Date();
        console.log(time.getHours(), time.getMinutes(), time.getSeconds(), '[UPDATE] Databases: Users_feed');
        connection.query("select users.id as 'userID', post_id as 'postID', cd.id_catigories as 'catID', cd.time_to_read as 'readTime', cd.hard_rating as 'rating' from users right join u_like ul on users.id = ul.u_id left join content_db cd on ul.post_id = cd.id order by cd.`like` desc;", function (err, res) {
            // (err) ? console.log('error') : data = res;
            if (err)
                return reject(err);
            else
                return resolve(res);
        });
    }));
};

// setInterval(function () {
//     CreateUsersFeed().then(res => {
//         let categoryArray = [];
//         console.log(res);
//     }).catch(err => {
//         console.log(err);
//     });
// }, 5000);

CreateUsersFeed().then(res => {
    const userCategories = {};
    res.map(item => {
        if (userCategories[item.userID]) {
            const temp = userCategories[item.userID];
            if (temp[item.catID]) {
                const catItem = temp[item.catID];
                catItem['count'] = catItem['count'] + 1;
                catItem['s_time'] = Math.ceil((catItem['s_time'] * (catItem['count'] - 1) + item.readTime) / catItem['count']);
                catItem['min_time'] = catItem['min_time'] > item.readTime ? item.readTime : catItem['min_time'];
                catItem['max_time'] = catItem['max_time'] < item.readTime ? item.readTime : catItem['max_time'];
                if (catItem['hard'][item.rating])
                    catItem['hard'][item.rating] = catItem['hard'][item.rating] + 1;
                else catItem['hard'][item.rating] = 1;
            } else {
                temp[item.catID] = {
                    'count': 1,
                    's_time': item.readTime,
                    'min_time': item.readTime,
                    'max_time': item.readTime,
                    'hard': {
                        [item.rating]: 1
                    }
                }
            }
        } else {
            userCategories[item.userID] = {
                'postID': [],
                [item.catID]: {
                    'count': 1,
                    's_time': item.readTime,
                    'min_time': item.readTime,
                    'max_time': item.readTime,
                    'hard': {[item.rating]: 1},
                },
            };
        }
        userCategories[item.userID]['postID'].push(item.postID);
    });
    console.log(userCategories);

    /*for (let userID in userCategories){
        console.log(userID);
        for (let catID in userCategories[userID]){
            /!*console.log(catID);
            console.log(userCategories[userID][catID]);*!/
            console.log(catID);
            console.log(userCategories[userID][catID].count);
        }
    }*/



}).catch(err => {
    console.log(err);
});

app.use(cors());

router.get('/posts', function (req, res) {
    connection.query('SELECT * FROM content_db', function (err, data) {
        (err) ? res.send(err) : res.json({posts: data});
    })
});

router.get('/trands', function (req, res) {
    connection.query('SELECT c.id, c.cat_info, c.`like`, c.Title FROM recme.content_db c order by \`like\` desc limit 5 ', function (err, data) {
        (err) ? res.send(err) : res.json({trands: data});
    })
});

router.post('/getUserlike', function (req, res) {
    // console.log(req.body.u_id.toString());
    const u_id = req.body.u_id.toString();
    connection.query(`select pl.id from u_like l, content_db pl where l.u_id = ${u_id} and pl.id = l.post_id`, function (err, data) {
        (err) ? res.send(err) : res.json({like: data});
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
        (err) ? res.send(err) : res.json({like: data});
    });
});

router.post('/likeUPDATE', function (req, res) {
    // console.log(req.body);
    // console.log(`UPDATE content_db set \`like\` = ${req.body.like} where id = ${req.body.post_id}`);
    // connection.query(`UPDATE content_db set \`like\` = ${req.body.like} where id = (select post_id from u_like where u_id = ${req.body.u_id} and post_id = ${req.body.post_id})`, function (err, data) {
    //   (err) ? res.send(err) : res.json({like :data});
    // });
    connection.query(`UPDATE content_db c set c.\`like\` = ${req.body.like} where c.id = ${req.body.post_id}`, function (err, data) {
        (err) ? res.send(err) : res.json({like: data});
    });
});

router.post('/likeDELETE', function (req, res) {
    // console.log(req.body);
    // console.log(`DELETE FROM u_like where u_id = ${req.body.u_id} and post_id = ${req.body.post_id}`);
    connection.query(`DELETE FROM u_like where u_id = ${req.body.u_id} and post_id = ${req.body.post_id}`, function (err, data) {
        (err) ? res.send(err) : res.json({like: data});
    });
});

router.post('/postsID', function (req, res) {
    console.log(req.body);
    connection.query(`SELECT * FROM content_db where id = ${req.body.id}`, function (err, data) {
        (err) ? res.send(err) : res.json({posts: data});
    })
});


router.post('/signup', (req, res) => {
    connection.query(`INSERT into users (name, email, password) values (?)`, [req.body], function (err, data) {
        console.log(err);
        console.log(data);
        (err) ? res.status(985)(err) : res.json({userID: data.insertId});
    });
});

router.post('/getUser', function (req, res) {
    console.log(req.body);
    connection.query(`SELECT * FROM users where id = ${req.body.user_id}`, function (err, data) {
        (err) ? res.send(err) : res.json({user: data});
    })
});

router.post('/createPost', function (req, res) {
    console.log(req.body.post);
    connection.query(`INSERT into content_db (Title, text, cat_info, id_catigories, time_to_read, hard_rating, creator) values (?)`, [req.body.post], function (err, data) {
        console.log(err);
        console.log(data);
        (err) ? res.status(err) : res.json({data});
    });
});

router.post('/randomPost', function (req, res) {
    console.log(req.body);
    connection.query(`SELECT id FROM content_db where time_to_read = ${req.body.time} and id_catigories = '${req.body.cat}' order by \`like\` desc `, function (err, data) {
        (err) ? res.send(err) : res.json({posts: data});
    })
});

module.exports = router;

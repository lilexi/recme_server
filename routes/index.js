const express = require('express');
const router = express.Router();
const cors = require('cors');
const app = express();
const bodyParser = require('body-parser');

// const time_inerval = 3600000;//60min
const time_inerval = 300000; //5min
// const time_interval = 60000; //1min
// const time_interval = 10000;//10sec

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

setInterval(function () {
    let time = new Date();
    console.log(`${time.getHours()}:${time.getMinutes()}:${time.getSeconds()}` + ' [UPDATE] Table: Users_feed');

    const CreateUsersFeed = () => {
        return new Promise(((resolve, reject) => {
            // let data = null;
            connection.query("select users.id as 'userID', post_id as 'postID', cd.id_catigories as 'catID', cd.time_to_read as 'readTime', cd.hard_rating as 'rating' from users right join u_like ul on users.id = ul.u_id left join content_db cd on ul.post_id = cd.id order by cd.`like` desc;", function (err, res) {
                // (err) ? console.log('error') : data = res;
                if (err)
                    return reject(err);
                else
                    return resolve(res);

            });
        }));
    };

    CreateUsersFeed().then(res => {
        const userCategories = {};
        const max_post_count = 25;

        connection.query(`delete from temp`, function (err, data) {
            if (err)
                console.log(err)
            // err?console.log(err): console.log(`[CLEAR] Table: Temp`);
        });

        connection.query(`delete from users_feed`, function (err, data) {
            if (err)
                console.log(err)
            // err?console.log(err): console.log(`[CLEAR] Table: users_feed`);
        });

        res.map(item => {
            if (userCategories[item.userID]) {
                const catInfo = userCategories[item.userID].catInfo;
                const uInfo = userCategories[item.userID].userInfo;
                if (catInfo[item.catID]) {
                    const catItem = catInfo[item.catID];
                    // console.log(item.catID);
                    catItem['count'] = catItem['count'] + 1;
                    // uInfo['allCount'] = uInfo['allCount'] + 1;
                    catItem['s_time'] = Math.ceil((catItem['s_time'] * (catItem['count'] - 1) + item.readTime) / catItem['count']);
                    catItem['min_time'] = catItem['min_time'] > item.readTime ? item.readTime : catItem['min_time'];
                    catItem['max_time'] = catItem['max_time'] < item.readTime ? item.readTime : catItem['max_time'];
                    if (catItem['hard'][item.rating])
                        catItem['hard'][item.rating] = catItem['hard'][item.rating] + 1;
                    else catItem['hard'][item.rating] = 1;
                } else {
                    // uInfo['allCount'] = 1;
                    // uInfo['postId'] = item.postID;
                    catInfo[item.catID] = {
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
                    userInfo: {
                        'postID': [],
                        'allCount': 0
                    },

                    catInfo: {
                        [item.catID]: {
                            'count': 1,
                            's_time': item.readTime,
                            'min_time': item.readTime,
                            'max_time': item.readTime,
                            'hard': {[item.rating]: 1}
                        }
                    },
                };
            }
            userCategories[item.userID].userInfo['postID'].push(item.postID);
            userCategories[item.userID].userInfo['allCount'] = userCategories[item.userID].userInfo['allCount'] + 1;
        });
        // console.log(userCategories);


        for (let userID in userCategories) {

            console.log('\n_________ uID', userID, ' _________');
            const catInfo = userCategories[userID].catInfo;
            const uInfo = userCategories[userID].userInfo;

            // console.log(uInfo);
            // console.log(catInfo);
            let hard_rating_in = [];
            for (let category_name in catInfo) {
                // console.log(category_name);
                var cat_countPrecent = Math.round((catInfo[category_name].count * 100) / uInfo.allCount); // allCount from like
                var catLimit = Math.round((cat_countPrecent * uInfo.allCount) / 100); // allCount from like

                console.log(`[ ${category_name} ] ${cat_countPrecent}% - count: ${catLimit}`);

                // let time_count80 = Math.round((catInfo[category_name].count * 80) / 100);
                let time_count80 = Math.round((catInfo[category_name].count * 80) / 100);
                let time_count20 = Math.round((catInfo[category_name].count * 20) / 100);
                let s_time_m25_count = catInfo[category_name].s_time - Math.round(catInfo[category_name].s_time * 0.25);
                let s_time_p25_count = catInfo[category_name].s_time + Math.round(catInfo[category_name].s_time * 0.25);
                // console.log(`[ time ] 80% - count: ${time_count80} | min: ${s_time_m25_count} | max: ${s_time_p25_count}`);
                // console.log(`[ time ] 20% - count: ${time_count20} | min: ${catInfo[category_name].min_time} | max: ${catInfo[category_name].max_time}`);

                let hLimit;
                let hard_name = [];
                let hCountPrecent = 0;

                var hCount_all = 0;
                var full_count = 0;
                let h1 = 0;
                let h2 = 0;
                let h3 = 0;
                let h4 = 0;
                let h5 = 0;

                for (let cat_name in catInfo) {
                    for (let rating in catInfo[cat_name].hard) {
                        const hCount_i = catInfo[cat_name].hard[rating];
                        full_count = full_count + hCount_i;
                        switch (rating) {
                            case '1':
                                h1 = h1 + hCount_i;
                                break;
                            case '2':
                                h2 = h2 + hCount_i;
                                break;
                            case '3':
                                h3 = h3 + hCount_i;
                                break;
                            case '4':
                                h4 = h4 + hCount_i;
                                break;
                            case '5':
                                h5 = h5 + hCount_i;
                                break;
                            default :
                                break;
                        }
                    }
                }

                let full_precent_h1 = Math.round((h1 * 100)/full_count);
                let h1_count = Math.round((max_post_count*full_precent_h1)/100);
                let full_precent_h2 = Math.round((h2 * 100)/full_count);
                let h2_count = Math.round((max_post_count*full_precent_h2)/100);
                let full_precent_h3 = Math.round((h3 * 100)/full_count);
                let h3_count = Math.round((max_post_count*full_precent_h3)/100);
                let full_precent_h4 = Math.round((h4 * 100)/full_count);
                let h4_count = Math.round((max_post_count*full_precent_h4)/100);
                let full_precent_h5 = Math.round((h5 * 100)/full_count);
                let h5_count = Math.round((max_post_count*full_precent_h5)/100);

                for (let rating in catInfo[category_name].hard) {
                    const hCount_i = catInfo[category_name].hard[rating];
                    hCount_all = hCount_all + hCount_i;
                }

                // console.log(`[hard_rating] 1: ${h1} | ${full_precent_h1}% | ${h1_count}`);
                // console.log(`[hard_rating] 2: ${h2} | ${full_precent_h2}% | ${h2_count}`);
                // console.log(`[hard_rating] 3: ${h3} | ${full_precent_h3}% | ${h3_count}`);
                // console.log(`[hard_rating] 4: ${h4} | ${full_precent_h4}% | ${h4_count}`);
                // console.log(`[hard_rating] 5: ${h5} | ${full_precent_h5}% | ${h5_count}`);


                //create temp
                for (let rating in catInfo[category_name].hard) {
                    const hCount_i = catInfo[category_name].hard[rating];
                    hCountPrecent = Math.round((hCount_i * 100) / hCount_all);
                    hLimit = Math.round((hCountPrecent * hCount_all) / 100);
                    hard_name.push(rating);
                    // console.log(`[ h:${rating} ] ${hCountPrecent}% - count: ${hLimit} | min_time: ${catInfo[category_name].min_time} |  max_time: ${catInfo[category_name].max_time}`);
                    // console.log(hard_name);

                    connection.query(`SELECT * FROM content_db where id_catigories = '${category_name}' and id not in (${uInfo.postID}) and hard_rating = (${rating}) and (time_to_read>=${catInfo[category_name].min_time}) and (time_to_read<=${catInfo[category_name].max_time}) ORDER BY \`like\` desc limit ${hLimit}`, function (err, data) {
                        if (err)
                            console.log(err);
                        else
                        // console.log(userID);
                            data.map(item => {
                                // console.log(item);
                                connection.query(`insert into temp (id,u_id,id_catigories,\`like\`,time_to_read,hard_rating)  value (${item.id},${userID},'${item.id_catigories}',${item.like}, ${item.time_to_read}, ${item.hard_rating})`, function (err, data) {
                                    if (err)
                                        console.log(err);
                                    // console.log('[UPDATE] Database: Temp');
                                });
                            });
                    });
                }

                setTimeout(function () {
                    for (let rating in catInfo[category_name].hard) {
                        let limit = 0;
                        switch (rating) {
                            case '1': limit = h1_count; break;
                            case '2': limit = h2_count; break;
                            case '3': limit = h3_count; break;
                            case '4': limit = h4_count; break;
                            case '5': limit = h5_count; break;
                        }

                        connection.query(`select id, u_id from temp where id_catigories = '${category_name}' and hard_rating = ${rating} and (time_to_read>=${s_time_m25_count}) and (time_to_read<=${s_time_p25_count}) order by \`like\` limit ${limit}`, function (err, data) {
                            if (err)
                                console.log(err);
                            else
                            // console.log(userID);®
                                data.map(item => {
                                    // console.log(item.id);
                                    connection.query(`insert into users_feed (u_id, p_id) VALUE (${userID}, ${item.id})`, function (err, data) {
                                        if (err)
                                            console.log(err);
                                    //     // console.log('[UPDATE] Database: Temp');
                                    });
                                });
                        })
                    }
                }, 1000);


                // let pID = [];
                // setTimeout(function () {
                //     for (let rating in catInfo[category_name].hard) {
                //         const hCount_i = catInfo[category_name].hard[rating];
                //         // hCountPrecent = Math.ceil((hCount_i * 100) / hCount_all);
                //         // hLimit = Math.ceil((hCountPrecent * hCount_all) / 100);
                //
                //         hCountPrecent = Math.round((hCount_i * 100) / max_post_count);
                //         hLimit = Math.round((hCountPrecent * hCount_all) / max_post_count);
                //
                //         // console.log(`[ h:${rating} ] ${hCountPrecent}% - count: ${hLimit} | min_time: ${catInfo[category_name].min_time} |  max_time: ${catInfo[category_name].max_time}`);
                //
                //         let time_count80 = Math.round((max_post_count * 80) / 100);
                //         let time_count20 = Math.round((max_post_count * 20) / 100);
                //         let s_time_m25_count = catInfo[category_name].s_time - Math.round(catInfo[category_name].s_time * 0.25);
                //         let s_time_p25_count = catInfo[category_name].s_time + Math.round(catInfo[category_name].s_time * 0.25);
                //         // console.log(`[ time ] 80% - count: ${time_count80} | min: ${s_time_m25_count} | max: ${s_time_p25_count}`);
                //         // console.log(`[ time ] 20% - count: ${time_count20}`);
                //
                //         // console.log(`select id from temp where  id_catigories = '${category_name}' and hard_rating = ${rating} order by \`like\` desc limit ${hLimit}`);
                //         connection.query(`select id, u_id from temp where id_catigories = '${category_name}' and hard_rating = ${rating} order by \`like\` desc limit ${hLimit} `, function (err, data) {
                //             if (err)
                //                 console.log(err);
                //             else
                //             // console.log(data);
                //                 data.map(id => {
                //                     // console.log(id.u_id,id.id);
                //                     if (userID = id.u_id) {
                //                         // console.log(userID,id.id);
                //                         connection.query(`insert into users_feed (u_id, p_id) VALUE (${userID},${id.id})`, function (err, data) {
                //                             if (err)
                //                                 console.log(err)
                //                         });
                //                         // (err) ? res.send(err) : console.log(`uID:${userID}, pID:${id.id}`) });
                //                         // pID.push(id.id);
                //                     }
                //                 });
                //             // if (pID.length != 0)
                //             //     console.log(userID,pID);
                //         });
                //
                //     }
                // }, 1000);
            }
            // console.log('[UPDATE] Database: Temp');
        }


    }).catch(err => {
        console.log(err);
    });

}, time_inerval);

app.use(cors());

router.get('/posts', function (req, res) {
    connection.query('SELECT * FROM content_db order by `like` desc ', function (err, data) {
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
    // console.log(req.body);
    connection.query(`SELECT * FROM users where id = ${req.body.user_id}`, function (err, data) {
        (err) ? res.send(err) : res.json({user: data});
    })
});

router.post('/createPost', function (req, res) {
    // console.log(req.body.post);
    connection.query(`INSERT into content_db (Title, text, cat_info, id_catigories, time_to_read, hard_rating, creator) values (?)`, [req.body.post], function (err, data) {
        console.log(err);
        console.log(data);
        (err) ? res.status(err) : res.json({data});
    });
});

router.post('/randomPost', function (req, res) {
    // console.log(req.body);
    connection.query(`SELECT id FROM content_db where time_to_read = ${req.body.time} and id_catigories = '${req.body.cat}' order by \`like\` desc `, function (err, data) {
        (err) ? res.send(err) : res.json({posts: data});
    })
});

router.post('/getrec', function (req, res) {
    // console.log(req.body);
    connection.query(`select c.* from content_db c, users_feed re where re.u_id = 1 and c.id = re.p_id order by c.\`like\` desc `, function (err, data) {
        (err) ? res.send(err) : res.json({posts: data});
    })
});

router.post('/user_like', function (req, res) {
    // console.log(req.body);
    connection.query(`select c.* from content_db c, u_like ul where ul.u_id = 1 and c.id = ul.post_id order by id desc`, function (err, data) {
        (err) ? res.send(err) : res.json({posts: data});
    })
});

module.exports = router;

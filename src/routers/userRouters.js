const conn = require("../connection/index");
const router = require("express").Router();
const valid = require("validator");
const bcryptjs = require("bcryptjs");
// const kirimEmail = require('../email/nodemailer')
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const jwt = require("jsonwebtoken")

// FOLDER UPLOAD LOCATION
const uploadDirectory = path.join(__dirname, '/../../public/avatar/')
// SETUP STORAGE FOR AVATAR
// ganti jadi avatar-username.jpg
const _storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDirectory)
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + req.params.username + path.extname(file.originalname))
    }
})

// SETUP UPLOAD SETTINGS
const upload = multer({
    storage: _storage,
    limits: {
        fileSize: 1000000
    },
    fileFilter(req, file, callback) {
        if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
            return callback(new Error('Format file tidak sesuai'))
        }
        callback(undefined, true)
    }
})

// UPLOAD USER AVATAR
router.post('/avatar/:username', upload.single('avatar'), (req, res) => {
        const sql = `select * from users where username='${req.params.username}'`
        const sql2 = `update users set avatar='${req.file.filename}' where username='${req.params.username}'`
        conn.query(sql, (err, result) => {
            if (err) return res.send({
                error: err.message
            })
            if (!result[0]) {
                let dirloc = uploadDirectory + '/' + req.file.filename
                fs.unlinkSync(dirloc)
                return res.send({
                    error: 'user not found'
                })
            }
            conn.query(sql2, (err, result) => {
                if (err) return res.send({
                    error: err.message
                })
                res.send({
                    filename: req.file.filename
                })
            })
        })
    },
    (err, req, res, next) => {
        res.send({
            error: err.message
        })
    }
)


// ACCESS USER AVATAR
router.get('/avatar/:filename', (req, res) => {
    let filename = req.params.filename
    let filedir = {
        root: uploadDirectory,
    }
    res.sendFile(filename, filedir, (err) => {
        if (err) return res.send({
            error: err.message
        })
    })
})

// router.get('/me',(req,res) => {
//     // let token = jwt.sign({id:1,name:'agus',email:'agus@me.com',alamat:'gatau'},'sshhh')
//     // res.send(token)
//     let token = req.headers['x-access-token']
//     jwt.verify(token, 'sshhh', function(err, decoded) {
//         if (err) return res.status(500).send({ auth: false, message: 'Failed to authenticate token.' });
        
//         res.status(200).send(decoded);
//     });
// })


// ADD USER
router.post("/users", (req, res) => {
    let sql = `insert into users set ?`;
    let data = req.body;
    let dataUser = {
        userName: data.userName,
        password: data.password,
        userType: data.userType,
        avatar: `dummy.png`
    };

    let sql2 = `select * from users where username='${data.userName}'`;
    let sql3 = `insert into employee set ?`;

    if (!data.userName || !data.password || !data.name)
        return res.send({
            error: "Please fill in the blank"
        });
    if (!valid.isEmail(data.email)) return res.send({
        error: 'Format email is not valid'
    })
    dataUser.password = bcryptjs.hashSync(data.password, 8);
    conn.beginTransaction(err => {
        if (err) return res.send({
            error: err.message
        })
        conn.query(sql, dataUser, (err, result) => {
            if (err)
                return res.send({
                    error: err.message
                });
            conn.query(sql2, data, (err, result) => {
                if (err)
                    return res.send({
                        error: err.message
                    });
                    let id = result[0].id
                let dataEmployee = {
                    name: data.name,
                    email: data.email,
                    birthPlace: data.birthPlace,
                    birthDate: data.birthDate,
                    address: data.address,
                    userId: result[0].id,
                    userType: data.userType
                };
                conn.query(sql3, dataEmployee, (err, result) => {
                    if (err)
                        return res.send({
                            error: err.message
                        });
                    conn.commit(err => {
                        if (err) {
                            return conn.rollback(function () {
                                throw err;
                            });
                        }
                        res.send({result});
                    });
                    // kirimEmail(result[0])
                });
            });
        });
    })

});

// LOGIN
router.post("/login", (req, res) => {
    let data = req.body;
    let sql = `select * from users u join usertype us on us.id = u.userType where userName = '${data.userName}'`;
    conn.query(sql, (err, result) => {
        if (err)
            return res.send({
                error: err.message
            });
        if (result.length === 0)
            return res.send({
                error: "user not found"
            });
        let user = result[0];
        let resp = bcryptjs.compareSync(data.password, user.password);
        if (!resp) {
            return res.send({
                error: `wrong password`
            });
        }
        let urlLokal = `http://localhost:2000/avatar/${user.avatar}`
        user.avatar = urlLokal

        res.send({
            userDetail: user
        });
    });
});


// GET USER DATA
router.get('/users/:username', (req, res) => {
    let sql = `select *,DATE_FORMAT(birthDate, "%Y-%m-%d") AS birthDate from users u join employee e on u.id = e.userId where username = '${req.params.username}'`

    conn.query(sql, (err, result) => {
        if (err) return res.send({
            error: err.message
        })
        res.send({
            userDetail: result[0]
        })
    })
})

// GET EMPLOYEE DATA
router.get('/employee',(req,res) => {
    let sql = `select *,DATE_FORMAT(birthDate, "%Y-%m-%d") AS birthDate from employee e join usertype u on e.userType = u.id where e.id != 1 order by u.id`

    conn.query(sql,(err,result) => {
        if(err) return res.send({
            error: err.message
        })
        res.send({list: result})
    })
})

// UPDATE PROFILE
router.patch('/users/:username', upload.single('avatar'), (req, res) => {
    let sql = `select *,DATE_FORMAT(birthDate, "%Y-%m-%d") AS birthDate,u.id as id from users u join employee e on u.id = e.userId where username = '${req.params.username}'`
    let body = req.body
    let data = {
        name: body.name,
        email: body.email,
        address: body.address,
        birthPlace: body.birthPlace,
        birthDate: body.birthDate
    }
    let message = null
    let avatar = null
    if (!valid.isEmail(data.email)) return res.send({
        error: 'Format email is not valid'
    })

    conn.beginTransaction(err => {
        if (err) return res.send({
            error: err.message
        })
        conn.query(sql, (err, result) => {
            if (err) return res.send({
                error: err.message
            })
            let password = result[0].password
            let userId = result[0].id
            let avatarName = result[0].avatar
    
            let sql2 = `UPDATE employee SET ? WHERE userId = '${result[0].userId}'`
    
            conn.query(sql2, data, (err, result) => {
                if (err) return res.send({
                    error: err.message
                })
                message = 'Update success'
                if (body.oldPassword) {
                    let dataPassword = {
                        oldPassword: body.oldPassword,
                        newPassword: body.newPassword
                    }
                    if(body.oldPassword === body.newPassword) return res.send({
                        error: 'New password cannot be the same as the current password'
                    })
                    let cek = bcryptjs.compareSync(dataPassword.oldPassword, password)
                    if (!cek) return res.send({
                        error: 'Wrong old password'
                    })
    
                    dataPassword.newPassword = bcryptjs.hashSync(dataPassword.newPassword, 8);
                    let dataUser = {
                        password: dataPassword.newPassword
                    }
                    if (req.file) dataUser = {
                        avatar: req.file.filename,
                        password: dataPassword.newPassword
                    }
                    let sql3 = `UPDATE users set ? WHERE id = ${userId}`
                    conn.query(sql3, dataUser, (err, result) => {
                        if (err) return res.send({
                            error: err.message
                        })
                    })

                    message = 'Update user and password success'

                }
                if (req.file) {
                    let urlLokal = `http://localhost:2000/avatar/${req.file.filename}`
    
                    let dataUser = {
                        avatar: req.file.filename
                    }
    
                    let imgPath = `${uploadDirectory}${avatarName}`
                    if (avatarName !== "undefined" && avatarName !== "null" && avatarName !== 'dummy.png') fs.unlinkSync(imgPath)
                    let sql4 = `UPDATE users set ? WHERE id = ${userId}`
                    conn.query(sql4, dataUser, (err, result) => {
                        if (err) return res.send({
                            error: err.message
                        })
                    })

                        message = 'Update user and avatar success',
                        avatar = urlLokal

                }
                if(body.oldPassword && req.file){
                    message = 'Update user,password and avatar success'
                }
                conn.commit(err => {
                    if (err) {
                        return conn.rollback(function () {
                            throw err;
                        });
                    }
                    res.send({
                        message,
                        avatar
                    })
                });
            })
        })
    })
    

})

module.exports = router;
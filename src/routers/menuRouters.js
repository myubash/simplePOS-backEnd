const conn = require("../connection/index");
const router = require("express").Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// FOLDER UPLOAD LOCATION
const uploadDirectory = path.join(__dirname, '/../../public/newmenu/')
const menuDirectory = path.join(__dirname, '/../../public/menu/')

// SETUP STORAGE FOR AVATAR
const _storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDirectory)
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + req.body.productName + path.extname(file.originalname))
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

// ACCESS NEW MENU PHOTO
router.get('/newmenu/:filename', (req, res) => {
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

// ACCESS MENU PHOTO
router.get('/menu/:filename', (req, res) => {
    let filename = req.params.filename
    let filedir = {
        root: menuDirectory,
    }
    res.sendFile(filename, filedir, (err) => {
        if (err) return res.send({
            error: err.message
        })
    })
})

// GET ALL MENU
router.get('/menu', (req, res) => {
    let sql = `select m.id as id,productName,p.productType,productPrice,productDescription,productPhoto from menu m join producttype p on p.id = m.productType`

    conn.query(sql, (err, result) => {
        if (err) return res.send({
            error: err.message
        })
        res.send({
            menu: result
        })
    })
})

// POST ORDER
router.post('/order', (req, res) => {
    let sql = `insert into list (menuId,customerTable,qty) values ?`
    let dataList = req.body.list

    conn.query(sql, [dataList], (err, result) => {
        if (err) return res.send({
            error: err.message
        })
        res.send({message: `Table ${dataList[0][1]} ordered`})
    })
})

// GET ALL ORDER FOR KITCHEN
router.get('/order/kitchen', (req,res) => {
    let sql = `select l.id as id, productName,qty,customerTable from list l join menu m on l.menuId = m.id where cooked = '0'`

    conn.query(sql,(err,result) => {
        if (err) return res.send({
            error: err.message
        })
        res.send({
            list: result
        })
    })
})

// DELETE KITCHEN ORDER BY CUSTOMERTABLE
router.delete('/order/kitchen/:customerTable',(req,res) => {
    let sql = `delete from list where customerTable = ${req.params.customerTable}`

    conn.query(sql, (err,result) => {
        if (err) return res.send({
            error: err.message
        })
        res.send({result})
    })
})

// PATCH COOKED BY CUSTOMERTABLE
router.patch('/order/kitchen/:customerTable',(req,res) => {
    let sql = `update list set cooked = true where customerTable = ${req.params.customerTable}`

    conn.query(sql,(err,result) => {
        if(err) return res.send({
            error: err.message
        })
        res.send({result})
    })
})

// GET ALL ORDER FOR CASHIER
router.get('/order/cashier',(req,res) => {
    let sql = `select m.id as menuId, productName,qty,customerTable,productPrice from list l join menu m on l.menuId = m.id where cooked = '1'`

    conn.query(sql,(err,result) => {
        if(err) return res.send({
            error:err.message
        })
        res.send({list: result})
    })
})

// CHECKOUT ORDER
router.post('/order/cashier/:customerTable',(req,res) => {
    let sql = `insert into history (menuId,qty,customerTable) values ?`
    let sql2 = `delete from list where customerTable = ${req.params.customerTable}`
    let dataList = req.body.list
    
    conn.query(sql,[dataList],(err,result) => {
        if(err) return res.send({
            error: err.message
        })
        conn.query(sql2,(err,result) => {
            if(err) return res.send({
                error:err.message
            })
            res.send({result})
        })
    })
})

// GET ORDER HISTORY
router.get('/orderhistory',(req,res) => {
    let sql = `select h.id as id,productName,p.productType,qty,m.productPrice from history h join menu m on h.menuId = m.id join producttype p on m.productType = p.id order by id`

    conn.query(sql,(err,result) => {
        if(err) return res.send({
            error: err.message
        })
        res.send({list:result})
    })
})

// GET PRODUCT TYPE
router.get('/producttype',(req,res) => {
    let sql = `select * from producttype`

    conn.query(sql, (err,result) => {
        if(err) return res.send({
            error: err.message
        })
        res.send({list: result})
    })
})

// POST NEW MENU SUGGESTION
router.post('/newmenu',upload.single('productPhoto'),(req,res) => {
    let sql = `insert into newmenu set ?`
    let body = req.body
    let data = {
        productName: body.productName,
        productDescription: body.productDescription,
        productIngredients: body.productIngredients,
        productPhoto: req.file.filename,
        productEstPrice: body.productEstPrice,
        productType: parseInt(body.productType),
        accepted: false,
        pending: true,
        rejected: false
    }
    conn.query(sql,data,(err,result) => {
        if(err) {
            let imgPath = `${uploadDirectory}${data.productPhoto}`
            fs.unlinkSync(imgPath)
            return res.send({
                error: err.message
            })
        }
        res.send({result})
    })
    },
    (err, req, res, next) => {
        res.send({
            err: err.message
        })
    }
)



// GET ALL NEW MENU SUGGESTION
router.get('/newmenu',(req,res) => {
    let sql = `select *,n.id as id from newmenu n join producttype p on p.id = n.productType where pending = true and accepted = false and rejected = false`
    let sql2 = `select *,n.id as id from newmenu n join producttype p on p.id = n.productType where pending = false and accepted = true and rejected = false`
    let sql3 = `select *,n.id as id from newmenu n join producttype p on p.id = n.productType where pending = false and accepted = false and rejected = true`

    conn.query(sql,(err,result1) => {
        if(err) return res.send({
            error: err.message
        })
        conn.query(sql2,(err,result2) => {
            if(err) return res.send({
                error: err.message
            })
            conn.query(sql3,(err,result3) => {
                if(err) return res.send({
                    error: err.message
                })
                res.send({
                    pending: result1,
                    accepted: result2,
                    rejected: result3
                })
            })
        })
    })
})

// NEW MENU ON ACCEPT
router.patch('/newmenu/accept/:id',(req,res) => {
    let sql = `update newmenu set accepted = true , pending = false where id = ${req.params.id}`
    
    conn.query(sql, (err,result) => {
        if(err) return res.send({
            error: err.message
        })
        res.send({result})
    })
})

// NEW MENU ON REJECT
router.patch('/newmenu/reject/:id',(req,res) => {
    let sql = `update newmenu set rejected = true , pending = false where id = ${req.params.id}`
    
    conn.query(sql, (err,result) => {
        if(err) return res.send({
            error: err.message
        })
        res.send({result})
    })
})

// NEW MENU ON PENDING
router.patch('/newmenu/pending/:id',(req,res) => {
    let sql = `update newmenu set accepted = false , pending = true, rejected = false where id = ${req.params.id}`
    
    conn.query(sql, (err,result) => {
        if(err) return res.send({
            error: err.message
        })
        res.send({result})
    })
})

// NEW MENU ON DELETE
router.post('/newmenu/delete/:id',(req,res) => {
    let sql = `delete from newmenu where id = ${req.params.id}`
    conn.query(sql,(err,result) => {
        if(err) return res.send({
            error: err.message
        })
        let imgPath = `${uploadDirectory}${req.body.photo}`
        fs.unlinkSync(imgPath)
        res.send({result})
    })
})

// NEW MENU ON CONFIRM
router.post('/newmenu/confirm/:id',(req,res)=> {
    let sql = `select * from producttype`
    let sql2 = `select * from newmenu where id = ${req.params.id}`
    let sql3 = `insert into menu set ?`
    let sql4 = `delete from newmenu where id = ${req.params.id}`

    conn.query(sql,(err,result) => {
        if(err) return res.send({
            error: err.message
        })        
        conn.query(sql2,(err,result2) => {
            if(err) return res.send({
                error: err.message
            })
            let dor = [...result]
            let type = dor.filter(val => {
                return val.id === result2[0].productType
            })

            let newmenu = result2[0]
            let data = {
                productName: newmenu.productName,
                productPrice: parseInt(newmenu.productEstPrice),
                producttype: parseInt(type[0].id),
                productDescription: newmenu.productDescription,
                productPhoto: newmenu.productPhoto
            }
            conn.query(sql3,data,(err,result) => {
                if(err) return res.send({
                    error: err.message
                })
                conn.query(sql4,(err,result) => {
                    if(err) return res.send({
                        error: err.message
                    })
                    let imgPath = `${uploadDirectory}${data.productPhoto}`
                    let menuPath = `${menuDirectory}${data.productPhoto}`
                    fs.renameSync(imgPath,menuPath,(err) => {
                        if (err) throw err
                        console.log('SUCCESS BITHC')
                    })
                    
                    res.send({result})
                })
            })
        })
    })
})

// GET CASHIER ORDER BY CUSTOMER TABLE
router.get('/order/cashier/:customerTable',(req,res) => {
    let sql = `select m.id as menuId, productName,qty,customerTable,productPrice from list l join menu m on l.menuId = m.id where cooked = '1' and customerTable = ${req.params.customerTable}  `

    conn.query(sql,(err,result) => {
        if(err) return res.send({
            error: err.message
        })
        res.send({
            list: result
        })
    })
})



module.exports = router
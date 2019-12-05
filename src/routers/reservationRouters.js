const conn = require("../connection/index");
const router = require("express").Router();
const valid = require("validator");
const bcryptjs = require("bcryptjs");
// const kirimEmail = require('../email/nodemailer')
const multer = require("multer");
const path = require("path");
const fs = require("fs");


// POST RESERVATION
router.post('/reservation',(req,res) => {
    let sql = `insert into reservation set ?`
    let body = req.body
    let data = null
    if(!body.companyAddress && !body.companyName){
        data = {
            name: body.name,
            address: body.address,
            email: body.email,
            nett: parseInt(body.nett),
            isCompany: false
        }
    }else{
        data = {
            name: body.name,
            address: body.address,
            email: body.email,
            nett: parseInt(body.nett),
            companyAddress: body.companyAddress,
            companyName: body.companyName,
            isCompany: true
        }
    }
    conn.query(sql,data,(err,result) => {
        if(err) return res.send({
            error: 'satu'
        })
        let id = result.insertId
        let menuItem = body.menuItem

        let map = menuItem.map(val => {
            return{
                item: val.id,
                qty: val.qty,
                resId: id
            }
        })
        let bulk = map.reduce(
            (acc, obj) => [...acc, Object.values(obj).map(y => y)],
            []
        )
        let sql2 = `insert into reservationmenuitem (item,qty,resId) values ?`
        conn.query(sql2,[bulk],(err,result) => {
            if(err) return res.send({
                error: 'dua'
            })
            res.send({result})
        })

    })

})

// GET ALL RESERVATION
router.get('/reservation',(req,res) => {
    let sql = `select r.id as id,name,address,email,companyName,companyAddress,nett,isCompany,qty,productName from reservation r join reservationmenuitem ri on r.id = ri.resId join menu m on ri.item = m.id join producttype p on m.productType = p.id`

    conn.query(sql,(err,result) => {
        if(err) return res.send({
            error: err.message
        })
        res.send({
            list:result
        })
    })
})




module.exports = router
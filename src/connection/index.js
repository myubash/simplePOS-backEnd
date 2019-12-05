const mysql = require('mysql')
let db4free = {
    user: 'devuserbdg',
    password: 'T3rorist',
    host: 'db4free.net',
    database: 'mysql_aing',
    port: 3306
}

let local = {
    user: 'devuser',
    password: 'T3rorist',
    host: 'localhost',
    database: 'prototype',
    port: 3306
}

const conn = mysql.createConnection(local)

module.exports = conn
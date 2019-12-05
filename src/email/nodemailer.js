const nodemailer = require('nodemailer')
const eFig = require('./config')

kirimEmail = async (data) => {

    let transporter = await nodemailer.createTransport({
        service: 'gmail',
        auth: {
            type: 'OAuth2',
            user: 'pwuahaha@gmail.com',
            clientId: eFig.clientId,
            clientSecret: eFig.clientSecret,
            refreshToken: eFig.refreshToken,
        }
    })

    let urlLokal = `http://localhost:2019/verification/${data.username}`
    let urlHeroku = `https://bdg-mysql-aing.herokuapp.com/verification/${data.username}`

    let mail = {
        from: '🇺🇬 <pwuahaha@gmail.com>',
        to: data.email,
        subject: `Selamat datang, ${data.name}`,
        html: `<h1 style='color:blue'>Welcome, ${data.name}</h1>
                <a href='${urlHeroku}'>Click for verification</a>`
    }

    await transporter.sendMail(mail, (err, result) => {
        if (err) return console.log(err)
        console.log('SUCCESS')
    })
}

module.exports = kirimEmail
const express = require('express')
const userRouter = require('./routers/userRouters')
const menuRouter = require('./routers/menuRouters')
const reservationRouter = require('./routers/reservationRouters')
const cors = require('cors')


const app = express()
const port = process.env.PORT || 2000
app.use(express.json())
app.use(cors())
app.use(userRouter)
app.use(menuRouter)
app.use(reservationRouter)
app.get('/', (req, res) => {
    res.send(`<h1>Running at ${port}</h1>`)
})

app.listen(port, () => {
    console.log(`Running at port ${port}`)
})
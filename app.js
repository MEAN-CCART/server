const express = require('express');
const app = express();

const mysql = require('mysql');         //MySQL Driver, used to connect NodeJS with MySQL 

//Initialise Database 
var db = require('./config/db')

// Middleware added to read JSON from Request Body.
app.use(express.json())

app.use('/api/auth', require('./controllers/Auth/AuthAPI'))
app.use('/', (req, res, next) => {
    res.end("Welcome to the Ccart Server");
})

const PORT = process.env.PORT || 3000;
app.listen(PORT, (err) => {
    if (err) throw err;
    else
        console.log(`Server listening successfully on port ${PORT}`);
});



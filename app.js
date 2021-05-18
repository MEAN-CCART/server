const express = require('express');
var cookieParser = require('cookie-parser')

//Initialise Database 
var mdb = require('./_helpers/dbmongo')

const app = express();

// Middleware added to read JSON from Request Body.
app.use(express.json())
app.use(cookieParser())

app.use('/api/auth', require('./controllers/Auth/AuthAPI'))

app.get('/', (req, res, next) => {
    res.end("Welcome to the Ccart Server");
})
// app.all('*.*', (req, res) => {
//     res.status(404).end('Page Not Found')
// })
app.use((err, req, res, next) => {
    switch (true) {
        case typeof err === 'string':
            // custom application error
            const is404 = err.toLowerCase().endsWith('not found');
            const statusCode = is404 ? 404 : 400;
            return res.status(statusCode).json({ message: err });
        case err.name === 'ValidationError':
            // mongoose validation error
            return res.status(400).json({ message: err.message });
        case err.name === 'UnauthorizedError':
            // jwt authentication error
            return res.status(401).json({ message: 'Unauthorized' });
        default:
            return res.status(500).json({ message: err.message });
    }
})
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', (err) => {
    if (err) throw err;
    else
        console.log(`Server listening successfully on port ${PORT}`);
});



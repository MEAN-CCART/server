const express = require('express');
const app = express();
const mysql = require('mysql');


var mysqlConnection = mysql.createConnection({
    host: 'localhost',
    user: 'root',    
    database: 'ccart',
    multipleStatements: true
});

mysqlConnection.connect((err) => {
    if (!err)
        console.log('DB Connection Established');
    else
        console.log('db Connection Failed!' + JSON.stringify(err, undefined, 2));
});

app.use('/',(req,res,next)=>{
    res.end("Welcome to the Ccart Server");
})

const PORT = process.env.PORT || 3000;
app.listen(PORT, (err) => {
    if (err) throw err;
    else
        console.log(`Server listening successfully on port ${PORT}`);
});



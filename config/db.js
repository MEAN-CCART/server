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

module.exports =   mysqlConnection;
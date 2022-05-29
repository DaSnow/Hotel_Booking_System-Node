const mysql = require('mysql2');

let conn = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'reservation-management'
});

module.exports = conn;
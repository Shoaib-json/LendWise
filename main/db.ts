import mysql from "mysql2";

const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    database: 'finance',
    password:'1234'
  });

export default connection;
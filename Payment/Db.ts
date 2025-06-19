import mysql from "mysql2";

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    database: 'finance',
    password:'1234'
  });

export default db;
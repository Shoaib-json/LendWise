import mysql from "mysql2";
import dotenv from "dotenv";

dotenv.config();

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    database: 'finance',
    password:'1234'
  });

export default db;
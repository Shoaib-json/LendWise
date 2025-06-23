import mysql from "mysql2";
import dotenv from "dotenv";

dotenv.config();

const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    database: 'finance',
    password:'1234'
  });

export default connection;
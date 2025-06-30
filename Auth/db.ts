import mysql from "mysql2";
import dotenv from "dotenv";

dotenv.config({path : '../.env'});

const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    database: process.env.DATABASE_NAME,
    password : process.env.DATABASE_PASSWORD
  });

export default connection;
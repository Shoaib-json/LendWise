import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import connection from '../db';
import dotenv from 'dotenv';

dotenv.config({ path: '../.env' });

const jwtSecret = process.env.COOKIE_SECRET as string;
const port1 = process.env.GATEWAY_PORT;
const port2 = process.env.MAIN_PORT;
const port3 = process.env.AUTH_PORT;
const port4 = process.env.PAYMENT_PORT;
const saltRounds = parseInt(process.env.salt || '12', 10); 

export const renderSignIn = (req: Request, res: Response) => {
  res.render('signIn');
};

export const renderLogin = (req: Request, res: Response) => {
  res.render('login');
};

export const registerUser = (req: Request, res: Response) => {
  const { email, password, username } = req.body;

  bcrypt.genSalt(saltRounds, (err, salt) => {
    if (err) return res.status(500).send('Error generating salt');

    bcrypt.hash(password, salt, (err, hash) => {
      if (err) return res.status(500).send('Error hashing password');

      const query = 'INSERT INTO USER (email, username, password) VALUES (?, ?, ?)';
      connection.query(query, [email, username, hash], (err) => {
        if (err) return res.status(500).send('Database error');
        res.redirect(`http://localhost:${port1}/`);
      });
    });
  });
};

export const loginUser = (req: Request, res: Response) => {
  const { email, password } = req.body;
  const query = 'SELECT id, username, password FROM USER WHERE email = ?';

  connection.query(query, [email], (err, results: any[]) => {
    if (err || results.length === 0) return res.status(401).send('Invalid credentials');

    const user = results[0];
    bcrypt.compare(password, user.password, (err, match) => {
      if (!match) return res.status(401).send('Invalid credentials');

      const token = jwt.sign({ id: user.id, email }, jwtSecret, { expiresIn: '1h' });
      res.cookie('token', token, { httpOnly: true });
      res.redirect(`http://localhost:${port1}/`);
    });
  });
};

export const handleOAuth = (req: Request, res: Response): void => {
  const token = req.cookies.token;
  if (!token) {
    res.status(401).send('Unauthorized: No token');
    return;
  }

  try {
    const decoded = jwt.verify(token, jwtSecret) as { email?: string };
    const email = decoded.email;

    const userQuery = 'SELECT id, username FROM user WHERE email = ?';
    connection.query(userQuery, [email], (err, userResults: any[]) => {
      if (err) {
        res.status(500).send('Error retrieving user');
        return;
      }

      if (userResults.length === 0) {
        res.render("oauth.ejs", { email });
        return;
      }

      const user = userResults[0];
      const loanQuery = 'SELECT loan_id FROM borrower WHERE id = ?';
      connection.query(loanQuery, [user.id], (err, loanResults: any[]) => {
        if (err) {
          res.status(500).send('Loan lookup error');
          return;
        }

        const payload: any = {
          id: user.id,
          email,
          username: user.username
        };

        if (loanResults.length > 0) {
          payload.loan_id = loanResults[0].loan_id;
        }

        const newToken = jwt.sign(payload, jwtSecret, { expiresIn: '1h' });
        res.cookie('token', newToken, { httpOnly: true });
        res.redirect(`http://localhost:${port1}/`);
      });
    });
  } catch (err) {
    res.status(401).send('Unauthorized: Invalid token');
  }
};

export const googleCallback = (req: Request, res: Response) => {
  const user = req.user as any;
  const token = jwt.sign(user, jwtSecret, { expiresIn: '1h' });
  res.cookie('token', token, { httpOnly: true });
  res.redirect('/oauth');
};

export const logout = (req: Request, res: Response) => {
  res.clearCookie('token');
  res.redirect('/');
};

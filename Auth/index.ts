import express, { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import session from 'express-session';
import path from 'path';
import connection from './db';
import axios from 'axios';
import router from './routes/authRoutes';
import dotenv from 'dotenv';

dotenv.config({ path: '../.env' });

const app = express();
const PORT = process.env.AUTH_PORT;
const SESSION_SECRET = process.env.COOKIE_SECRET as string;
const GOOGLE_CLIENT_ID = process.env.google_clientId as string;
const GOOGLE_CLIENT_SECRET = process.env.google_clientSecret as string;
const GOOGLE_CALLBACK_URL = process.env.google_callBackUrl as string;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
app.use(session({ secret: SESSION_SECRET, resave: false, saveUninitialized: true }));
app.use(passport.initialize());
app.use(passport.session());

app.use((req: Request, res: Response, next: NextFunction) => {
  req.date = new Date();
  console.log(req.date, req.method, req.path);
  next();
});

declare global {
  namespace Express {
    interface Request {
      date?: Date;
    }
  }
}

passport.use(
  new GoogleStrategy(
    {
      clientID: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
      callbackURL: GOOGLE_CALLBACK_URL,
    },
    (accessToken, refreshToken, profile, done) => {
      const email = profile.emails ? profile.emails[0].value : null;

      if (!email) {
        return done(new Error('Email not provided by Google'), false);
      }

      return done(null, { email });
    }
  )
);

passport.serializeUser((user: any, done) => {
  done(null, user);
});

passport.deserializeUser((user: any, done) => {
  done(null, user);
});

app.use('/', router);

app.all('/{*any}', (req: Request, res: Response, next: NextFunction) => {
  res.render('errorPage');
  next();
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

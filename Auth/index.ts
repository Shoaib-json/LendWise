import express, { Request, Response , NextFunction} from 'express';
import bcrypt from 'bcrypt';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import session from 'express-session';
import path from 'path';
import connection from './db';
import axios from 'axios';
import router from './routes/authRoutes'
import dotenv from 'dotenv'

const app = express();
dotenv.config({path : '../.env'});
const PORT = process.env.AUTH_PORT;


app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));


app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
app.use(session({ secret: 'Truck', resave: false, saveUninitialized: true }));
app.use(passport.initialize());
app.use(passport.session());

app.use((req : Request,res : Response,next : NextFunction)=>{
    req.date = new Date();
    console.log(req.date,req.method , req.path);
    next();
});

declare global{
    namespace Express{
        interface Request{
            date? : Date;
        }
    }
}

passport.use(
  new GoogleStrategy(
    {
      clientID: '550648017644-9u8577a91h3b4jbc2grsvl0hhrt2mi4v.apps.googleusercontent.com',
      clientSecret: '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',
      callbackURL: '/google/callback'
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


app.use("/" ,router);


app.all('/{*any}', (req: Request, res: Response, next: NextFunction) => {
  res.render("errorPage")
  next();
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
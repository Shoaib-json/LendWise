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

const app = express();
const PORT = 3001;


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


app.get('/', (req: Request, res: Response) => {
  res.render('signIn');
});

app.get("/login" , (req : Request , res :Response)=>{
  res.render("login")
})  

app.post('/create', (req: Request, res: Response) => {
  try{const { email, password, username } = req.body;

  bcrypt.genSalt(12, (err, salt) => {
    if (err) return res.status(500).json({ message: 'Server error' });

    bcrypt.hash(password, salt, (err, hash) => {
      if (err) return res.status(500).json({ message: 'Hashing error' });

      const query = 'INSERT INTO USER (email, username, password) VALUES (?, ?, ?)';
      const values = [email, username, hash];

      connection.query(query, values, async (err) => {
        if (err) return res.status(404).json({ message: 'Database error' });
        await axios.get("http://localhost:3000/")
      });
    });
  });
} catch (axiosError : any) {
    console.warn(axiosError )
  }
});

app.get("/oauth", (req: Request, res: Response): void => {
  const token = req.cookies.token;
  console.log("Received token from cookie:", token);
  
  if (!token) {
    console.log("No token provided");
    res.status(401).send('Unauthorized: No token provided');
    return;
  }

  try {
    const decoded = jwt.verify(token, 'Truck') as { email?: string };
    const email = decoded.email;
    
    console.log("Decoded token payload:", decoded);
    
    if (!email) {
      console.log("Email not found in decoded token");
      res.status(401).send('Unauthorized: Email not found in token');
      return;
    }

    const userQuery = 'SELECT id, username FROM user WHERE email = ?';
    connection.query(userQuery, [email], (err, userResults: any[]) => {
      if (err) {
        console.error("User query error:", err);
        res.status(500).json({ message: 'Server error in user query' });
        return;
      }

      if (userResults.length === 0) {
        res.render("oauth.ejs", { email });
      } else {
        const user = userResults[0];
        console.log("User found:", user);

        const loanQuery = 'SELECT loan_id FROM borrower WHERE id = ?';
        connection.query(loanQuery, [user.id], (err, loanResults: any[]) => {
          if (err) {
            console.error("Loan query error:", err);
            res.status(500).json({ message: 'Server error in loan query' });
            return;
          }

          const payload: any = {
            id: user.id,
            email,
            username: user.username
          };

          if (loanResults.length > 0) {
            payload.loan_id = loanResults[0].loan_id;
            console.log("Loan found for user:", loanResults[0]);
          } else {
            console.log("No loan found for user");
          }

          const newToken = jwt.sign(payload, 'Truck', { expiresIn: '1h' });
          console.log("New JWT payload:", payload);

          res.cookie('token', newToken, { httpOnly: true, secure: false });
          console.log("JWT cookie set. Redirecting...");

          res.redirect('http://localhost:3000/');
        });
      }
    });
  } catch (err) {
    console.error("Token verification failed:", err);
    res.status(401).send('Unauthorized: Invalid token');
  }
});

app.post('/logIn', (req: Request, res: Response) => {
  const { email, password } = req.body;
  const query = 'SELECT id, username, password FROM USER WHERE email = ?';

  connection.query(query, [email], (err, results: any) => {
    if (err) return res.status(500).json({ message: 'Server error' });
    if (results.length === 0) return res.status(401).json({ message: 'Invalid email or password' });

    const user = results[0];
    bcrypt.compare(password, user.password, (err, isMatch) => {
      if (err) return res.status(500).json({ message: 'Server error' });
      if (!isMatch) return res.status(401).json({ message: 'Invalid email or password' });

      const token = jwt.sign({ id: user.id, email }, 'Truck', { expiresIn: '1h' });
      
      res.cookie('token', token, { httpOnly: true, secure: false });
      res.redirect('http://localhost:3000/');
    });
  });
});

// Google OAuth Routes
app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

app.get('/google/callback', passport.authenticate('google', { failureRedirect: '/' }), (req : Request, res : Response) => {
  const user = req.user as any;
  const token = jwt.sign(user, 'Truck', { expiresIn: '1h' });
  res.cookie('token', token, { httpOnly: true, secure: false });
  res.redirect('/oauth');
});


// Logout
app.get('/logout', (req: Request, res: Response) => {
  res.cookie('token', '');
  res.redirect('/');
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
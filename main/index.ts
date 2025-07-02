import express, { Request, Response, NextFunction } from "express";
import dotenv from "dotenv";
import ejs from "ejs";
import path from "path";
import methodOverride from "method-override";
import cookieParser from "cookie-parser";
import cors from "cors";
import mainRouter from "./router/mainroutes";
import globalErrorHandler from './utils/globalError';
import AppError from './utils/AppError';
import session from 'express-session';
import flash from 'connect-flash';

dotenv.config({ path: '../.env' });

const app = express();

// Global type declarations
declare global {
  namespace Express {
    interface Request {
      user?: any;
      date?: Date;
    }
  }
}

// Middleware setup
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  })
);

app.use(cookieParser());
app.use(cors());
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));
app.use(methodOverride("_method"));
app.use(flash());

// Global middleware for request logging
app.use((req: Request, res: Response, next: NextFunction) => {
  req.date = new Date();
  console.log(`${req.date.toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Global middleware for locals
app.use((req: Request, res: Response, next: NextFunction) => {
  res.locals.currUser = req.cookies?.token || null;
  res.locals.error = req.flash('error');
  res.locals.success = req.flash('success');
  next();
});

// Use main router for all routes
app.use("/", mainRouter);

// 404 handler - must come before global error handler
app.all('/{*any}', (req: Request, res: Response, next: NextFunction) => {
  res.render("errorPage")
  next();
});

// Global error handling middleware - must be last
app.use(globalErrorHandler);

const PORT = process.env.MAIN_PORT ;

app.listen(PORT, () => {
  console.log(`Main service running on port ${PORT}`);
});

export default app;
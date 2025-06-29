import express, { Request, Response, NextFunction } from "express";
import dotenv from "dotenv";
import ejs from "ejs";
import path from "path";
import methodOverride from "method-override";
import cookieParser from "cookie-parser";
import cors from "cors";
import mainRouter from "./router/mainroutes"; 
import globalErrorHandler from './utils/globalError'; // New
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
    secret: 'secret-key',
    resave: false,
    saveUninitialized: false,
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
// Global middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  req.date = new Date();
  console.log(req.date, req.method, req.path);
  next();
});

app.use((req: Request, res: Response, next: NextFunction) => {
  res.locals.currUser = req.cookies?.token || null;
  res.locals.error = req.flash('error');
  console.log(req.cookies);
  next();
});

// Use main router for all routes
app.use("/", mainRouter);

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use('/{*any}', (req: Request, res: Response) => {
  res.render("errorPage");
});

app.use(globalErrorHandler);


const PORT = process.env.MAIN_PORT ;

app.listen(PORT, () => {
  console.log(`Main service running on port ${PORT}`);
});

export default app;
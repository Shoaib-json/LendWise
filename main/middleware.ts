import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import axios from 'axios';

export default (req: Request, res: Response, next: NextFunction) => {
  const token = req.cookies?.token;

  if (!token) {
    if (req.originalUrl === "http://localhost:3001/") {
      return next();    
    }
    return axios.get("http://localhost:3001/")
  }

  try {
    const decoded = jwt.verify(token, "Truck");
    (req as any).user = decoded;
    next();
  } catch (err: any) {
    console.log("JWT verification failed:", err.message);
    res.clearCookie("token");

    if (req.originalUrl === "/user/log") {
      return next();
    }

    return res.redirect("/user/log");
  }
};

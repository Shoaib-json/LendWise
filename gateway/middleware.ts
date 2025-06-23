import { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';

const port = process.env.AUTH_PORT;


export default function auth(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies?.token;
  console.log("Middleware token:", token);

  if (!token) {
    console.log("No token, redirecting to login");
    return res.redirect(`http://localhost:${port}`);
  }
  const secret = process.env.COOKIE_SECRET;
    if (!secret) {
  throw new Error("COOKIE_SECRET is not defined");
  }
  try {
    const decoded = jwt.verify(token, secret);
    (req as any).user = decoded;
    console.log("Token verified, user:", decoded);
    return next();
  } catch (err: any) {
    console.error("Invalid token:", err.message);
    res.clearCookie("token");
    return res.redirect(`http://localhost:${port}`);
  }
}
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config({path :'../.env'});
const port = process.env.AUTH_PORT;

export default function auth(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies?.token;
  console.log("Middleware token:", token);

  if (!token) {
    console.log("No token, redirecting to login");
    return res.redirect(`http://localhost:${port}/`);
  }

  try {
    const secret = process.env.COOKIE_SECRET as string;
    const decoded = jwt.verify(token, secret);
    req.user = decoded;
    console.log("Token verified, user:", decoded);
    return next();
  } catch (err: any) {
    console.error("Invalid token:", err.message);
    res.clearCookie("token");
    return res.redirect(`http://localhost:${port}/`);
  }
}

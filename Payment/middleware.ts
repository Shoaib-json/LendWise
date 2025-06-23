import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';


export default function auth(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies?.token;
  console.log("Middleware token:", token);

  if (!token) {
    console.log("No token, redirecting to login");
    return res.redirect("http://localhost:3001/");
  }

  try {
    const decoded = jwt.verify(token, "Truck");
    (req as any).user = decoded;
    console.log("Token verified, user:", decoded);
    return next();
  } catch (err: any) {
    console.error("Invalid token:", err.message);
    res.clearCookie("token");
    return res.redirect("http://localhost:3001/");
  }
}
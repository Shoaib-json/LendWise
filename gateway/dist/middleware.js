"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = auth;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config({ path: '../.env' });
const port = process.env.AUTH_PORT;
function auth(req, res, next) {
    const token = req.cookies?.token;
    console.log("Middleware token:", token);
    if (!token) {
        console.log("No token, redirecting to login");
        return res.redirect(`http://localhost:${port}/`);
    }
    try {
        const secret = process.env.COOKIE_SECRET;
        const decoded = jsonwebtoken_1.default.verify(token, secret);
        req.user = decoded;
        console.log("Token verified, user:", decoded);
        return next();
    }
    catch (err) {
        console.error("Invalid token:", err.message);
        res.clearCookie("token");
        return res.redirect(`http://localhost:${port}/`);
    }
}

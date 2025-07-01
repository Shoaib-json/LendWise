"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = auth;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const port = process.env.AUTH_PORT;
function auth(req, res, next) {
    var _a;
    const token = (_a = req.cookies) === null || _a === void 0 ? void 0 : _a.token;
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
        const decoded = jsonwebtoken_1.default.verify(token, secret);
        req.user = decoded;
        console.log("Token verified, user:", decoded);
        return next();
    }
    catch (err) {
        console.error("Invalid token:", err.message);
        res.clearCookie("token");
        return res.redirect(`http://localhost:${port}`);
    }
}

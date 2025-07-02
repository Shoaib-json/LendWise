"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const axios_1 = __importDefault(require("axios"));
const middleware_1 = __importDefault(require("./middleware"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
dotenv_1.default.config({ path: '../.env' });
const app = (0, express_1.default)();
const port1 = process.env.GATEWAY_PORT;
const port2 = process.env.MAIN_PORT;
const port3 = process.env.AUTH_PORT;
const port4 = process.env.PAYMENT_PORT;
app.use((0, cookie_parser_1.default)());
app.set('view engine', 'ejs');
app.set('views', path_1.default.join(__dirname, 'views'));
app.use((req, res, next) => {
    res.locals.currUser = req.cookies?.token || null;
    console.log(req.cookies?.token);
    next();
});
app.use((req, res, next) => {
    req.date = new Date();
    console.log(req.date, req.method, req.path);
    next();
});
app.get("/", async (req, res) => {
    if (!port2) {
        console.log("error with the main port");
    }
    try {
        const headers = {};
        // Forward the original cookie header
        if (req.headers.cookie) {
            headers.cookie = req.headers.cookie;
        }
        // Forward user token as a custom header
        if (req.cookies?.token) {
            headers['x-user-token'] = req.cookies.token;
        }
        const response = await axios_1.default.get(`http://localhost:${port2}/home`, {
            headers: headers
        });
        res.set('Content-Type', response.headers['content-type']);
        res.send(response.data);
    }
    catch (error) {
        console.error("Error fetching data:", error);
        res.status(500).send("Error fetching data");
    }
});
app.get("/auth", async (req, res) => {
    if (!port3) {
        console.log("error with the auth port");
    }
    try {
        const response = await axios_1.default.get(`http://localhost:${port3}/`);
        // Forward content-type header and send raw response
        res.set('Content-Type', response.headers['content-type']);
        res.send(response.data);
    }
    catch (error) {
        console.error("Error fetching data:", error);
        res.status(500).send("Error fetching data");
    }
});
app.get("/payment", middleware_1.default, async (req, res) => {
    try {
        const response = await axios_1.default.get(`http://localhost:${port4}/order`);
        // Forward content-type header and send raw response
        res.set('Content-Type', response.headers['content-type']);
        res.send(response.data);
    }
    catch (error) {
        console.error("Error fetching data:", error);
        res.status(500).send("Error fetching data");
    }
});
app.all('/{*any}', (req, res, next) => {
    res.render("errorPage");
    next();
});
app.listen(port1, () => {
    console.log("gateway service running on port", process.env.GATEWAY_PORT);
});

"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
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
    var _a, _b;
    res.locals.currUser = ((_a = req.cookies) === null || _a === void 0 ? void 0 : _a.token) || null;
    console.log((_b = req.cookies) === null || _b === void 0 ? void 0 : _b.token);
    next();
});
app.use((req, res, next) => {
    req.date = new Date();
    console.log(req.date, req.method, req.path);
    next();
});
app.get("/", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
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
        if ((_a = req.cookies) === null || _a === void 0 ? void 0 : _a.token) {
            headers['x-user-token'] = req.cookies.token;
        }
        const response = yield axios_1.default.get(`http://localhost:${port2}/home`, {
            headers: headers
        });
        res.set('Content-Type', response.headers['content-type']);
        res.send(response.data);
    }
    catch (error) {
        console.error("Error fetching data:", error);
        res.status(500).send("Error fetching data");
    }
}));
app.get("/auth", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!port3) {
        console.log("error with the auth port");
    }
    try {
        const response = yield axios_1.default.get(`http://localhost:${port3}/`);
        // Forward content-type header and send raw response
        res.set('Content-Type', response.headers['content-type']);
        res.send(response.data);
    }
    catch (error) {
        console.error("Error fetching data:", error);
        res.status(500).send("Error fetching data");
    }
}));
app.get("/payment", middleware_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const response = yield axios_1.default.get(`http://localhost:${port4}/order`);
        // Forward content-type header and send raw response
        res.set('Content-Type', response.headers['content-type']);
        res.send(response.data);
    }
    catch (error) {
        console.error("Error fetching data:", error);
        res.status(500).send("Error fetching data");
    }
}));
app.all('/{*any}', (req, res, next) => {
    res.render("errorPage");
    next();
});
app.listen(3000, () => {
    console.log("gateway service running on port", process.env.GATEWAY_PORT);
});

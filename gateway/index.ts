import express, { Request, Response } from "express";
import axios from "axios";
import auth from "./middleware.ts"
import cookieParser from 'cookie-parser';

const app = express();

app.use(cookieParser());

app.use((req : Request,res : Response,next : NextFunction)=>{
    req.date = new Date();
    console.log(req.date,req.method , req.path);
    next();
});

app.get("/" ,auth , async (req: Request, res: Response) => {
    try {
        const response = await axios.get("http://localhost:8080/");
        
        res.set('Content-Type', response.headers['content-type']);
        res.send(response.data);
    } catch (error) {
        console.error("Error fetching data:", error);
        res.status(500).send("Error fetching data");
    }
});

app.get("/auth", async (req: Request, res: Response) => {
    try {
        const response = await axios.get("http://localhost:3001/");
        
        // Forward content-type header and send raw response
        res.set('Content-Type', response.headers['content-type']);
        res.send(response.data);
    } catch (error) {
        console.error("Error fetching data:", error);
        res.status(500).send("Error fetching data");
    }
});

app.listen(3000, () => {
    console.log("App is listening on port 3000");
});

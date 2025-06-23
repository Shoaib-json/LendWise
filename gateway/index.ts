import express, { Request, Response , NextFunction} from "express";
import axios from "axios";
import auth from "./middleware"
import cookieParser from 'cookie-parser';
import dotenv from "dotenv";

dotenv.config({ path: '../.env' });

const app = express();

const port1 = process.env.GATEWAY_PORT;
const port2 = process.env.MAIN_PORT ;
const port3 = process.env.AUTH_PORT;
const port4 = process.env.PAYMENT_PORT;

app.use(cookieParser());

declare global {
  namespace Express {
    interface Request {
      date?: Date;
    }
  }
}


app.use((req : Request,res : Response,next : NextFunction)=>{
    req.date = new Date();
    console.log(req.date,req.method , req.path);
    next();
});

app.get("/" ,auth , async (req: Request, res: Response) => {
    if(!port2){
        console.log("error with the main port")
    }
    try {
        const response = await axios.get(`http://localhost:${port2}/`);
        
        res.set('Content-Type', response.headers['content-type']);
        res.send(response.data);
    } catch (error) {
        console.error("Error fetching data:", error);
        res.status(500).send("Error fetching data");
    }
});

app.get("/auth", async (req: Request, res: Response) => {
    if(!port3){
        console.log("error with the auth port")
    }
    try {
        const response = await axios.get(`http://localhost:${port3}/`);
        
        // Forward content-type header and send raw response
        res.set('Content-Type', response.headers['content-type']);
        res.send(response.data);
    } catch (error) {
        console.error("Error fetching data:", error);
        res.status(500).send("Error fetching data");
    }
});

app.get("/payment",auth , async (req: Request, res: Response) => {
    try {
        const response = await axios.get(`http://localhost:${port4}/`);
        
        // Forward content-type header and send raw response
        res.set('Content-Type', response.headers['content-type']);
        res.send(response.data);
    } catch (error) {
        console.error("Error fetching data:", error);
        res.status(500).send("Error fetching data");
    }
});

app.listen(port1, () => {
    console.log("Main service running on port", process.env.GATEWAY_PORT);

});
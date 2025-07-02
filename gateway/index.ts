import express, { Request, Response , NextFunction} from "express";
import axios from "axios";
import auth from "./middleware"
import cookieParser from 'cookie-parser';
import dotenv from "dotenv";
import path from 'path'

dotenv.config({ path: '../.env' });

const app = express();

const port1 = process.env.GATEWAY_PORT;
const port2 = process.env.MAIN_PORT ;
const port3 = process.env.AUTH_PORT;
const port4 = process.env.PAYMENT_PORT;

app.use(cookieParser());
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

declare global {
  namespace Express {
    interface Request {
      date?: Date;
      user?: any; // Add this for the auth middleware
    }
  }
}

app.use((req: Request, res: Response, next: NextFunction) => {
  res.locals.currUser = req.cookies?.token || null;
  console.log(req.cookies?.token);
  next();
});

app.use((req : Request,res : Response,next : NextFunction)=>{
    req.date = new Date();
    console.log(req.date,req.method , req.path);
    next();
});

app.get("/" , async (req: Request, res: Response) => {
    if(!port2){
        console.log("error with the main port")
    }
    try {
        const headers: any = {};
        
        // Forward the original cookie header
        if (req.headers.cookie) {
            headers.cookie = req.headers.cookie;
        }
        
        // Forward user token as a custom header
        if (req.cookies?.token) {
            headers['x-user-token'] = req.cookies.token;
        }

        const response = await axios.get(`http://localhost:${port2}/home`, {
            headers: headers
        });
                 
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
        const response = await axios.get(`http://localhost:${port4}/order`);
                 
        // Forward content-type header and send raw response
        res.set('Content-Type', response.headers['content-type']);
        res.send(response.data);
    } catch (error) {
        console.error("Error fetching data:", error);
        res.status(500).send("Error fetching data");
    }
});


app.all('/{*any}', (req: Request, res: Response, next: NextFunction) => {
  res.render("errorPage")
  next();
});

app.listen(port1, () => {
    console.log("gateway service running on port", process.env.GATEWAY_PORT);
});
import express, { Request, Response } from "express";
import axios from "axios";

const app = express();

app.get("/", async (req: Request, res: Response) => {
  try {
    const response = await axios.get("https://razorpay.me/@loaner");
    res.status(200).json(response.data);
  } catch (error) {
    console.error("Error fetching data:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

app.listen(3002, () => {
  console.log("App is listening on port 3002");
});

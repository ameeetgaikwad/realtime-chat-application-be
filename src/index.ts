import express, { Express, NextFunction, Request, Response } from "express";
import dotenv from "dotenv";
import cors from "cors";
import AppError from "./utils/appError";
dotenv.config();

const app: Express = express();

// Add cross origin
app.use(cors());

// Development logging
if (process.env.NODE_ENV === "development") {
  console.log("Development mode");
}

app.get("/", (req: Request, res: Response) => {
  res.send("Server is live");
});

app.all("*", (req: Request, res: Response, next: NextFunction) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server`, 404));
});

const port = process.env.PORT || 8000;

app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});

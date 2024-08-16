import express, { Express, NextFunction, Request, Response } from "express";

const router = express.Router();

router.get("/", (req: Request, res: Response) => {
  res.json({ message: "User route" });
});

export default router;

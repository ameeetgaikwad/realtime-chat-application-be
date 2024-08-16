import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
// import multer from 'multer';
// import path from "path";
import dotenv from "dotenv";
import cors from "cors";

import { setupSocketHandlers } from "./socketHandlers";

dotenv.config();

const app = express();

const corsOptions = {
  origin: 'https://realtime-chat-application-snowy-xi.vercel.app',
  methods: ['GET', 'POST'],
  credentials: true,
  optionsSuccessStatus: 204,
};
app.use(cors(corsOptions));

const server = createServer(app);
const io = new Server(server, {
  cors: corsOptions
});



// File upload setup
// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, 'uploads/');
//   },
//   filename: (req, file, cb) => {
//     cb(null, Date.now() + path.extname(file.originalname));
//   }
// });
// const upload = multer({ storage: storage });

// app.post('/upload', upload.single('file'), (req, res) => {
//   if (req.file) {
//     res.json({ url: `/uploads/${req.file.filename}` });
//   } else {
//     res.status(400).send('No file uploaded.');
//   }
// });

// Set up socket handlers
setupSocketHandlers(io);

app.get("/", (req, res) => {
  res.send("Server is live");
});

const port = process.env.PORT || 8000;

server.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});

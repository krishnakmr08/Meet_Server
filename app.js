require("dotenv").config();
require("express-async-errors");
const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const connectDB = require("./config/connect");
const notFoundMiddleware = require("./middleware/not-found");
const errorHandlerMiddleware = require("./middleware/error-handler");

// Import socket handler
const webRTCSignalingSocket = require("./controllers/sockets");
const Session = require("./models/session");

const app = express();
app.use(express.json());

const server = http.createServer(app);

const io = socketIo(server, { cors: { origin: "*" } });

app.post("/create-session", async (req, res) => {
  try {
    const sessionId = Math.random().toString(36).slice(2, 11);
    const session = new Session({ sessionId, participants: [] });
    await session.save();
    res.json({ sessionId });
  } catch (error) {
    console.log(error);
  }
});

app.get("/is-alive", async (req, res) => {
  try {
    const { sessionId } = req.query;
    console.log(sessionId)
    const session = await Session.findOne({ sessionId });
    console.log(session)
    res.json({ isAlive: session });
  } catch (error) {
    console.log(error);
  }
});
// Attach the websocket instance to the request object
app.use((req, res, next) => {
  req.io = io;
  return next();
});

// Intialize the WebSocket handling logic
webRTCSignalingSocket(io);

//Middleware
app.use(notFoundMiddleware);
app.use(errorHandlerMiddleware);

const start = async () => {
  try {
    await connectDB(process.env.MONGO_URI);
    server.listen(process.env.PORT || 3000, "0.0.0.0", () =>
      console.log(
        `HTTP server is running on port http://localhost:${
          process.env.PORT || 3000
        }`
      )
    );
  } catch (error) {
    console.log(error);
  }
};

start();

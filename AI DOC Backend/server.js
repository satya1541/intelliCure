require("dotenv").config();

const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const { ALLOWED_ORIGINS, PORT } = require("./src/config");
const { proxyIcuCameraFeed } = require("./src/icuCameraFeed");
const { registerSocketHandlers } = require("./src/socketHandlers");

const app = express();
app.use(cors({ origin: ALLOWED_ORIGINS }));
app.use("/icu-stream", proxyIcuCameraFeed);
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ALLOWED_ORIGINS,
    methods: ["GET", "POST"],
  },
});

registerSocketHandlers(io);

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

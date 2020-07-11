import http from "http";
import express from "express";
import cors from "cors";
import { Server } from "colyseus";
import { monitor } from "@colyseus/monitor";
import mongoose from "mongoose";

import { GameRoom } from "./GameRoom";
import router from "./routes";
import { handle404Error, handleError } from "./errors/handler";

(async () => {
  const authField =
    (process.env.MONGO_USERNAME || "root") +
    ":" +
    (process.env.MONGO_PASSWORD || "1234");

  const urlField =
    process.env.MONGO_URL ||
    (process.env.MONGO_HOST
      ? `${process.env.MONGO_HOST}:27017`
      : "localhost:27017");

  console.log(`Connect to mongodb://${authField}@${urlField}`);

  await mongoose.connect(`mongodb://${authField}@${urlField}`, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    dbName: `${process.env.MONGO_DB_NAME || "tictactoe"}`,
  });

  const port = Number(process.env.PORT || 2567);
  const app = express();

  app.use(cors());
  app.use(express.json());

  const server = http.createServer(app);
  const gameServer = new Server({
    server,
  });

  // register your room handlers
  gameServer.define("game_room", GameRoom);

  // register colyseus monitor AFTER registering your room handlers
  app.use("/colyseus", monitor());

  // for health check
  app.get("/health-check", (req, res) => {
    res.json({
      status: "OK",
    });
  });

  app.use("/api", router);

  // error handling
  app.use(handle404Error);
  app.use(handleError);

  gameServer.listen(port);
  console.log(`Listening on ${port}`);
})();

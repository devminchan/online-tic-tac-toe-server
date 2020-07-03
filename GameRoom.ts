import { Room, Client } from "colyseus";
import { Schema, type, ArraySchema, MapSchema } from "@colyseus/schema";

export class Mark extends Schema {
  constructor(params: { playerId: string; turnNumber: number; point: number }) {
    super();

    this.playerId = params.playerId;
    this.turnNumber = params.turnNumber;
    this.point = params.point;
  }

  @type("string")
  playerId: string; // by

  @type("number")
  turnNumber: number; // turn count

  @type("number")
  point: number;
}

const MAX_MARKS = 100;

export class Player extends Schema {
  constructor(params: { username: string; isFirst: boolean }) {
    super();

    this.username = params.username;
    this.isFirst = params.isFirst;
  }

  @type("string")
  username: string;

  @type("boolean")
  isFirst: boolean = false;
}

interface GameResult {
  winner?: string; // 'draw' is null
}

interface MarkCommand {
  point: number;
}

export class State extends Schema {
  @type({ map: Player })
  players = new MapSchema<Player>();

  @type("number")
  turnCount = 1;

  @type([Mark])
  marks = new ArraySchema<Mark>();

  constructor() {
    super();

    // init marks
    console.log("Init game state");
  }

  createMark(playerId: string, point: number): Mark {
    if (!this.checkPointIsAvailable(point)) {
      return null;
    }

    const newMark = new Mark({
      playerId,
      turnNumber: this.turnCount++,
      point,
    });

    this.marks.push(newMark);

    return newMark;
  }

  checkGameEnd(): GameResult {
    if (this.turnCount > MAX_MARKS) {
      return {
        winner: null,
      };
    }

    return null;
  }

  private checkPointIsAvailable(point: number): boolean {
    if (this.marks[point]) {
      return false;
    }

    return true;
  }
}

export class GameRoom extends Room<State> {
  maxClients = 2;

  onCreate(options: any) {
    console.log("GameRoom created!", options);
    this.setState(new State());

    this.onMessage("mark", async (client, markCommand: MarkCommand) => {
      const gameResult = this.state.checkGameEnd();

      const nowPlayer: Player = this.state.players[client.sessionId];

      // not my turn
      if (this.state.turnCount % 2 === 0 && nowPlayer.isFirst) {
        this.send(client, "messages", "[SYSTEM] wait for opponent turn...");
      }

      // not my turn
      if (this.state.turnCount % 2 === 1 && !nowPlayer.isFirst) {
        this.send(client, "messages", "[SYSTEM] wait for opponent turn...");
      }

      const newMark = this.state.createMark(
        client.sessionId,
        markCommand.point
      );

      if (!newMark) {
        this.send(client, "messages", "Can't place mark at this point");
      } else {
        this.broadcast("gameEvent", newMark.toJSON());
      }

      if (gameResult) {
        // when game ends
        this.broadcast("gameResult", gameResult);
        await this.disconnect();
        return;
      }
    });
  }

  onJoin(client: Client, options: any) {
    const randomIdx = Math.floor(Math.random() * 1000);
    const username = options.username || `GUEST-${randomIdx}`;

    let player: Player = null;

    if (this.clients.length > 0) {
      player = new Player({
        username,
        isFirst: false,
      });
    } else {
      player = new Player({
        username,
        isFirst: true,
      });
    }

    console.log(`${client.sessionId} joined for game`);

    this.state.players[client.sessionId] = player;

    this.broadcast("joined", {
      username: player.username,
      isFirst: player.isFirst,
    });
  }

  onLeave(client: Client, consented: boolean) {
    this.broadcast("messages", `${client.sessionId} left.`);

    delete this.state.players[client.sessionId];

    this.broadcast("gameResult", {
      winner: this.clients[0].sessionId,
    } as GameResult);

    this.disconnect();
  }

  onDispose() {
    console.log("Dispose Game room");
  }
}

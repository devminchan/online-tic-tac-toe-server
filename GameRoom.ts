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

  @type("string")
  nowPlayerId: string;

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

    this.nextTurn(); // 다음턴 진행

    return newMark;
  }

  checkIsPlayerTurn(playerId: string): boolean {
    console.log(`${this.nowPlayerId}, ${playerId}`);

    if (this.nowPlayerId === playerId) {
      return true;
    }

    return false;
  }

  checkGameEnd(): GameResult {
    if (this.turnCount > MAX_MARKS) {
      return {
        winner: null,
      };
    }

    return null;
  }

  private nextTurn() {
    console.log("next turn");
    const iterator = this.players._indexes.keys();

    let nextId = iterator.next().value;

    if (nextId !== this.nowPlayerId) {
      this.nowPlayerId = nextId;
    } else {
      this.nowPlayerId = iterator.next().value;
    }
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
      if (this.clients.length < 2) {
        client.send("messages", "[SYSTEM] game not started");
        return;
      }

      if (!this.state.checkIsPlayerTurn(client.sessionId)) {
        client.send("messages", "[SYSTEM] now is opponent turn");
        return;
      }

      const newMark = this.state.createMark(
        client.sessionId,
        markCommand.point
      );

      if (!newMark) {
        client.send("messages", "[SYSTEM] can't place mark at this point");
        return;
      } else {
        this.broadcast("gameEvent", newMark.toJSON());
      }

      const gameResult = this.state.checkGameEnd();

      if (gameResult) {
        // when game ends
        this.broadcast("gameResult", gameResult);
        await this.disconnect();
      }
    });

    this.onMessage("exit", (client, options) => {
      client.leave();
    });
  }

  onJoin(client: Client, options: any) {
    const randomIdx = Math.floor(Math.random() * 1000);
    const username = options.username || `GUEST-${randomIdx}`;

    let player: Player = null;

    console.log(`${client.sessionId} joined for game`);

    if (this.state.players._indexes.size > 0) {
      player = new Player({
        username,
        isFirst: false,
      });
    } else {
      player = new Player({
        username,
        isFirst: true,
      });

      this.state.nowPlayerId = client.sessionId; // 먼저 들어온 사람 선
    }

    this.state.players[client.sessionId] = player;
    this.broadcast("joined", player.toJSON());
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

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
      // 이미 mark가 놓여있는지 확인
      return null;
    }

    // mark 생성 및 push
    const newMark = new Mark({
      playerId,
      turnNumber: this.turnCount,
      point,
    });

    this.marks.push(newMark);

    this.nextTurn(); // 다음턴 진행 작업, 플레이어 교체 및 turnCount 증가

    return newMark;
  }

  // 현재 플레이어 차례인지 확인
  checkIsPlayerTurn(playerId: string): boolean {
    if (this.nowPlayerId === playerId) {
      return true;
    }

    return false;
  }

  // 현재 상태가 게임오버 조건인지 확인
  checkGameEnd(): GameResult {
    if (this.turnCount >= MAX_MARKS) {
      return {
        winner: null,
      };
    }

    return null;
  }

  // 다음턴 진행 작업
  private nextTurn() {
    this.turnCount += 1; // turnCount 증가

    const iterator = this.players._indexes.keys();

    let nextId = iterator.next().value;

    // 플레이어 교체
    if (nextId !== this.nowPlayerId) {
      this.nowPlayerId = nextId;
    } else {
      this.nowPlayerId = iterator.next().value;
    }
  }

  private checkPointIsAvailable(point: number): boolean {
    for (let i = 0; i < this.marks.length; i++) {
      console.log(this.marks[i]);

      if (this.marks[i].point === point) {
        return false;
      }
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
        // 플레이어 2명이 아닐때
        client.send("messages", "[SYSTEM] game not started");
        return;
      }

      // 현재 자신 턴이 아니면 작업 중지
      if (!this.state.checkIsPlayerTurn(client.sessionId)) {
        client.send("messages", "[SYSTEM] now is opponent turn");
        return;
      }

      const newMark = this.state.createMark(
        client.sessionId,
        markCommand.point
      );

      if (!newMark) {
        // 마크가 생성되지 않았을 때
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

    this.onMessage("message", (client, options) => {
      const message: string = options.message;

      if (message && message.length > 0 && message.trim().length > 0) {
        const username = this.state.players[client.sessionId].username;
        console.log("chatting", `[${username}] ${message}`);

        this.broadcast("messages", `[${username}] ${message}`);
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

    const iter = this.state.players._indexes.keys();
    const playerList = [];

    let targetId = iter.next().value;

    if (this.state.players[targetId]) {
      playerList.push(this.state.players[targetId]);
    }

    playerList.push(player.toJSON());

    this.broadcast("players", playerList);
  }

  onLeave(client: Client, consented: boolean) {
    this.broadcast(
      "messages",
      `[SYSTEM] ${this.state.players[client.sessionId].username} left.`
    );

    const iter = this.state.players._indexes.keys();

    let winnerSessionId = iter.next().value;

    // winnerSessionId가 나간 사람의 sessionId라면
    if (winnerSessionId === client.sessionId) {
      winnerSessionId = iter.next().value; // 나가지 않은 사람의 sessionId로 교체
    }

    this.broadcast("gameResult", {
      winner: this.state.players[winnerSessionId].username,
    } as GameResult);

    this.disconnect().catch((e) => {
      console.log(`An error occured!`);
      console.error(e);
    });
  }

  onDispose() {
    console.log("Dispose Game room");
  }
}

import { Room, Client } from "colyseus";
import { Schema, type, ArraySchema, MapSchema } from "@colyseus/schema";
import jwt from "jsonwebtoken";
import { DocumentType } from "@typegoose/typegoose";
import { JWT_SECRET } from "./constrants";
import UserModel, { User } from "./models/UserModel";

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

const MAX_MARKS = 361;

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
  winner: string | null; // 'draw' is null
}

interface MarkCommand {
  point: number;
}

export class State extends Schema {
  @type({ map: Player })
  players = new MapSchema<Player>();

  @type("number")
  turnCount: number = 1;

  @type("string")
  nowPlayerId?: string;

  @type([Mark])
  marks = new ArraySchema<Mark>();

  @type("boolean")
  isOver: boolean = false;

  constructor() {
    super();
    // init marks
    console.log("Init game state");
  }

  createMark(playerId: string, point: number): Mark | null {
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
  checkGameEnd(): GameResult | null {
    if (this.turnCount >= MAX_MARKS) {
      return {
        winner: null,
      };
    }

    const isEnd = this._checkGameEnd(
      this.marks[this.marks.length - 1].point,
      this.nowPlayerId!
    );

    if (isEnd) {
      return {
        winner: this.players[this.nowPlayerId!].username,
      };
    }

    return null;
  }

  // 다음턴 진행 작업
  nextTurn(): void {
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
      if (this.marks[i].point === point) {
        return false;
      }
    }

    return true;
  }

  private _checkGameEnd(point: number, playerId: string): boolean {
    enum Direction {
      TOP_LEFT,
      TOP,
      TOP_RIGHT,
      RIGHT,
      BOTTOM_RIGHT,
      BOTTOM,
      BOTTOM_LEFT,
      LEFT,
    }

    const checkTmpVars = (tmpY: number, tmpX: number): boolean => {
      if (tmpY < 0 && tmpY >= 19) {
        return false;
      } else if (tmpX < 0 && tmpX >= 19) {
        return false;
      }

      return true;
    };

    let y = Math.floor(point / 19);
    let x = point % 19;

    for (let i = 0; i < 8; i++) {
      let j = 0;

      for (j = 0; j < 5; j++) {
        let tmpY = y;
        let tmpX = x;

        switch (i as Direction) {
          case Direction.TOP_LEFT:
            tmpY -= j;
            tmpX -= j;
            break;
          case Direction.TOP:
            tmpY -= j;
            break;
          case Direction.TOP_RIGHT:
            tmpY -= j;
            tmpX += j;
            break;
          case Direction.RIGHT:
            tmpX += j;
            break;
          case Direction.BOTTOM_RIGHT:
            tmpY += j;
            tmpX += j;
            break;
          case Direction.BOTTOM:
            tmpY += j;
            break;
          case Direction.BOTTOM_LEFT:
            tmpY += j;
            tmpX -= j;
            break;
          case Direction.LEFT:
            tmpX -= j;
            break;
        }

        if (!checkTmpVars(tmpY, tmpX)) {
          break;
        }

        const target = this.marks.find(
          (mark) => mark.point === tmpY * 19 + tmpX
        );

        if (!target || target.playerId !== playerId) {
          break;
        }
      }

      if (j >= 5) {
        return true;
      }
    }

    return false;
  }
}

type UserInfo = DocumentType<Exclude<User, "password">>;

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

      const gameResult = this.state.checkGameEnd();
      this.state.nextTurn(); // 다음턴 진행 작업, 플레이어 교체 및 turnCount 증가

      if (!newMark) {
        // 마크가 생성되지 않았을 때
        client.send("messages", "[SYSTEM] can't place mark at this point");
        return;
      } else {
        this.broadcast("gameEvent", newMark.toJSON());
      }

      if (gameResult) {
        // when game ends
        this.state.isOver = true;

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

  async onAuth(client: Client, options: any, request: any): Promise<UserInfo> {
    const token = options.accessToken;
    let decoded: UserInfo | null;

    try {
      decoded = this.validateToken(token) as UserInfo;
    } catch (e) {
      throw new Error('jwt exception');
    }

    if (!decoded) {
      throw new Error("can't recongnize user");
    }

    const user = await UserModel.findById(decoded._id);

    if (!user) {
      throw new Error("user not found");
    }

    const { password, ...userInfo } = user.toJSON();
    return userInfo;
  }

  private validateToken(token: string): UserInfo {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded as UserInfo;
  }

  onJoin(client: Client, options: any) {
    const { username } = client.auth as UserInfo;

    let player: Player | null = null;

    console.log(`${username} joined the game`);

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
    this.broadcast("messages", `[SYSTEM] ${username} joined`);

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

    if (!this.state.isOver) {
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
  }

  onDispose() {
    console.log("Dispose Game room");
  }
}

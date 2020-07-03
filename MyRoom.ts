import { Room, Client } from "colyseus";

export class MyRoom extends Room {
  maxClients = 100;

  onCreate(options: any) {
    console.log("ChatRoom created!", options);

    this.onMessage("message", (client, message) => {
      console.log(`Received message: ${message}`);
      this.broadcast("messages", `${client.sessionId} ${message}`);
    });
  }

  onJoin(client: Client, options: any) {
    this.broadcast("messages", `${client.sessionId} joined.`);
  }

  onLeave(client: Client, consented: boolean) {
    this.broadcast("messages", `${client.sessionId} left.`);
  }

  onDispose() {
    console.log("Dispose Chatroom");
  }
}

import { EventEmitter } from "node:events";
import { WebSocket } from "ws";
import Parser from "./parser.js";

export enum CAIWebsocketConnectionType {
  Disconnected = 0,
  DM = 1,
  GroupChat = 2,
}

export interface ICAIWebsocketCreation {
  url: string;
  edgeRollout: string;
  authorization: string;
  userId: number;
}

export interface ICAIWebsocketMessage {
  data: any;
  parseJSON: boolean;
  expectedReturnCommand?: string;
  messageType: CAIWebsocketConnectionType;
  waitForAIResponse: boolean;
  streaming: boolean; // streams give an output of an array instead of the message straight up
  expectedRequestId?: string;
  fireAndForget?: boolean; // if true, the request will not be added to the pending requests and will not be awaited for a response
}
export interface ICAIWebsocketCommand {
  command: string;
  expectedReturnCommand?: string;
  originId: "Android" | "web-next";
  waitForAIResponse?: boolean;
  streaming: boolean;
  payload: any;
  fireAndForget?: boolean; // if true, the request will not be added to the pending requests and will not be awaited for a response
}
interface PendingRequest {
  resolve(value: any): void;
  reject(error: Error): void;

  options: ICAIWebsocketMessage;

  timeout: NodeJS.Timeout;

  packets?: any[];

  lastPacket?: any;
}

export class CAIWebsocket extends EventEmitter {
  private address = "";
  private cookie = "";
  private userId = 0;
  private websocket?: WebSocket = undefined;
  private pending = new Map<string, PendingRequest>();
  private _connected = false;
  public get connected() {
    return this._connected;
  }
  public withCheck: boolean = false;
  async open(withCheck: boolean): Promise<CAIWebsocket> {
    return new Promise((resolve, reject) => {
      this.withCheck = withCheck;
      const websocket = new WebSocket(this.address, {
        headers: { Cookie: this.cookie },
      });
      this.websocket = websocket;
      const handleMessage = async (buffer: Buffer) => {
        const raw = buffer.toString("utf8");
        // used to keep alive connection
        if (raw === "{}") {
          this.websocket?.send("{}");
          return;
        }

        let message;

        try {
          message = await Parser.parseJSON(raw, false);
        } catch {
          return;
        }

        if (this.withCheck) {
          if (message.connect?.pong) {
            this._connected = true;
            this.emit("connected");
            resolve(this);

            this.withCheck = false;
            return;
          }
        }

        this.onMessage(message);
      };

      websocket.once("open", () => {
        if (!this.withCheck) {
          this.emit("connected");
          this._connected = true;
          resolve(this);
          return;
        }

        const payload =
          Parser.stringify({ connect: { name: "js" }, id: 1 }) +
          Parser.stringify({
            subscribe: { channel: `user#${this.userId}` },
            id: 1,
          });
        websocket.send(payload);
      });
      websocket.on("message", handleMessage);
      websocket.once("close", (code: number, reason: Buffer) =>
        reject(`Websocket connection failed (${code}): ${reason}`),
      );
      websocket.once("error", (error) => reject(error.message));
      websocket.on("close", () => {
        this.emit("disconnected");
        this._connected = false;
      });
    });
  }

  private onMessage(message: any) {
    const pending = this.pending.get(message.request_id);

    if (!pending) return;

    this.processPacket(pending, message);
  }
  private processPacket(pending: PendingRequest, message: any) {
    // Unauthorized request for users under 18 years old
    if (message.comment && message.command === "neo_error") {
      throw new Error(`${message.comment}`);
    }
    const turn = message.turn;

    const isFinal = turn?.candidates?.[0]?.is_final ?? false;
    if (!isFinal) return;
    pending.lastPacket = message;

    const isAIResponse = pending.options.waitForAIResponse
      ? message.command === "update_turn" && !turn?.author?.is_human && isFinal
      : isFinal;

    if (!isAIResponse) return;

    clearTimeout(pending.timeout);

    this.pending.delete(message.request_id);

    pending.resolve(pending.packets ?? pending.lastPacket);
  }
  async sendAsync(options: ICAIWebsocketMessage) {
    return new Promise((resolve, reject) => {
      const id = options.expectedRequestId;

      if (!id) return reject(new Error("Missing request id"));
      if (options.fireAndForget) {
        // clean up maps of the request if it is fire and forget
        this.pending.delete(id);
        
        this.websocket!.send(options.data);
        return resolve(undefined);
      }
      const timeout = setTimeout(() => {
        this.pending.delete(id);

        reject(new Error("Timeout"));
      }, 15000);

      this.pending.set(id, {
        resolve,
        reject,
        timeout,
        options,
        packets: options.streaming ? [] : undefined,
      });

      this.websocket!.send(options.data);
    });
  }
  close() {
    this.removeAllListeners();
    if (this.websocket) {
      this.websocket.removeAllListeners();
      this.websocket.close();
      this.websocket = undefined;
    }
    this._connected = false;
  }

  constructor(options: ICAIWebsocketCreation) {
    super();
    this.address = options.url;
    this.cookie = `HTTP_AUTHORIZATION="Token ${options.authorization}"; edge_rollout=${options.edgeRollout};`;
    this.userId = options.userId;
  }
}

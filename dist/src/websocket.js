import { EventEmitter } from "node:events";
import { WebSocket } from "ws";
import Parser from "./parser.js";
export var CAIWebsocketConnectionType;
(function (CAIWebsocketConnectionType) {
    CAIWebsocketConnectionType[CAIWebsocketConnectionType["Disconnected"] = 0] = "Disconnected";
    CAIWebsocketConnectionType[CAIWebsocketConnectionType["DM"] = 1] = "DM";
    CAIWebsocketConnectionType[CAIWebsocketConnectionType["GroupChat"] = 2] = "GroupChat";
})(CAIWebsocketConnectionType || (CAIWebsocketConnectionType = {}));
export class CAIWebsocket extends EventEmitter {
    address = "";
    cookie = "";
    userId = 0;
    websocket = undefined;
    pending = new Map();
    _connected = false;
    get connected() {
        return this._connected;
    }
    withCheck = false;
    async open(withCheck) {
        return new Promise((resolve, reject) => {
            this.withCheck = withCheck;
            const websocket = new WebSocket(this.address, {
                headers: { Cookie: this.cookie },
            });
            this.websocket = websocket;
            const handleMessage = async (buffer) => {
                const raw = buffer.toString("utf8");
                // used to keep alive connection
                if (raw === "{}") {
                    this.websocket?.send("{}");
                    return;
                }
                let message;
                try {
                    message = await Parser.parseJSON(raw, false);
                }
                catch {
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
                const payload = Parser.stringify({ connect: { name: "js" }, id: 1 }) +
                    Parser.stringify({
                        subscribe: { channel: `user#${this.userId}` },
                        id: 1,
                    });
                websocket.send(payload);
            });
            websocket.on("message", handleMessage);
            websocket.once("close", (code, reason) => reject(`Websocket connection failed (${code}): ${reason}`));
            websocket.once("error", (error) => reject(error.message));
            websocket.on("close", () => {
                this.emit("disconnected");
                this._connected = false;
            });
        });
    }
    onMessage(message) {
        const pending = this.pending.get(message.request_id);
        if (!pending)
            return;
        this.processPacket(pending, message);
    }
    processPacket(pending, message) {
        // Unauthorized request for users under 18 years old
        if (message.comment && message.command === "neo_error") {
            throw new Error(`${message.comment}`);
        }
        if (pending.options.expectedReturnCommand &&
            message.command === pending.options.expectedReturnCommand) {
            clearTimeout(pending.timeout);
            this.pending.delete(message.request_id);
            pending.resolve(message);
            return;
        }
        const turn = message.turn;
        const isFinal = turn?.candidates?.[0]?.is_final ?? false;
        if (!isFinal)
            return;
        pending.lastPacket = message;
        const isAIResponse = pending.options.waitForAIResponse
            ? message.command === "update_turn" && !turn?.author?.is_human && isFinal
            : isFinal;
        if (!isAIResponse)
            return;
        clearTimeout(pending.timeout);
        this.pending.delete(message.request_id);
        pending.resolve(pending.packets ?? pending.lastPacket);
    }
    async sendAsync(options) {
        return new Promise((resolve, reject) => {
            const id = options.expectedRequestId;
            if (!id)
                return reject(new Error("Missing request id"));
            if (options.fireAndForget && !options.expectedReturnCommand) {
                this.websocket.send(options.data);
                return resolve(undefined);
            }
            const timeout = setTimeout(() => {
                this.pending.delete(id);
                reject(new Error("Timeout"));
            }, 25000);
            this.pending.set(id, {
                resolve,
                reject,
                timeout,
                options,
                packets: options.streaming ? [] : undefined,
            });
            this.websocket.send(options.data);
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
    constructor(options) {
        super();
        this.address = options.url;
        this.cookie = `HTTP_AUTHORIZATION="Token ${options.authorization}"; edge_rollout=${options.edgeRollout};`;
        this.userId = options.userId;
    }
}
//# sourceMappingURL=websocket.js.map
import { readFileSync } from "fs";
import { CharacterAI } from "./src/index.js";
import readline from "readline";
const token = "Token 5f0e273577966e0da6a521f541b85d2791fb42d0";
class CharacterAIClient {
    token;
    client = new CharacterAI();
    characterId = "rTUa4ljbzj9LSRhfX9df-jrKn84832Cw_aPOz1UKdpc";
    dm = null;
    constructor(token) {
        this.token = token;
    }
    async authenticate() {
        if (this.dm)
            return;
        await this.client.authenticate(this.token);
        console.log("Authenticated successfully!");
        const c = await this.client.fetchCharacter(this.characterId);
        this.dm = await c.DM();
    }
    async sendMessage(message, image) {
        if (!this.dm)
            throw new Error("Not authenticated");
        if (image) {
            const data = await this.dm.uploadImageToServer(image);
            const resp = await this.dm.sendMessage(message, {}, { image: data });
            return resp.content;
        }
        const resp = await this.dm.sendMessage(message, {}, {});
        return resp.content;
    }
}
export const characterAiClient = new CharacterAIClient(token);
async function main() {
    try {
        console.log("Authenticating...");
        await characterAiClient.authenticate();
        console.log("Authenticated successfully!\n");
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
        });
        // Function to prompt user for input
        const promptUser = () => {
            return new Promise((resolve) => {
                rl.question("Enter a message: ", (input) => {
                    resolve(input);
                });
            });
        };
        // Main loop to continuously prompt for messages
        while (true) {
            const userInput = await promptUser();
            if (userInput.toLowerCase() === "exit") {
                console.log("Exiting...");
                break;
            }
            if (!userInput.trim()) {
                console.log("Please enter a valid message.");
                continue;
            }
            if (!characterAiClient) {
                console.log("Client not initialized.");
                continue;
            }
            if (!characterAiClient["dm"]) {
                console.log("DM not initialized.");
                continue;
            }
            if (userInput.includes("que vez aqui?")) {
                await characterAiClient.sendMessage(userInput + "describe lo que puedas ver totalmente, quiero ver que tan inteligente eres", readFileSync("dd.jpg")).then((response) => {
                    console.log("Character AI Response:", response);
                }).catch((error) => {
                    console.error("Error sending message:", error);
                });
                return;
            }
            await characterAiClient.sendMessage(userInput).then((response) => {
                console.log("Character AI Response:", response);
            }).catch((error) => {
                console.error("Error sending message:", error);
            });
        }
    }
    catch (error) {
        console.error("Error:", error);
    }
}
main();
//# sourceMappingURL=testRunner.js.map
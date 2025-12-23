import { CharacterAI, CheckAndThrow } from "../client";
import Parser from "../parser";
import { getterProperty, hiddenProperty } from "../utils/specable";

export class PrivateProfile {
    @hiddenProperty
    protected client: CharacterAI;

    // username
    public username = "";

    // id
    @hiddenProperty
    private id = 0;
    @getterProperty
    public get userId() { return this.id; }
    public set userId(value) { this.id = value; }

    async refreshProfile() {
        this.client.checkAndThrow(CheckAndThrow.RequiresAuthentication);

        const request = await this.client.requester.request("https://plus.character.ai/chat/user/", {
            method: 'GET',
            includeAuthorization: true
        });
        const response = await Parser.parseJSON(request);

        if (!request.ok) throw new Error(response);
        const { user } = response.user;

        this.loadFromInformation(user);
        this.loadFromInformation(user.user);
    }

    loadFromInformation(information: any) {
        if (!information) return;
        
        Object.assign(this, information);
    }

    constructor(client: CharacterAI) {
        this.client = client;
    }
}
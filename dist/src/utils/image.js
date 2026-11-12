var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { CheckAndThrow } from "../client.js";
import Parser from "../parser.js";
import fs from "fs";
import { getterProperty, hiddenProperty, Specable } from "../utils/specable.js";
import { Transformer } from "@napi-rs/image";
const neoImageEndpoint = "https://characterai.io/i/200/static/avatars/";
const betaImageEndpoint = "https://characterai.io/i/400/static/user/";
// class to contain cai related images
/**
 * Holds a cached image transformer to edit and export the image.
 */
export class CAIImage extends Specable {
    // field is get only
    client;
    imageEndpoint = neoImageEndpoint;
    _endpointUrl = "";
    get endpointUrl() {
        return this._endpointUrl;
    }
    get hasImage() {
        return this.endpointUrl != "";
    }
    /**
     * Gets full image URL (if available). Often returns into a `.webp` format.
     * To manipulate, save the file, or do more, use {@link getImage} instead.
     */
    get fullUrl() {
        return this._endpointUrl != ""
            ? `${this.imageEndpoint}${this._endpointUrl}`
            : "";
    }
    // prompt used to generate the image
    _prompt = undefined;
    get prompt() {
        return this._prompt;
    }
    // cannot be set
    image = undefined;
    // if an image is loaded
    get isImageLoaded() {
        return this.image != undefined;
    }
    // if image is uploaded to cai
    _isImageUploaded = false;
    get isImageUploaded() {
        return this._isImageUploaded;
    }
    canUploadChanges;
    // pipeline:
    // create image or load image:
    // get a buffer
    // * buffer makes an image transformer
    clearImage() {
        delete this.image;
    }
    /**
     * Gets an image transformer to manipulate the image.
     * @returns Image transformer
     */
    async getImage() {
        if (this.isImageLoaded)
            return this.image;
        await this.reloadImage();
        return this.image;
    }
    // LOADING methods
    makeImage(target) {
        this.clearImage();
        this.image = new Transformer(typeof target === "string"
            ? fs.readFileSync(target)
            : Buffer.from(target instanceof ArrayBuffer ? new Uint8Array(target) : target));
    }
    async downloadImageBuffer(url, headers) {
        if (!this.hasImage)
            console.warn("[node_characterai] No images are loaded or assigned to this cached image. This could either mean the image doesn't have any fallback or it doesn't exist.");
        return (await fetch(url, { headers })).arrayBuffer();
    }
    /**
     * Uploads the internally stored image to CharacterAI and updates the cached image.
     * @warning This DOES not automatically apply the changes to the avatar, image, etc.. This has to be called with its appropriate `edit()` like or relevant method.
     */
    async uploadChanges() {
        this.client.checkAndThrow(CheckAndThrow.RequiresAuthentication);
        this._isImageUploaded = false;
        if (!this.canUploadChanges())
            throw new Error("You cannot change this image or upload changes for it.");
        if (!this.image)
            throw new Error("Image not available or not loaded");
        const buffer = await this.image.png();
        const file = new File([buffer], "image.png", { type: "image/png" });
        // character ai deserves an award for the most batshit confusing endpoints to upload stuff ever
        const uploadRequest = await this.client.requester.request("https://beta.character.ai/chat/upload-image/", {
            method: "POST",
            includeAuthorization: true,
            formData: { image: file },
            fileFieldName: "image",
        });
        const uploadResponse = await Parser.parseJSON(uploadRequest);
        if (!uploadRequest.ok)
            throw new Error("Could not upload picture");
        const uploadURL = uploadResponse.value;
        const checkRequest = await this.client.requester.request(`${betaImageEndpoint}${uploadURL}`, {
            method: "GET",
            includeAuthorization: true,
        });
        if (checkRequest.status != 200)
            throw new Error(await Parser.parseJSON(checkRequest));
        this._isImageUploaded = true;
        // https://characterai.io/i/400/static/user/temp-images/uploaded/*/*/*/*
        await this.changeToEndpointUrl(uploadURL, betaImageEndpoint);
    }
    // THESE CHANGE THE IMAGE
    /**
     * Changes the internally stored image cache to a specific url.
     * @param url URL of the image
     * @param headers Additional optional headers
     */
    async changeToUrl(url, headers) {
        this.makeImage(await this.downloadImageBuffer(url, headers));
    }
    /**
     * Changes the internally stored image cache to a file path.
     * @param path The absolute or relative file path of the image
     */
    changeToFilePath(path) {
        this.makeImage(fs.readFileSync(path));
    }
    /**
     * Changes the internally stored image cache to a specific {@link Blob} or {@link File}.
     * @param blobOrFile Blob or File instance
     */
    async changeToBlobOrFile(blobOrFile) {
        this.makeImage(await blobOrFile.arrayBuffer());
    }
    /**
     * Changes the internally stored image cache to a {@link Buffer}.
     * @param buffer Buffer or ArrayBuffer instance
     */
    changeToBuffer(buffer) {
        this.makeImage(buffer);
    }
    /**
     * Changes the internally stored image cache to a related Character.AI endpoint image.
     * Do not use if you do not understand what this means.
     * @param endpointUrl Related (neo) endpoint URL
     * @param neoImageEndpoint Custom endpoint if required
     */
    async changeToEndpointUrl(endpointUrl, imageEndpoint = neoImageEndpoint) {
        // first off do this then load the image
        this.imageEndpoint = imageEndpoint;
        this._endpointUrl = endpointUrl;
        // then we download the picture in question
        this.makeImage(await this.downloadImageBuffer(this.fullUrl));
    }
    // this pre loads the image by storing the endpoint url to later load it
    changeToEndpointUrlSync(endpointUrl) {
        this.clearImage();
        this._endpointUrl = endpointUrl;
        this.imageEndpoint = neoImageEndpoint;
    }
    // use this if you need to restore the original image
    /**
     * Reloads the internally stored image cache to the initial endpoint URL.
     * Use the following method to restore if you had made unwanted changes in the internal image.
     */
    async reloadImage() {
        await this.changeToEndpointUrl(this._endpointUrl);
    }
    // extra
    /**
     * Generates multiple image candidates.
     * @param prompt The generation prompt for the images
     * @param numberOfCandidates The amount of image candidates to generate, default is 4
     * @returns Generated a {@link IGeneratedImage} array of generated image canidates if successful.
     */
    async generateImageCandidates(prompt, numberOfCandidates = 4) {
        this.client.checkAndThrow(CheckAndThrow.RequiresAuthentication);
        if (numberOfCandidates <= 0)
            throw new Error("Then number of candidates must be positive and above 0");
        const request = await this.client.requester.request("https://plus.character.ai/chat/character/generate-avatar-options", {
            method: "POST",
            includeAuthorization: true,
            body: Parser.stringify({
                prompt,
                num_candidates: numberOfCandidates,
                model_version: "v1",
            }),
            contentType: "application/json",
        });
        const response = await Parser.parseJSON(request);
        if (!request.ok)
            throw new Error(response);
        return response.result;
    }
    /**
     * Changes the internally stored image cache to a related Character.AI generated image.
     * The first image candidate will be selected. To choose and generate candidates manually, see {@link generateImageCandidates}.
     * @param prompt The generation prompt for the image
     */
    async changeToPrompt(prompt) {
        const candidates = await this.generateImageCandidates(prompt, 4);
        this._prompt = prompt;
        const url = candidates[0].url;
        await this.changeToEndpointUrl(url, "");
    }
    constructor(client, canUploadChanges = true) {
        super();
        this.client = client;
        this.canUploadChanges =
            typeof canUploadChanges == "boolean"
                ? () => canUploadChanges
                : canUploadChanges;
    }
}
__decorate([
    hiddenProperty
], CAIImage.prototype, "client", void 0);
__decorate([
    hiddenProperty
], CAIImage.prototype, "imageEndpoint", void 0);
__decorate([
    hiddenProperty
], CAIImage.prototype, "_endpointUrl", void 0);
__decorate([
    getterProperty
], CAIImage.prototype, "endpointUrl", null);
__decorate([
    hiddenProperty
], CAIImage.prototype, "_prompt", void 0);
__decorate([
    getterProperty
], CAIImage.prototype, "prompt", null);
__decorate([
    hiddenProperty
], CAIImage.prototype, "image", void 0);
__decorate([
    getterProperty
], CAIImage.prototype, "isImageLoaded", null);
__decorate([
    hiddenProperty
], CAIImage.prototype, "_isImageUploaded", void 0);
__decorate([
    getterProperty
], CAIImage.prototype, "isImageUploaded", null);
//# sourceMappingURL=image.js.map
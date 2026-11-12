interface RequesterOptions {
    method: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
    includeAuthorization?: boolean;
    body?: string;
    contentType?: "application/json" | "application/x-www-form-urlencoded" | "multipart/form-data";
    formData?: Record<string, string | Blob>;
    fileFieldName?: string;
}
export default class Requester {
    private authorization;
    updateToken(token: string): void;
    request(url: string, options: RequesterOptions): Promise<Response>;
}
export {};
//# sourceMappingURL=requester.d.ts.map
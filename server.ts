/// SIMPLE SERVER ///

const port = 8080;
const directory = "./static";
const defaultFileName = "index.html";

const contentTypes: Record<string, string> = {
    // app
    "css": "text/css",
    "htm": "text/html",
    "html": "text/html",
    "js": "text/javascript",
    "mjs": "text/javascript",
    // data
    "csv": "text/csv",
    "json": "application/json",
    "txt": "text/plain",
    "xml": "application/xml",
    // images
    "gif": "image/gif",
    "ico": "image/x-icon",
    "jpg": "image/jpeg",
    "jpeg": "image/jpeg",
    "png": "image/png",
    "svg": "image/svg+xml"
};

Deno.serve({ port }, handler);

async function handler(req: Request): Promise<Response> {
    try {
        const fileInfo = await getRequestedFileInfo(req.url);
        const file = await Deno.open(fileInfo.path);
        return new Response(file.readable, {
            headers: {
                "Content-Type": fileInfo.contentType,
                "Content-Length": String(fileInfo.size)
            }
        });
    } catch (error) {
        if (error instanceof Deno.errors.NotFound) {
            return new Response(null, {
                status: 404
            });
        }
        console.error(error);
        return new Response(null, {
            status: 500
        });
    }
}

async function getRequestedFileInfo(url: string): Promise<RequestedFileInfo> {
    let path = directory + new URL(url).pathname;
    let fileInfo;
    if (path.endsWith("/")) {
        path += defaultFileName;
        fileInfo = await Deno.stat(path);
    } else {
        fileInfo = await Deno.stat(path);
        if (fileInfo.isDirectory) {
            path += "/" + defaultFileName;
            fileInfo = await Deno.stat(path);
        }
    }
    const size = fileInfo.size;
    const contentType = getContentType(path.slice(path.lastIndexOf("/") + 1));
    return { path, size, contentType };
}

function getContentType(fileName: string): string {
    const lastDotIndex = fileName.lastIndexOf(".");
    if (lastDotIndex === -1) {
        return "application/octet-stream";
    }
    const extension = fileName.slice(lastDotIndex + 1);
    return contentTypes[extension] ?? "application/octet-stream";
}

interface RequestedFileInfo {
    path: string;
    size: number;
    contentType: string;
}

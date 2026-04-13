/// SIMPLE SERVER ///

/*
Arguments:
  port        - Port number to listen on (default: 8080)
  directory   - Directory to serve files from, absolute or relative to cwd (default: cwd)
  defaultFile - File to serve when a directory is requested (default: index.html)

Example:
  deno run --allow-net --allow-read server.ts port=3000 directory=static defaultFile=main.html
*/

const contentTypes: Record<string, string> = {
    // app
    "css": "text/css",
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

const args = {
    port: 8080,
    directory: Deno.cwd(),
    defaultFile: "index.html",
};

for (const arg of Deno.args) {
    const [key, value] = arg.split("=", 2);
    switch (key) {
        case "port":
            args.port = Number(value);
            break;
        case "directory":
            args.directory = resolvePath(value);
            break;
        case "defaultFile":
            args.defaultFile = value;
            break;
    }
}

Deno.serve({ port: args.port }, handler);

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
    let path = args.directory + new URL(url).pathname;
    let fileInfo;
    if (path.endsWith("/")) {
        path += args.defaultFile;
        fileInfo = await Deno.stat(path);
    } else {
        fileInfo = await Deno.stat(path);
        if (fileInfo.isDirectory) {
            path += "/" + args.defaultFile;
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

function resolvePath(path: string): string {
    return new URL(path, `file://${Deno.cwd()}/`).pathname;
}

interface RequestedFileInfo {
    path: string;
    size: number;
    contentType: string;
}

/// SIMPLE SERVER ///

/*
Arguments:
  --port <port>         - Port number to listen on (default: 8080)
  --directory <path>    - Directory to serve files from, absolute or relative to cwd (default: cwd)
  --defaultFile <name>  - File to serve when a directory is requested (default: index.html)
  --fallbackFile <name> - File to serve when requested file is not found (no default)

Example:
  deno run --allow-net --allow-read server.ts --directory static
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

const args: Arguments = {
    port: 8080,
    directory: Deno.cwd(),
    defaultFile: "index.html"
};

for (let i = 0, l = Deno.args.length; i < l;) {
    switch (Deno.args[i++]) {
        case "--port":
            args.port = Number(Deno.args[i++]);
            break;
        case "--directory":
            args.directory = resolvePath(Deno.args[i++]!);
            break;
        case "--defaultFile":
            args.defaultFile = Deno.args[i++]!;
            break;
        case "--fallbackFile":
            args.fallbackFile = Deno.args[i++]!;
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
    try {
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
        return {
            path,
            size: fileInfo.size,
            contentType: getContentType(path)
        };
    } catch (error) {
        if (error instanceof Deno.errors.NotFound && args.fallbackFile !== undefined) {
            const path = args.directory + "/" + args.fallbackFile;
            const fileInfo = await Deno.stat(path);
            return {
                path,
                size: fileInfo.size,
                contentType: getContentType(path)
            };
        }
        throw error;
    }
}

function getContentType(path: string): string {
    const filename = path.slice(path.lastIndexOf("/") + 1);
    const lastDotIndex = filename.lastIndexOf(".");
    if (lastDotIndex === -1) {
        return "application/octet-stream";
    }
    const extension = filename.slice(lastDotIndex + 1);
    return contentTypes[extension] ?? "application/octet-stream";
}

function resolvePath(path: string): string {
    return new URL(path, `file://${Deno.cwd()}/`).pathname;
}

interface Arguments {
    port: number;
    directory: string;
    defaultFile: string;
    fallbackFile?: string;
}

interface RequestedFileInfo {
    path: string;
    size: number;
    contentType: string;
}

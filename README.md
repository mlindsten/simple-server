### /// SIMPLE SERVER /// ###

```
Arguments:
  --port <port>         - Port number to listen on (default: 8080)
  --directory <path>    - Directory to serve files from, absolute or relative to cwd (default: cwd)
  --defaultFile <name>  - File to serve when a directory is requested (default: index.html)
  --fallbackFile <name> - File to serve when requested file is not found (no default)

Example:
  deno run --allow-net --allow-read server.ts --directory static
```

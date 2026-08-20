# Cloud Agent MCP Migration

## Current state

The original `my-custom-suite` server is a local Node/STDIO MCP server. Its README registers it with a local `node .../index.js` process.

Kilo's current Cloud Agent documentation states that MCP support is still coming. Therefore this repository configuration does NOT claim that the local MCP server is available inside Cloud Agent.

## Migration target

When Cloud Agent MCP becomes available, expose `my-custom-suite` through a supported remote MCP transport rather than assuming a local Windows filesystem or local STDIO process.

Preserve these tool families:

- Health & system
- Menu items
- Notes
- Database
- Export & reporting
- Agent operations
- Chunk retrieval
- Resilient agent tools

## Environment migration

Original server defaults use Windows paths. Cloud Agent runs in Linux.

Use environment variables rather than hard-coded Windows paths:

PROJECT_ROOT
BACKEND_DIR
FRONTEND_DIR
DB_PATH
API_BASE
MAX_OUTPUT_SIZE
SPAWN_DIR
CHUNK_DIR
BACKUP_DIR

Do not copy `C:/Users/...` paths into Cloud Agent.

## Important

The custom MCP server can remain unchanged for local Kilo/VS Code use. Treat this document as the migration plan for the Cloud environment.

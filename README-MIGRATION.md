# Kilo Cloud Agent Migration Package

## Files

- `kilo.jsonc` — project configuration with maximum permissions and custom agents.
- `SYSTEM_PROMPT.md` — Cloud Agent-adapted version of the supplied autonomous-development system prompt.
- `.kilocode/agents/autonomous-dev.md` — primary custom agent.
- `.kilocode/agents/resilience.md` — resilience subagent.
- `.kilocode/agents/verification.md` — verification subagent.
- `mcp/my-custom-suite-cloud-migration.md` — migration notes for the local MCP server.

## Important Cloud limitation

The current Kilo Cloud Agent documentation says MCP support is still coming. The supplied `my-custom-suite` server is a local Node/STDIO MCP server, so it should not be represented as Cloud-connected until Kilo supports the required transport.

## Installation

1. Copy these files into the root of the Git repository used by Cloud Agent.
2. Commit and push them.
3. In Kilo Cloud Agent, connect the GitHub/GitLab repository.
4. Configure the required environment variables/secrets in the Cloud Agent Environment Profile.
5. Add startup commands to install dependencies and run project setup.
6. Start a Cloud Agent session against the repository.
7. Select `autonomous-dev` if it appears in the agent selector.
8. Verify the agent can read the repository and run the project's test/build commands.
9. Do not expect `my-custom-suite` MCP tools to appear until Cloud Agent MCP support is available and the server is exposed using a supported transport.

## Suggested startup commands

Use the project's real package manager and scripts. Examples:

```bash
npm ci
```

or, for a monorepo, the repository's documented setup command.

Do not blindly run both npm and another package manager.

## Secrets

Configure secrets through Cloud Agent's environment/secrets UI rather than committing them.

## Local compatibility

The original local `my-custom-suite` can continue to use its local Node/STDIO configuration for Kilo CLI/VS Code environments.

# texterify-mcp justfile

# List available recipes
default:
    @just --list

# Open the project in opencode with AWS SSO auth
code:
    #!/usr/bin/env bash
    export AWS_PROFILE=flottando-opencode
    export AWS_REGION=eu-west-1
    if ! aws sts get-caller-identity &>/dev/null; then
        echo "AWS SSO session expired, logging in..."
        aws sso login --profile flottando-opencode || exit 1
    fi
    opencode .

# Install dependencies
install:
    pnpm install

# Run the MCP server
start:
    pnpm start

# Run the MCP server in dev mode (watch)
dev:
    pnpm dev

# Type-check without emitting
check:
    pnpm exec tsc --noEmit

# Run all tests
test:
    pnpm exec vitest run

# Run tests in watch mode
test-watch:
    pnpm exec vitest

# Run a single test file
test-file file:
    pnpm exec vitest run {{ file }}

# Docker Setup Guide

## Quick Start

1. **Copy environment variables**: Ensure your `.env.local` file contains all required variables (see below)
2. **Build and run**: `docker-compose up -d`
3. **Check logs**: `docker-compose logs -f`

## Required Environment Variables

Your `.env.local` file must contain:

```bash
# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret-here

# Pipedream Configuration
PIPEDREAM_PROJECT_ID=your-pipedream-project-id
PIPEDREAM_CLIENT_ID=your-pipedream-client-id
PIPEDREAM_CLIENT_SECRET=your-pipedream-client-secret

# OpenAI Configuration (required for AI agents)
OPENAI_API_KEY=your-openai-api-key-here
```

## Important: Pipedream Environment Configuration

**Issue**: In Docker (production mode), the Pipedream SDK connects to the production environment which may not have proxy API access on free tier plans.

**Solution**: We force the Pipedream SDK to use the development environment in Docker by setting:
```
PIPEDREAM_ENVIRONMENT=development
```

This is automatically configured in `docker-compose.yml` and allows Slack channels and Google Sheets to load properly.

## Services

- **app**: Next.js application (port 3000)
- **worker**: Background task processor
- **redis**: Queue and cache storage (port 6379)
- **prisma-migrate**: Database migration (runs once)

## Common Commands

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f app
docker-compose logs -f worker

# Rebuild after code changes
docker-compose down
docker-compose build
docker-compose up -d

# Stop all services
docker-compose down

# Reset everything (including data)
docker-compose down -v
```

## Troubleshooting

### Pipedream API Errors
- Ensure `PIPEDREAM_ENVIRONMENT=development` is set in docker-compose.yml
- Check that your Pipedream project has the correct environment settings

### OpenAI API Errors
- Ensure `OPENAI_API_KEY` is set in your `.env.local` file
- Get your API key from: https://platform.openai.com/api-keys

### Database Issues
- Database file is stored in `./data/dev.db`
- Migrations run automatically via the prisma-migrate service 
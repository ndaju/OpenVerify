# OpenVerify

Open-source, self-hosted Discord verification and backup OAuth2 bot system. Built with Next.js 14, Express, TypeScript, and PostgreSQL.

## Features

- **Discord OAuth2 Integration** — Link Discord accounts, manage servers, and handle guild backups
- **Encrypted Vault System** — Store secrets securely using AES-256-GCM authenticated encryption
- **Real-time Chat** — Discord-style messaging with Socket.io, typing indicators, and online presence
- **Role-based Access Control** — ADMIN, MODERATOR, and USER roles with granular permissions
- **Audit Logging** — Full activity tracking for security and compliance
- **Session Management** — JWT access tokens with HTTP-only refresh token cookies
- **Docker Deployment** — Full containerization with PostgreSQL and Redis

## Architecture

```
openverify/
├── apps/
│   ├── web/                    # Next.js 14 App Router frontend
│   │   ├── src/
│   │   │   ├── app/            # Pages (dashboard, login, chat, vault)
│   │   │   ├── components/     # UI, layout, chat, vault components
│   │   │   ├── hooks/          # Custom React hooks (useSocket)
│   │   │   ├── lib/            # API client, socket client, utils
│   │   │   └── store/          # Zustand state (auth, socket)
│   │   └── Dockerfile
│   └── server/                 # Express + TypeScript backend
│       ├── src/
│       │   ├── config/         # Environment config
│       │   ├── middleware/      # Auth, validation, rate limiting, error handling
│       │   ├── routes/         # Auth, Discord OAuth, Vault, Channels, Users
│       │   ├── socket/         # Socket.io real-time handler
│       │   └── lib/            # Prisma client, JWT utilities
│       └── Dockerfile
├── packages/
│   ├── database/               # Prisma schema, client, and seed
│   │   ├── prisma/schema.prisma
│   │   └── src/
│   └── crypto/                 # AES-256-GCM encryption utilities
│       └── src/
├── docker/
│   └── docker-compose.yml      # Orchestration config
├── .env.example
├── pnpm-workspace.yaml
├── turbo.json
└── package.json
```

## Prerequisites

- Node.js >= 18.0.0
- pnpm >= 9.0.0
- PostgreSQL >= 14
- Redis >= 7 (optional, for Socket.io adapter)
- Docker & Docker Compose (for containerized deployment)
- Discord Application (for OAuth2)

## Discord Application Setup

1. Go to https://discord.com/developers/applications
2. Create a new application and navigate to the OAuth2 section
3. Add a redirect URL: `http://localhost:3000/api/auth/discord/callback`
4. Copy the Client ID and Client Secret
5. (Optional) Create a Bot user and copy the token

## Local Development

### 1. Clone and install dependencies

```bash
git clone https://github.com/your-org/openverify.git
cd openverify
pnpm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env` with your configuration values:

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `REDIS_URL` | Redis connection string |
| `JWT_ACCESS_SECRET` | 64-char random string for access tokens |
| `JWT_REFRESH_SECRET` | 64-char random string for refresh tokens |
| `DISCORD_CLIENT_ID` | Discord OAuth2 client ID |
| `DISCORD_CLIENT_SECRET` | Discord OAuth2 client secret |
| `DISCORD_REDIRECT_URI` | OAuth2 callback URL |
| `VAULT_ENCRYPTION_KEY` | 64-char hex key for AES-256-GCM |
| `SESSION_SECRET` | Random string for session cookies |

### 3. Setup database

```bash
pnpm db:generate
pnpm db:migrate
pnpm db:seed
```

### 4. Start development servers

```bash
pnpm dev
```

This starts:
- **Web** at `http://localhost:3000`
- **Server** at `http://localhost:4000`

## Production with Docker

### 1. Configure environment

```bash
cp .env.example .env
# Edit .env with production values
```

### 2. Build and start

```bash
cd docker
docker compose up -d --build
```

### 3. Run database migrations

```bash
docker compose exec server npx prisma migrate deploy
docker compose exec server npx prisma db seed
```

Services:
- **Web** — `http://localhost:3000`
- **API** — `http://localhost:4000`
- **PostgreSQL** — `localhost:5432`
- **Redis** — `localhost:6379`

## API Documentation

### Authentication

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Create a new account |
| POST | `/api/auth/login` | Sign in |
| POST | `/api/auth/refresh` | Refresh access token |
| POST | `/api/auth/logout` | Sign out |
| GET | `/api/auth/me` | Get current user profile |

### Discord OAuth2

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/discord/auth` | Get Discord OAuth2 URL |
| GET | `/api/discord/callback` | OAuth2 callback |
| GET | `/api/discord/guilds` | List linked guilds |
| DELETE | `/api/discord/disconnect` | Disconnect Discord account |

### Vault

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/vault` | Create encrypted vault |
| GET | `/api/vault` | List accessible vaults |
| GET | `/api/vault/:id` | Get vault metadata |
| POST | `/api/vault/:id/unlock` | Decrypt vault contents |
| PUT | `/api/vault/:id` | Update vault settings |
| DELETE | `/api/vault/:id` | Delete vault |
| POST | `/api/vault/:id/share` | Share vault with user |
| DELETE | `/api/vault/:id/share/:userId` | Remove access |

### Channels & Messages

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/channels/:guildId` | List channels in guild |
| GET | `/api/channels/:guildId/:channelId/messages` | Get messages |
| POST | `/api/channels/:guildId/:channelId/messages` | Send a message |
| DELETE | `/api/channels/:guildId/:channelId/messages/:messageId` | Delete a message |

### Users

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/users` | List users (admin) |
| GET | `/api/users/:id` | Get user profile |
| GET | `/api/users/:id/activity` | Get user activity log |
| PUT | `/api/users/:id/role` | Update user role (admin) |

## Security

- Passwords hashed with bcrypt (12 rounds)
- Vault data encrypted with AES-256-GCM before storage
- JWT access tokens (15min expiry) with HTTP-only refresh token cookies
- Rate limiting on auth and vault endpoints
- Helmet security headers
- Input validation with Zod schemas
- CORS restricted to configured origin
- Audit logging for all sensitive operations

## License

MIT License — see [LICENSE](LICENSE)

## Support

- GitHub Issues: https://github.com/openverify/openverify/issues
- Discord: [Join our server](https://discord.gg/openverify)

<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

RetroChat backend - A NestJS application providing real-time chat, AI-powered style mimicry, and MSN Messenger-inspired features.

## Features

- **Authentication**: Better-auth with session management
- **Real-time Communication**: WebSocket server with Socket.io
- **1-on-1 Chat**: Direct messaging between friends
- **Group Chat**: Multi-user chat rooms with admin controls
- **Friend System**: Send/accept/reject friend requests
- **AI Friend**: Personal AI that learns user chat style
- **Group AI**: Collective AI for group conversations
- **Profile Management**: User profiles with Cloudinary image uploads
- **Database**: PostgreSQL with Drizzle ORM
- **Caching**: Redis for sessions and real-time data

## Architecture

```
backend/src/
├── ai-friend/          # AI Friend style learning and responses
├── chat/               # 1-on-1 messaging
├── friends/            # Friend request management
├── groups/             # Group chat and Group AI
├── profile/            # User profiles and Cloudinary uploads
├── gateway/            # WebSocket server and Redis
├── db/                 # Database schema and connection
└── lib/                # Shared utilities (auth)
```

## Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
# Database
DATABASE_URL=postgresql://...

# Redis
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...

# Better Auth
BETTER_AUTH_SECRET=your-secret-key
BETTER_AUTH_URL=http://localhost:3001  # Production: https://api.appacheur.com
BETTER_AUTH_CLIENT_URL=http://localhost:3000  # Production: https://app.appacheur.com

# WebSocket CORS
FRONTEND_URL=http://localhost:3000  # Production: https://app.appacheur.com

# Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# OpenAI
OPENAI_API_KEY=sk-...

# CORS
ALLOWED_ORIGINS=http://localhost:3000
```

## Project setup

```bash
$ npm install
```

## Database Setup

```bash
# Generate migration
$ npm run db:generate

# Run migrations
$ npm run db:migrate

# Open Drizzle Studio (database GUI)
$ npm run db:studio
```

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Deployment

This backend is part of a monorepo structure. For deployment instructions, see [DEPLOYMENT_SETUP.md](../DEPLOYMENT_SETUP.md) in the root directory.

### Quick Deployment

The backend is deployed from a separate `retrochat-backend` repository that's synced from the monorepo using git subtree.

**Recommended Platforms:**

- Railway
- Render
- AWS (via NestJS Mau)

**Build Configuration:**

- Root directory: `/`
- Build command: `npm install && npm run build`
- Start command: `npm run start:prod`

**Required Environment Variables:**

- `DATABASE_URL` - Neon PostgreSQL connection string
- `UPSTASH_REDIS_REST_URL` - Upstash Redis REST URL
- `UPSTASH_REDIS_REST_TOKEN` - Upstash Redis REST token
- `BETTER_AUTH_SECRET` - Authentication secret key
- `BETTER_AUTH_URL` - Backend URL (must be subdomain of `appacheur.com`, e.g., `https://api.appacheur.com`)
- `BETTER_AUTH_CLIENT_URL` - Frontend URL (must be subdomain of `appacheur.com`, e.g., `https://app.appacheur.com`)
- `FRONTEND_URL` - Frontend URL for WebSocket CORS (must match `BETTER_AUTH_CLIENT_URL`)
- `CLOUDINARY_*` - Cloudinary credentials
- `OPENAI_API_KEY` - OpenAI API key
- `ALLOWED_ORIGINS` - Comma-separated list of allowed CORS origins (optional)
- `NODE_ENV` - Environment (development/production)

**Important**: For production cross-subdomain authentication, both `BETTER_AUTH_URL` and `BETTER_AUTH_CLIENT_URL` must be subdomains of `appacheur.com` (e.g., `api.appacheur.com` and `app.appacheur.com`).

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).

# Treax — Build-in-Public Platform for Student Builders

[![Next.js](https://img.shields.io/badge/Next.js-15.5.22-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.0.0-61DAFB?style=for-the-badge&logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7.3-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-6.2.1-2D3748?style=for-the-badge&logo=prisma)](https://www.prisma.io/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4.0-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![Pusher](https://img.shields.io/badge/Pusher-Channels-300D4F?style=for-the-badge&logo=pusher)](https://pusher.com/)
[![Groq AI](https://img.shields.io/badge/Groq_AI-Llama_3.3_70B-F05032?style=for-the-badge)](https://groq.com/)

**Treax** is a production-grade, build-in-public social platform and marketplace designed specifically for student builders, software engineers, and founders in Bangladesh. 

Every post on Treax is a real building update — a launch, a technical lesson, a setback, a milestone, or a genuine co-founder request. Treax features an intelligent **Anti-Hype AI Content Filter** that evaluates every submission before it reaches the main feed, ensuring there is zero generic fluff, no vague motivational posts, and no low-substance noise.

---

## 📑 Table of Contents

- [Core Technology Stack](#-core-technology-stack)
- [System Architecture & Security](#-system-architecture--security)
- [User Capabilities (Builder & Expert)](#-user-capabilities-builder--expert)
- [Admin Capabilities (Control Room)](#-admin-capabilities-control-room)
- [AI Content Filter & Natural Language Assistant](#-ai-content-filter--natural-language-assistant)
- [Real-Time Messaging & Cloudinary Media](#-real-time-messaging--cloudinary-media)
- [Database Schema & Data Models](#-database-schema--data-models)
- [Getting Started & Installation](#-getting-started--installation)
- [Environment Variables](#-environment-variables)
- [Author](#-author)

---

## 🛠 Core Technology Stack

| Layer | Technology / Library | Description |
| :--- | :--- | :--- |
| **Framework** | **Next.js 15 (App Router)** | Server Components, Server Actions, Dynamic Streaming & Route Handlers |
| **UI Library** | **React 19** | Modern hooks, transition management, and concurrent features |
| **Language** | **TypeScript (Strict Mode)** | Full end-to-end type safety across database models and API payloads |
| **Styling** | **Tailwind CSS v4 + Vanilla CSS** | Custom design tokens, glassmorphism UI, theme variable bindings |
| **Database** | **PostgreSQL (Neon DB)** | Serverless database with pooled connections (PgBouncer) & direct URL for migrations |
| **ORM** | **Prisma v6** | Type-safe query engine with CUID2 identifiers and denormalized counters |
| **Authentication**| **Auth.js (NextAuth v5)** | Credentials provider + University SSO stub, JWT session with role claims |
| **AI Integration**| **Groq SDK (`llama-3.3-70b`)** | Real-time post analysis, bio generation, and natural language agent commands |
| **Real-time Engine**| **Pusher Channels** | WebSocket communication for 1-on-1 messaging and live notifications |
| **Media Storage** | **Cloudinary API** | Client/Server image uploads, transformations, and avatar/cover poster storage |
| **Internationalization**| **next-intl** | English (`en`) and Bengali (`bn`) localization managed via cookies |
| **Testing** | **Vitest & Playwright** | Unit tests for heuristics & E2E browser test suites for critical user journeys |

---

## 🛡 System Architecture & Security

Treax enforces a robust **3-Tier Defense-in-Depth Security Model** to guarantee access control across roles (`BUILDER`, `EXPERT`, `ADMIN`):

1. **Edge Route Guard (`src/middleware.ts`)**:
   Reads the lightweight JWT payload on incoming requests to quickly block unauthorized path access (e.g., restricting `/admin` routes).
2. **Database Role Enforcement (`assertRole()`, `assertAdmin()`)**:
   Located in `src/lib/session.ts`. Every Server Action and API Route re-fetches the authentic user role directly from PostgreSQL before executing any write or update operations.
3. **Prisma Query Scoping**:
   All database operations explicitly bind query scopes to the authenticated user ID (`viewerId`), preventing ID spoofing or horizontal privilege escalation.

---

## 👤 User Capabilities (Builder & Expert)

Users on Treax enjoy a rich ecosystem designed for building, sharing, networking, and monetizing:

### 1. Account Management & Resumable Onboarding
- **Flexible Auth**: Sign up or log in using email credentials or simulated University SSO.
- **Multi-Step Onboarding**: Guided setup collecting builder profile details (university, department, graduation year, focus area, building target, stage, cadence). Progress is saved after every step.
- **Role Progression**: Builders can upgrade their profile status to **Expert** to offer mentorship sessions.

### 2. The Build Feed & Post Creation
- **Deterministic Feed**: Stable post ordering based on `[createdAt DESC, id DESC]`, preventing post shuffling on page refresh.
- **Categorized Updates**: Tag posts as `shipped`, `learned`, `failed`, `metric`, `feedback`, or `seeking`.
- **Media & Metrics Attachments**: Upload project screenshots/images via Cloudinary and append key-value metric strips (e.g. `MRR: $1.2k`, `Users: 500`).
- **Ship Score & AI Verification**: Post quality is analyzed live upon submission. Higher substance yields higher Ship Scores (0–98).

### 3. Social Engagement & Networking
- **Respect System**: Express appreciation for builder updates with a single click.
- **Threaded Comments**: Engage in discussions on specific updates.
- **Follow & Network**: Follow fellow builders to filter the feed specifically for people in your network.
- **Builder Streaks**: Track posting consistency and active streaks displayed on builder cards.

### 4. Glassmorphic Profile & Customization
- **Redesigned Edit Profile Modal**: Glassmorphic dark/light sheet featuring animated inputs, glowing focus states, and gradient accents.
- **Avatar & Banner Upload**: Upload custom high-resolution avatars and cover banners stored securely on Cloudinary.
- **Avatar Color & Initials Fallback**: Custom color palette selection and dynamic initials generator.
- **AI Bio Assistant ("Write it for me")**: Generate a crisp, punchy builder bio powered by Groq LLM with one click.
- **Interest Tags**: Select and display builder focus tags (e.g., Next.js, AI, FinTech, Micro-SaaS).

### 5. Real-Time 1-on-1 Messaging
- **Instant Chat**: Powered by Pusher Channels for sub-second message delivery.
- **Conversation Hub**: View all direct messages, active chatters, and unread badges.
- **Live Notifications**: Automatic real-time notification alerts when receiving new messages, respects, comments, or follows.

### 6. Marketplace & Founder Blogs
- **Services Marketplace**: List freelance, consulting, or software service cards with pricing (e.g., `৳799`, `৳300/hr`), description, delivery timeframe, and CTAs.
- **Service Requests**: Request services from other builders and track request status (`PENDING`, `ACCEPTED`, `DECLINED`, `COMPLETED`).
- **Founder Blogs**: Publish technical write-ups, product teardowns, and founder articles directly on builder profiles.

### 7. Mentorship & Expert Bookings
- **Browse Experts**: Filter verified mentors by title, company, rating, and skills.
- **Book Sessions**: Schedule 1-on-1 mentorship slots (`Free for students` or paid sessions) with custom notes.

### 8. Knowledge Base & Signal Rush Micro-Game
- **Learn Knowledge Base**: Read community case studies, playbooks, founder stories, and templates.
- **Signal Rush Micro-Game**: Test builder instincts in a fast-paced interactive micro-game with a live platform leaderboard (`GameScore`).

### 9. AI Assistant (`/agent`)
- Interface with Treax's built-in AI Assistant to issue natural language commands, receive project advice, draft updates, or auto-fill profiles.

---

## 👑 Admin Capabilities (Control Room)

Users with the **`ADMIN`** role gain full access to the **Control Room (`/admin`)**, an all-in-one executive dashboard:

### 1. Platform Real-Time Analytics
- **Live Metrics**: Monitor total registered builders, accepted posts, total respects, active service listings, and weekly growth statistics.
- **Ad Performance KPIs**: Track total ad campaign spend, total impressions, total clicks, and overall platform CTR.

### 2. User & Identity Management
- **Verification System**: Grant official verified builder badges (green checkmark) to student founders after reviewing identity details.
- **Account Moderation**: Suspend or unsuspend accounts violating community guidelines.
- **Role Assignment**: Promote accounts from `BUILDER` to `EXPERT` or `ADMIN`.

### 3. AI Moderation & Post Audit Queue
- **Audit Rejected Content**: Review posts flagged or bounced by the Anti-Hype AI filter.
- **Manual Overrides**: Manually approve rejected posts or reject improperly passed updates.
- **Filter Reasoning Audit**: Inspect detailed filter logs (heuristic vs LLM verdicts).

### 4. Ad Campaign Management
- **Sponsored Content**: Create, edit, and toggle active status for sponsored ad cards injected seamlessly into the feed at position #3.
- **Budgeting & Spend**: Set maximum budget caps and track click/impression metrics per campaign.

### 5. Platform Billboard Manager
- **Headline & Banner Control**: Update the singleton **Billboard** widget displayed in the right rail across the entire platform with custom image URLs, headlines, links, and CTAs.

### 6. System Audit Logs
- **Immutable Audit Trail**: View comprehensive historical logs of every admin action taken (`user.verify`, `campaign.publish`, `user.suspend`, moderation reviews) with timestamps and actor details.

### 7. Elevated Agent Capabilities
- Execute administrative system commands via `/agent` with elevated privileges (e.g., bulk moderation, feature flags, broadcast announcements).

---

## 🤖 AI Content Filter & Natural Language Assistant

Treax features a two-stage filter pipeline in `src/lib/ai/filter.ts`:

1. **Heuristics Pass (`analyzeHeuristic`)**:
   - Executes deterministic regex pattern matching for substance markers and hype phrases.
   - Evaluates text length, metrics, code snippets, links, and formatting.
   - Assigns an initial **Ship Score (0–98)**.
   - **Rejection is final**: If heuristic checks flag anti-hype violations ("gm", "big things coming", vague motivational threads), the post is immediately rejected without wasting LLM tokens.
2. **LLM Pass (`analyze`)**:
   - Sends accepted or ambiguous posts to **Groq (`llama-3.3-70b-versatile`)**.
   - Refines tag categorization and adjusts Ship Scores based on contextual substance.
   - Operates conservatively: LLM can bounce posts further but cannot overrule heuristic rejections.

---

## 💬 Real-Time Messaging & Cloudinary Media

- **Pusher WebSockets**: Channels are authorized via `/api/pusher/auth`. Incoming messages trigger `client-new-message` events, ensuring zero-latency updates without full page reloads.
- **Cloudinary Integration**: Handled via `src/lib/upload.ts`. Supports client-side file uploads for user profile avatars, cover banners, service previews, and post media with automatic format conversion (WebP/PNG) and size optimization.

---

## 📊 Database Schema & Data Models

The PostgreSQL database is managed via Prisma (`prisma/schema.prisma`) using **CUID2** IDs:

- **`User`**: Core profile data, role (`BUILDER`, `EXPERT`, `ADMIN`), access level, denormalized counters (`streak`, `shipCount`, `respectCount`, `followerCount`), locale/theme, avatars & covers.
- **`Post`**: Updates with `PostTag`, `imageUrl`, metrics JSON, `shipScore`, `filterVerdict` (`ACCEPTED`/`REJECTED`), and counts.
- **`Respect` & `Comment`**: Social engagement joins with cascade deletes.
- **`Follow`**: Builder follower/following graph.
- **`Service` & `ServiceRequest`**: Marketplace service listings and buyer request statuses.
- **`BlogPost`**: Founder profile articles and read time metrics.
- **`Conversation` & `Message`**: Real-time 1-on-1 messaging threads with unread tracker (`ConversationMember`).
- **`Notification`**: Multi-type notification dispatch system (`RESPECT`, `COMMENT`, `FOLLOW`, `MESSAGE`, etc.).
- **`Expert` & `Booking`**: Expert profiles and scheduled booking slots.
- **`LearnResource`**: Knowledge base articles and founder playbooks.
- **`AdCampaign` & `AdEvent`**: Platform ad network and impression/click analytics.
- **`Billboard`**: Platform-wide right-rail billboard singleton.
- **`ModerationItem`**: Content moderation queue items and review verdicts.
- **`AuditLog`**: Security audit log for admin operations.
- **`GameScore`**: Signal Rush leaderboard scores.

---

## ⚡ Getting Started & Installation

### Prerequisites

- **Node.js**: v18.x or v20.x+
- **pnpm**: v10.x (or npm / yarn)
- **PostgreSQL**: Neon DB connection string or local PostgreSQL instance

### 1. Clone & Install Dependencies

```bash
git clone https://github.com/yousuffaysal/Treax.git
cd Treax
pnpm install
```

### 2. Configure Environment Variables

Create a `.env` file in the project root based on `.env.example`:

```bash
cp .env.example .env
```

### 3. Database Setup & Seeding

```bash
# Push schema to database
pnpm db:push

# Seed demo builder cast and initial billboard
pnpm db:seed
```

### 4. Launch Development Server

```bash
pnpm dev
```

Visit `http://localhost:3000` in your browser. 

- Default Admin Account: `tahmid@student.buet.ac.bd` / `treax1234`
- Admin Control Room: Reachable at `http://localhost:3000/admin`

---

## 🔑 Environment Variables

| Variable | Required | Description |
| :--- | :--- | :--- |
| `DATABASE_URL` | **Yes** | Neon pooled PostgreSQL connection string (PgBouncer) |
| `DIRECT_URL` | **Yes** | Neon direct PostgreSQL connection string (for Prisma migrations) |
| `AUTH_SECRET` | **Yes** | NextAuth session encryption key (generate with `openssl rand -base64 32`) |
| `GROQ_API_KEY` | Optional | Groq API Key for LLM anti-hype filter & AI assistant |
| `GROQ_MODEL` | Optional | Model identifier (`llama-3.3-70b-versatile`) |
| `CLOUDINARY_CLOUD_NAME` | Optional | Cloudinary cloud name for media uploads |
| `CLOUDINARY_API_KEY` | Optional | Cloudinary API Key |
| `CLOUDINARY_API_SECRET` | Optional | Cloudinary API Secret |
| `NEXT_PUBLIC_PUSHER_KEY` | Optional | Pusher Client Key for real-time messaging |
| `PUSHER_APP_ID` | Optional | Pusher Application ID |
| `PUSHER_SECRET` | Optional | Pusher Application Secret |
| `NEXT_PUBLIC_PUSHER_CLUSTER`| Optional | Pusher Cluster location |

---

## 👤 Author

Developed by **Yousuf H Faysaal**

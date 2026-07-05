# ProcessMine — Process Mining SaaS

Monorepo boilerplate untuk SaaS Process Mining berbasis **Next.js + Express + MongoDB**.

## Struktur Project

```
process-mining-saas/
├── frontend/               # Next.js 14 (App Router)
│   ├── src/
│   │   ├── app/            # Pages & layouts (App Router)
│   │   │   ├── auth/       # Login & Register
│   │   │   └── dashboard/  # Main dashboard
│   │   ├── components/     # Reusable UI components
│   │   ├── hooks/          # Custom React hooks (useAuth, useProjects)
│   │   ├── lib/            # Axios instance & helpers
│   │   └── types/          # TypeScript types
│   ├── vercel.json         # Deploy config untuk Vercel
│   └── .env.local.example
│
├── backend/                # Express + Node.js API
│   ├── src/
│   │   ├── config/         # DB connection
│   │   ├── controllers/    # Business logic
│   │   ├── middleware/      # Auth, error handling
│   │   ├── models/         # Mongoose schemas
│   │   ├── routes/         # API routes
│   │   └── services/       # Queue, file processing
│   ├── railway.toml        # Deploy config untuk Railway
│   └── .env.example
│
└── package.json            # Root (monorepo scripts)
```

## Quick Start

### 1. Clone & Install

```bash
git clone <repo-url>
cd process-mining-saas
npm run install:all
```

### 2. Setup Environment

**Backend:**
```bash
cp backend/.env.example backend/.env
# Edit backend/.env dengan credentials MongoDB, JWT secret, dll
```

**Frontend:**
```bash
cp frontend/.env.local.example frontend/.env.local
# Edit NEXT_PUBLIC_API_URL jika perlu
```

### 3. Jalankan Development

```bash
# Jalankan frontend + backend sekaligus
npm run dev

# Atau terpisah:
npm run dev:frontend   # http://localhost:3000
npm run dev:backend    # http://localhost:5000
```

## API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register user baru |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Get current user |

### Projects
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/projects` | List semua projects |
| POST | `/api/projects` | Buat project baru |
| GET | `/api/projects/:id` | Detail project |
| PUT | `/api/projects/:id` | Update project |
| DELETE | `/api/projects/:id` | Archive project |

### Event Logs
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/event-logs/upload` | Upload file XES/CSV/XLSX |
| GET | `/api/event-logs/:id` | Detail event log |

### Mining
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/mining/run` | Jalankan algoritma mining |
| GET | `/api/mining/results/:eventLogId` | Ambil hasil mining |

## Deployment

### Frontend → Vercel

1. Push ke GitHub
2. Import repo di [vercel.com](https://vercel.com)
3. Set **Root Directory** ke `frontend`
4. Set environment variable: `NEXT_PUBLIC_API_URL=https://api.yourapp.com/api`
5. Deploy!

### Backend → Railway

1. Buat project baru di [railway.app](https://railway.app)
2. Connect GitHub repo
3. Set **Root Directory** ke `backend`
4. Tambah environment variables dari `.env.example`
5. Tambah **MongoDB** plugin atau gunakan MongoDB Atlas
6. Deploy!

### Domain Setup

```
yourapp.com          → Vercel (frontend)
api.yourapp.com      → Railway (backend)
```

Setelah setup domain, update:
- `NEXT_PUBLIC_API_URL=https://api.yourapp.com/api` di Vercel
- `FRONTEND_URL=https://yourapp.com` di Railway

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16, TypeScript, Tailwind CSS |
| Backend | Express.js, Node.js (ESM) |
| Database | MongoDB + Mongoose |
| Auth | JWT + js-cookie |
| Queue | Bull + Redis |
| Deploy (FE) | Vercel |
| Deploy (BE) | Railway |

## Roadmap

- [ ] File upload ke S3/Cloudinary
- [ ] Bull queue untuk processing XES/CSV
- [ ] Integrasi Python microservice (pm4py) untuk mining engine
- [ ] Alpha Miner & Inductive Miner implementation
- [ ] Petri Net visualization (React Flow / D3.js)
- [ ] Multi-tenancy & organization support
- [ ] Stripe billing integration
- [ ] Conformance checking

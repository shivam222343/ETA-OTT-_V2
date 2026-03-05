# 🚀 Eta OTT — AI-Powered Educational Ecosystem

[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)
[![React 19](https://img.shields.io/badge/Frontend-React%2019%20%7C%20Vite%207-61DAFB?logo=react)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Backend-Node.js%20%7C%20Express%204-339933?logo=node.js)](https://nodejs.org/)
[![Python](https://img.shields.io/badge/ML--Service-Python%20%7C%20FastAPI-3776AB?logo=python)](https://fastapi.tiangolo.com/)
[![Expo](https://img.shields.io/badge/Mobile-Expo%2051%20%7C%20React%20Native-000020?logo=expo)](https://expo.dev/)

**Eta OTT** is an AI-driven educational platform that transforms static learning material into interactive, intelligent experiences. It integrates advanced machine learning (Whisper, LLMs, Vector Search) with an OTT-style streaming interface, giving students personalized knowledge graphs, an AI tutor, real-time doubt resolution, and multi-format content extraction.

---

## 🌟 Key Features

| Area | Feature |
| :--- | :--- |
| 🧠 **AI Tutor** | Context-aware AI assistant powered by **Groq Llama-3** that answers student queries grounded in the uploaded course material. |
| 🕸️ **Knowledge Graph** | Auto-generated concept maps rendered via **React-Force-Graph-2D** & **D3-force**, backed by **Neo4j**. |
| 🎥 **Multi-Source Extraction** | Extract knowledge from **PDFs** (PyMuPDF), **Videos** (OpenAI Whisper), **YouTube** (yt-dlp), and **Web pages** (Playwright + BeautifulSoup). |
| ⚡ **Real-Time Doubts** | Live synchronization and doubt solving powered by **Socket.io** with role-based resolution (Student ↔ Faculty). |
| 🔊 **Text-to-Speech** | High-quality speech synthesis for content via **AWS Polly**. |
| 📱 **Cross-Platform** | Fully responsive web app + native mobile app scaffold (**Expo / React Native**). |
| 🏫 **Hierarchical Management** | Multi-level hierarchy: **Institution → Branch → Course → Content**, with QR-code join flows. |
| 🔍 **Semantic Search** | Vector-based retrieval using **Qdrant** for extremely accurate information lookup. |
| 🌙 **Dark / Light Theme** | Theme toggle with CSS custom properties for a premium glassmorphic UI. |

---

## 🏗️ System Architecture

### High-Level Architecture

```mermaid
graph TD
    User((Student / Faculty / Admin))

    subgraph "Frontend Clients"
        Web["eta-web<br/>(React 19 + Vite 7)"]
        Mobile["eta-mobile<br/>(Expo 51 / React Native 0.74)"]
    end

    subgraph "Core Backend — Node.js / Express"
        API["Express API Gateway<br/>(8 Route Modules)"]
        WS["Socket.io<br/>Real-Time Doubts"]
        MW["Middleware Stack<br/>(Auth · RBAC · Cache · Upload · Error)"]
    end

    subgraph "ML Service — Python / FastAPI"
        FastAPI["FastAPI Engine :8000"]
        PDF["PDF Extractor<br/>(PyMuPDF)"]
        Video["Video Extractor<br/>(OpenAI Whisper)"]
        YT["YouTube Extractor<br/>(yt-dlp)"]
        WebEx["Web Extractor<br/>(Playwright + BS4)"]
    end

    subgraph "Persistence Layer"
        Mongo[("MongoDB<br/>Metadata & Models")]
        Neo[("Neo4j<br/>Knowledge Graph")]
        Qdrant[("Qdrant<br/>Vector Store")]
        Redis[("Redis<br/>Caching & Sessions")]
        Cloud[("Cloudinary<br/>Media CDN")]
    end

    User <--> Web & Mobile
    Web & Mobile <--> API
    API <--> WS
    API <--> MW
    API <--> FastAPI
    FastAPI --> PDF & Video & YT & WebEx
    API <--> Mongo & Neo & Redis & Cloud
    FastAPI <--> Qdrant
```

### Knowledge Extraction Workflow

```mermaid
sequenceDiagram
    participant U as User (Faculty)
    participant B as Backend (Express)
    participant C as Cloudinary CDN
    participant ML as ML Service (FastAPI)
    participant V as Qdrant Vector DB
    participant G as Neo4j Graph DB

    U->>B: Upload Content (PDF / Video / YouTube / Web URL)
    B->>C: Store media asset
    C-->>B: Return secure URL
    B->>ML: POST /extract {file_url, content_type}
    ML->>ML: Text / Transcript Extraction
    ML->>V: Store vector embeddings
    ML-->>B: Return extracted text, topics, keywords
    B->>G: Create/update concept nodes & relationships
    B-->>U: Content ready — processingStatus: completed
```

### AI Doubt Resolution Flow

```mermaid
sequenceDiagram
    participant S as Student
    participant B as Backend
    participant Q as Qdrant
    participant G as Neo4j
    participant LLM as Groq Llama-3

    S->>B: Ask doubt (via Socket.io or REST)
    B->>Q: Retrieve relevant context vectors
    B->>G: Fetch related concept nodes
    B->>LLM: Prompt with context + question
    LLM-->>B: Generated answer
    B-->>S: AI response (real-time via Socket.io)
    Note over B: Faculty can also reply manually
```

---

## 🛠️ Tech Stack

> 📄 For a detailed per-library breakdown with version numbers and project-specific usage, see [`Documents/TechStack.md`](./Documents/TechStack.md).

### Frontend — `eta-web`

| Category | Technology | Version |
| :--- | :--- | :--- |
| Framework | React | 19.2 |
| Bundler | Vite | 7.3 |
| Styling | Tailwind CSS + PostCSS + Autoprefixer | 3.4 |
| Animations | Framer Motion | 10.x |
| Animations (Advanced) | GSAP | 3.12 |
| State Management | Zustand | 4.4 |
| Routing | React Router DOM | 6.21 |
| HTTP Client | Axios | 1.6 |
| Auth | Firebase (Google OAuth) | 10.7 |
| Real-Time | socket.io-client | 4.6 |
| Graph Visualization | react-force-graph-2d + d3-force | — |
| Charts & Analytics | Recharts | 3.7 |
| PDF Viewer | react-pdf | 7.6 |
| Video Player | react-player | 2.13 |
| Markdown Rendering | react-markdown + remark-gfm | — |
| QR Code (Generate + Scan) | qrcode.react + html5-qrcode | — |
| Toasts | react-hot-toast | 2.4 |
| Icons | lucide-react | 0.303 |
| Scroll Detection | react-intersection-observer | 10.0 |
| Linting | ESLint + react-hooks + react-refresh plugins | 9.39 |

### Backend — `backend`

| Category | Technology | Version |
| :--- | :--- | :--- |
| Runtime | Node.js (ESM) | 22 |
| Framework | Express | 4.18 |
| Real-Time | Socket.io | 4.6 |
| Database (Document) | Mongoose (MongoDB) | 8.0 |
| Database (Graph) | neo4j-driver (Neo4j) | 5.14 |
| Database (Vector) | Qdrant (via Axios REST) | — |
| Cache | Redis (node-redis) | 4.6 |
| Auth (Server) | Firebase Admin SDK | 12.0 |
| Auth (Local) | bcryptjs + jsonwebtoken (JWT) | — |
| Security | Helmet, CORS, express-rate-limit | — |
| Media Storage | Cloudinary + multer-storage-cloudinary | 1.41 |
| File Upload | Multer | 1.4 |
| TTS (Primary) | AWS SDK — Polly (`@aws-sdk/client-polly`) | 3.988 |
| TTS (Human-like) | ElevenLabs API (`eleven_multilingual_v2`) | — |
| LLM Integration | Groq API (Llama 3.3 70B) via Axios | — |
| Video Processing | fluent-ffmpeg + @ffmpeg-installer/ffmpeg | 2.1 |
| PDF Parsing | pdf-parse | 1.1 |
| PDF Generation | Puppeteer (headless Chrome) | 24.37 |
| Web Scraping | Cheerio | 1.2 |
| Markdown → HTML | markdown-it | 14.1 |
| YouTube Search (Fallback) | yt-search | 2.13 |
| QR Generation | qrcode | 1.5 |
| Unique IDs | nanoid | 5.0 |
| Logging | Morgan | 1.10 |
| Dev: Auto-reload | Nodemon | 3.0 |
| Dev: Testing | Jest | 29.7 |

### ML Service — `ml-service`

| Category | Technology |
| :--- | :--- |
| Framework | FastAPI + Uvicorn |
| Validation | Pydantic |
| Deep Learning | PyTorch (CPU-only: torch, torchvision, torchaudio) |
| Sentence Embeddings | Sentence Transformers (`all-MiniLM-L6-v2`) |
| NLP Infrastructure | Hugging Face Transformers |
| Speech-to-Text | OpenAI Whisper |
| PDF Extraction | PyMuPDF (fitz) |
| Video Processing | MoviePy |
| YouTube Download | yt-dlp |
| Web Scraping (JS-heavy) | Playwright (headless Chromium) |
| Web Scraping (static) | BeautifulSoup4 + html2text |
| Document Generation | fpdf2 (PDF), python-docx (Word) |
| Image Processing | Pillow |
| Cloud Storage | Cloudinary (Python SDK) |
| YouTube API | google-api-python-client (YouTube Data API v3) |
| Environment | python-dotenv, python-multipart, requests |

### Deployment & Containerization

| Category | Technology |
| :--- | :--- |
| Containerization | Docker (multi-stage builds) |
| Orchestration | Docker Compose (2 files: app + ML) |
| CI/CD | GitHub Actions → Docker Hub → AWS EC2 |
| Web Server / Reverse Proxy | Nginx (gzip, security headers, WebSocket proxy) |
| Container Registry | Docker Hub |
| SSH Deployment | appleboy/ssh-action |
| Cloud Hosting | AWS EC2 (×2 instances: App Server + ML Server) |
| Frontend Hosting (Alt) | Netlify |

### External AI APIs

| API | Use in Project |
| :--- | :--- |
| Groq API (`llama-3.3-70b-versatile`) | Primary LLM — AI doubt resolution with RAG context |
| ElevenLabs (`eleven_multilingual_v2`) | Human-like TTS (Hindi/English), falls back to Polly |
| AWS Polly (Neural) | TTS with Indian accent (Aditi voice) |
| YouTube Data API v3 | Semantic video search & recommendations |
| Firebase Auth | Google OAuth for user authentication |

### Mobile — `eta-mobile`

| Category | Technology | Version |
| :--- | :--- | :--- |
| Framework | Expo | 51.0 |
| Core | React Native | 0.74.5 |
| React | React | 18.2 |
| Status | **Scaffold / Beta** | — |

---

## 🗺️ Entity Relationship Diagram

```mermaid
erDiagram
    INSTITUTION ||--o{ BRANCH : "has many"
    BRANCH ||--o{ COURSE : "offers"
    COURSE ||--o{ CONTENT : "contains"
    INSTITUTION ||--o{ USER : "belongs to"
    BRANCH ||--o{ USER : "enrolled in"
    USER ||--o{ DOUBT : "raises"
    CONTENT ||--o{ DOUBT : "has"
    COURSE ||--o{ USER : "taught by (faculty)"
    CONTENT }o--|| USER : "uploaded by"

    USER {
        string firebaseUid PK
        string email UK
        string role "admin | faculty | student"
        object profile "name, avatar, bio, phone"
        array institutionIds FK
        array branchIds FK
        object progressStats "enrolled, completed, viewed, doubts"
        int confidenceScore "0-100, default 50"
        boolean isActive
    }

    INSTITUTION {
        string name
        string code UK
        string type "university | college | school | coaching | other"
        object address "city, state, country"
        array adminIds FK
        array facultyIds FK
        string joinCode
    }

    BRANCH {
        string name
        string code
        ObjectId institutionId FK
        array facultyIds FK
        array studentIds FK
        string joinCode
    }

    COURSE {
        string name
        string code
        array branchIds FK
        ObjectId institutionId FK
        array facultyIds FK
        array contentIds FK
        object accessRules "time-based, prerequisite-based"
        object stats "totalContent, totalStudents, totalDoubts"
    }

    CONTENT {
        string title
        string type "pdf | video | presentation | code | document | image | audio | web | other"
        object file "url, publicId, format, size, duration, pages, thumbnail"
        object metadata "author, language, tags, difficulty, category"
        object extractedData "text, summary, topics, keywords, concepts, entities, questions"
        string graphNodeId "Neo4j reference"
        string processingStatus "pending | processing | completed | failed"
        object stats "viewCount, downloadCount, averageRating, completionRate"
    }

    DOUBT {
        string question
        string answer
        string status "open | answered | resolved"
        ObjectId contentId FK
        ObjectId userId FK
    }

    NOTIFICATION {
        string type
        string message
        ObjectId userId FK
        boolean read
    }
```

---

## 👥 User Roles & Permissions

| Role | Capabilities |
| :--- | :--- |
| **Admin** | Manage institutions, invite/remove faculty, view site-wide analytics. |
| **Faculty** | Create & manage institutions, branches, courses. Upload content (PDF/Video/YouTube/Web). Reply to student doubts. View knowledge graphs. Generate QR codes for branch join. |
| **Student** | Browse enrolled branches & courses. Watch videos, view PDFs, explore knowledge graphs. Ask doubts to AI tutor & faculty. Scan QR codes to join branches. Track progress & confidence score. |

---

## 📂 Project Structure

```text
ETA-OTT-_V2/
├── backend/                          # Node.js Express API Server
│   ├── config/                       # Database & service configurations
│   │   ├── cloudinary.config.js      #   Cloudinary media CDN
│   │   ├── firebase.config.js        #   Firebase Admin SDK auth
│   │   ├── mongo.config.js           #   MongoDB connection
│   │   ├── neo4j.config.js           #   Neo4j graph DB driver
│   │   ├── qdrant.config.js          #   Qdrant vector DB client
│   │   └── redis.config.js           #   Redis caching layer
│   ├── middleware/                    # Express middlewares
│   │   ├── auth.middleware.js         #   Firebase token verification
│   │   ├── cache.middleware.js        #   Redis response caching
│   │   ├── error.middleware.js        #   Global error handler
│   │   ├── role.middleware.js         #   RBAC enforcement
│   │   └── upload.middleware.js       #   Multer file uploads
│   ├── models/                       # Mongoose schemas (7 models)
│   │   ├── User.model.js
│   │   ├── Institution.model.js
│   │   ├── Branch.model.js
│   │   ├── Course.model.js
│   │   ├── Content.model.js
│   │   ├── Doubt.model.js
│   │   └── Notification.model.js
│   ├── routes/                       # API route handlers (8 modules)
│   │   ├── auth.routes.js            #   /api/auth
│   │   ├── institution.routes.js     #   /api/institutions
│   │   ├── branch.routes.js          #   /api/branches
│   │   ├── course.routes.js          #   /api/courses
│   │   ├── content.routes.js         #   /api/content
│   │   ├── doubt.routes.js           #   /api/doubts
│   │   ├── analytics.routes.js       #   /api/analytics
│   │   └── ai.routes.js              #   /api/ai
│   ├── services/                     # Business logic & integrations
│   │   ├── ai.service.js             #   Groq LLM + Qdrant RAG pipeline
│   │   ├── tts.service.js            #   AWS Polly text-to-speech
│   │   ├── upload.service.js         #   Cloudinary upload helpers
│   │   ├── websocket.service.js      #   Socket.io event handlers
│   │   ├── extraction/               #   Content extraction pipeline
│   │   │   ├── code.extractor.js
│   │   │   ├── ml.service.js         #     Calls ML Service API
│   │   │   ├── pdf.extractor.js
│   │   │   └── video.extractor.js
│   │   └── graph/
│   │       └── content.graph.js      #   Neo4j knowledge graph logic
│   ├── server.js                     # App entry point
│   └── package.json
│
├── eta-web/                          # React 19 + Vite Web Application
│   ├── public/
│   ├── src/
│   │   ├── api/
│   │   │   └── axios.config.js       #   Axios instance with interceptors
│   │   ├── components/
│   │   │   ├── AITutor.jsx           #   AI chat interface
│   │   │   ├── Loader.jsx / .css     #   Animated loading spinner
│   │   │   ├── ThemeToggle.jsx       #   Dark/light mode toggle
│   │   │   ├── faculty/              #   Faculty-specific components (16)
│   │   │   │   ├── ContentViewer.jsx
│   │   │   │   ├── CourseKnowledgeGraph.jsx
│   │   │   │   ├── UploadContentModal.jsx
│   │   │   │   ├── FacultyDoubtManager.jsx
│   │   │   │   ├── CreateInstitutionModal.jsx
│   │   │   │   ├── CreateBranchModal.jsx
│   │   │   │   ├── CreateCourseModal.jsx
│   │   │   │   ├── EditBranchModal.jsx
│   │   │   │   ├── EditCourseModal.jsx
│   │   │   │   ├── ExtractedInfoModal.jsx
│   │   │   │   ├── InstitutionCard.jsx
│   │   │   │   ├── BranchCard.jsx
│   │   │   │   ├── CourseCard.jsx
│   │   │   │   ├── ContentCard.jsx
│   │   │   │   ├── QRCodeModal.jsx
│   │   │   │   └── JoinInstitutionModal.jsx
│   │   │   └── student/              #   Student-specific components (3)
│   │   │       ├── JoinBranchModal.jsx
│   │   │       ├── QRScanner.jsx
│   │   │       └── StudentDoubtManager.jsx
│   │   ├── contexts/
│   │   │   ├── AuthContext.jsx       #   Firebase auth context
│   │   │   └── ThemeContext.jsx      #   Theme provider
│   │   ├── hooks/
│   │   │   └── useSocket.js          #   Socket.io hook
│   │   ├── store/
│   │   │   └── institutionStore.js   #   Zustand store
│   │   ├── pages/
│   │   │   ├── LandingPage.jsx
│   │   │   ├── LoginPage.jsx
│   │   │   ├── SignupPage.jsx
│   │   │   ├── admin/
│   │   │   │   └── Dashboard.jsx
│   │   │   ├── faculty/
│   │   │   │   ├── Dashboard.jsx
│   │   │   │   ├── ManageInstitution.jsx
│   │   │   │   └── ManageCourseContent.jsx
│   │   │   └── student/
│   │   │       ├── Dashboard.jsx
│   │   │       ├── BranchResources.jsx
│   │   │       └── CourseResources.jsx
│   │   ├── App.jsx                   #   Router & protected routes
│   │   ├── main.jsx
│   │   └── index.css
│   ├── tailwind.config.js
│   ├── vite.config.js
│   └── package.json
│
├── ml-service/                       # Python FastAPI Extraction Service
│   ├── extractors/
│   │   ├── pdf_extractor.py          #   PyMuPDF-based PDF text extraction
│   │   ├── video_extractor.py        #   OpenAI Whisper transcription
│   │   ├── youtube_extractor.py      #   yt-dlp download + transcription
│   │   └── web_extractor.py          #   Playwright + BS4 web scraping
│   ├── main.py                       #   FastAPI app entry (port 8000)
│   └── requirements.txt
│
├── eta-mobile/                       # Expo / React Native Mobile App (Beta)
│   ├── App.js                        #   Basic scaffold
│   ├── app.json
│   └── package.json
│
├── docs/                             # Implementation & progress docs (16 files)
│   ├── IMPLEMENTATION_STATUS.md
│   ├── BACKEND_FIXES.md
│   ├── CONTENT_UPLOAD_PLAN.md
│   ├── FACULTY_DASHBOARD.md
│   ├── GOOGLE_SIGNIN.md
│   ├── HIERARCHICAL_MANAGEMENT.md
│   ├── ... and more
│
└── README.md                         # ← You are here
```

---

## 🚀 Getting Started

### Prerequisites

| Requirement | Version |
| :--- | :--- |
| **Node.js** | v18+ |
| **Python** | v3.9+ (with `pip` and `venv`) |
| **MongoDB** | Atlas or Local |
| **Neo4j** | Aura or Local |
| **Redis** | v6+ |
| **Qdrant** | Cloud or Local (required for AI features) |
| **FFmpeg** | Required for video processing |

### 1. Clone the Repository

```bash
git clone https://github.com/<your-org>/ETA-OTT-_V2.git
cd ETA-OTT-_V2
```

### 2. ML Service Setup (Python)

```bash
cd ml-service

# Create & activate virtual environment
python -m venv venv
source venv/bin/activate        # Linux / macOS
# venv\Scripts\activate         # Windows

# Install dependencies (includes PyTorch, Whisper, Playwright)
pip install -r requirements.txt

# Install Playwright browsers (required for web extraction)
playwright install

# Start the extraction service on port 8000
python main.py
```

### 3. Backend Setup (Node.js)

```bash
cd backend

# Install dependencies
npm install

# Create your .env file (see Environment Configuration below)
cp .env.example .env   # then fill in values

# Start in development mode (uses nodemon)
npm run dev
```
> Backend runs on **http://localhost:5000** by default.

### 4. Frontend Setup (React + Vite)

```bash
cd eta-web

# Install dependencies
npm install

# Start dev server
npm run dev
```
> Frontend runs on **http://localhost:5173** by default.

### 5. Mobile App Setup (Expo — Beta)

```bash
cd eta-mobile

# Install dependencies
npm install

# Start Expo dev server
npm start
# or for specific platform:
# npm run android
# npm run ios
```

---

## 🛠️ Environment Configuration

### Backend `.env`

```env
# ── Server ──
PORT=5000
NODE_ENV=development
ALLOWED_ORIGINS=http://localhost:5173

# ── MongoDB ──
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/eta-ott

# ── Redis ──
REDIS_URL=redis://localhost:6379

# ── Neo4j ──
NEO4J_URI=neo4j+s://<id>.databases.neo4j.io
NEO4J_USER=neo4j
NEO4J_PASSWORD=<password>

# ── Qdrant ──
QDRANT_URL=https://<id>.qdrant.io
QDRANT_API_KEY=<api-key>

# ── Cloudinary ──
CLOUDINARY_CLOUD_NAME=<cloud-name>
CLOUDINARY_API_KEY=<api-key>
CLOUDINARY_API_SECRET=<api-secret>

# ── Firebase Admin SDK ──
FIREBASE_PROJECT_ID=<project-id>
FIREBASE_CLIENT_EMAIL=<service-account-email>
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# ── Groq AI (LLM) ──
GROQ_API_KEY=<groq-api-key>

# ── AWS Polly (TTS) ──
AWS_ACCESS_KEY_ID=<aws-key>
AWS_SECRET_ACCESS_KEY=<aws-secret>
AWS_REGION=us-east-1

# ── ML Service ──
ML_SERVICE_URL=http://localhost:8000

# ── Rate Limiting (production) ──
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Frontend `.env`

```env
VITE_API_URL=http://localhost:5000
VITE_FIREBASE_API_KEY=<firebase-api-key>
VITE_FIREBASE_AUTH_DOMAIN=<project>.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=<project-id>
```

---

## 🌐 API Endpoints

| Prefix | Module | Description |
| :--- | :--- | :--- |
| `GET /health` | Server | Health check & uptime |
| `/api/auth` | `auth.routes.js` | Firebase auth — register, login, profile |
| `/api/institutions` | `institution.routes.js` | CRUD institutions, join codes, QR |
| `/api/branches` | `branch.routes.js` | CRUD branches, student enrollment |
| `/api/courses` | `course.routes.js` | CRUD courses, faculty assignment |
| `/api/content` | `content.routes.js` | Upload, extract, view, rate content |
| `/api/doubts` | `doubt.routes.js` | Create, answer, resolve doubts |
| `/api/analytics` | `analytics.routes.js` | Dashboard stats & metrics |
| `/api/ai` | `ai.routes.js` | AI tutor queries, TTS generation |

---

## 💡 How It Works — The AI Pipeline

```mermaid
flowchart LR
    A[/"📄 Upload PDF · 🎥 Video · 🔗 YouTube · 🌐 Web URL"/] --> B["☁️ Cloudinary<br/>Media Storage"]
    B --> C["⚙️ Backend calls<br/>ML Service /extract"]
    C --> D{"Content Type?"}
    D -->|PDF| E["PyMuPDF<br/>OCR + Text"]
    D -->|Video| F["OpenAI Whisper<br/>Transcription"]
    D -->|YouTube| G["yt-dlp Download<br/>→ Whisper"]
    D -->|Web| H["Playwright<br/>→ BS4 Parse"]
    E & F & G & H --> I["📊 Chunk Text<br/>→ Vector Embeddings"]
    I --> J[("🔮 Qdrant<br/>Vector Store")]
    I --> K["🏷️ Extract Entities<br/>Topics & Keywords"]
    K --> L[("🕸️ Neo4j<br/>Knowledge Graph")]
    J & L --> M["🤖 Query Phase:<br/>Student asks doubt"]
    M --> N["Retrieve context from<br/>Qdrant + Neo4j"]
    N --> O["🧠 Groq Llama-3<br/>Generate Answer"]
    O --> P["💬 Response sent<br/>via Socket.io"]
```

1. **Ingestion** — Faculty uploads a PDF, Video, YouTube link, or Web URL → stored on Cloudinary.
2. **Extraction** — Backend calls `ml-service` → dispatches to the correct extractor.
3. **NLP Processing** — PyMuPDF (PDFs), OpenAI Whisper (Videos/Audio), yt-dlp + Whisper (YouTube), Playwright + BS4 (Web).
4. **Vectorization** — Extracted text is chunked and stored in **Qdrant** with high-dimensional embeddings.
5. **Graph Construction** — Named entities and concepts are pushed to **Neo4j** as nodes and relationships.
6. **Query Phase** — When a student asks a doubt, the backend retrieves relevant context from Qdrant & Neo4j, then feeds it to **Groq Llama-3** to generate a precise, source-grounded answer.

---

## 🎨 Design & UX

- **Glassmorphic UI** — Transparent, layered components with backdrop-blur effects for a modern, premium feel.
- **Micro-Interactions** — Hover effects and fluid transitions powered by **Framer Motion** & **GSAP**.
- **Dark/Light Mode** — Full theme system with CSS custom properties, toggled via `ThemeContext`.
- **Responsive Layouts** — Seamless adaptation from desktop to mobile viewports via Tailwind breakpoints.
- **Role-Specific Dashboards** — Dedicated UIs for Students, Faculty, and Admins.

---

## 🗂️ Available Scripts

### Backend

```bash
npm run dev      # Start with nodemon (hot-reload)
npm start        # Production start
npm test         # Run Jest tests
```

### Frontend

```bash
npm run dev      # Vite dev server (HMR)
npm run build    # Production build
npm run preview  # Preview production build
npm run lint     # ESLint check
```

### ML Service

```bash
python main.py   # Start FastAPI on port 8000
```

### Mobile

```bash
npm start            # Expo dev server
npm run android      # Launch Android
npm run ios          # Launch iOS
npm run web          # Launch web preview
```

---

## 🛣️ Roadmap

- [ ] **Live Collaboration** — Shared whiteboards for faculty and students.
- [ ] **Gamification** — Badges and progression levels based on confidence scores.
- [ ] **Offline Mode** — Download content for offline viewing on the mobile app.
- [ ] **Multi-Language Support** — AI translation for transcripts and documents.
- [ ] **Full Mobile App** — Complete feature parity with the web application.
- [ ] **Advanced Analytics** — Per-student learning path tracking & recommendations.

---

## 📄 License

This project is licensed under the **ISC License**.

---

*Built for the future of education. 🚀*

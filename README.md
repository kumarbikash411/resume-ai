# ResumeAI — Full Stack Deployment Guide
> Spring Boot + JWT + PostgreSQL + Resume Upload + OpenAI + React

---

## 📁 Project Structure

```
project/
├── backend/                          # Spring Boot (Java 17)
│   ├── src/main/java/com/resumeai/
│   │   ├── ResumeAiApplication.java
│   │   ├── config/
│   │   │   ├── SecurityConfig.java   # JWT + CORS + Security
│   │   │   └── GlobalExceptionHandler.java
│   │   ├── controller/
│   │   │   ├── AuthController.java   # POST /api/auth/register, /login
│   │   │   └── ResumeController.java # CRUD + /analyze + /chat
│   │   ├── dto/
│   │   │   ├── AuthDto.java
│   │   │   └── ResumeDto.java
│   │   ├── entity/
│   │   │   ├── User.java
│   │   │   └── Resume.java
│   │   ├── repository/
│   │   │   ├── UserRepository.java
│   │   │   └── ResumeRepository.java
│   │   ├── security/
│   │   │   ├── JwtUtil.java
│   │   │   └── JwtAuthenticationFilter.java
│   │   └── service/
│   │       ├── AuthService.java
│   │       ├── CustomUserDetailsService.java
│   │       ├── OpenAiService.java
│   │       └── ResumeService.java
│   ├── src/main/resources/
│   │   └── application.properties
│   ├── Dockerfile
│   └── pom.xml
│
├── frontend/                         # React 18 + Vite + Tailwind
│   ├── src/
│   │   ├── components/
│   │   │   ├── auth/Login.jsx
│   │   │   ├── auth/Register.jsx
│   │   │   ├── dashboard/Dashboard.jsx
│   │   │   └── resume/
│   │   │       ├── UploadResume.jsx
│   │   │       └── ResumeAnalysis.jsx
│   │   ├── context/AuthContext.jsx
│   │   ├── services/api.js
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
│
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## 🚀 Quick Start (Docker — Recommended)

### Prerequisites
- Docker 24+ and Docker Compose v2
- OpenAI API key from https://platform.openai.com

### 1. Clone and configure

```bash
# Copy environment file
cp .env.example .env

# Edit .env with your values
nano .env
# Set: DB_PASSWORD, JWT_SECRET, OPENAI_API_KEY
```

### 2. Build and run

```bash
docker compose up --build -d
```

### 3. Open the app

```
http://localhost        → React frontend
http://localhost:8080   → Spring Boot API
http://localhost:5432   → PostgreSQL
```

---

## 💻 Local Development (Without Docker)

### Backend Setup

**Requirements:** Java 17+, Maven 3.9+, PostgreSQL 14+

```bash
# 1. Create PostgreSQL database
psql -U postgres -c "CREATE DATABASE resumeai_db;"

# 2. Edit src/main/resources/application.properties
#    Set: datasource password, openai.api.key

# 3. Run the backend
cd backend
mvn spring-boot:run
```

Backend starts at: `http://localhost:8080`

### Frontend Setup

**Requirements:** Node.js 20+

```bash
cd frontend
npm install
npm run dev
```

Frontend starts at: `http://localhost:3000`

The Vite proxy forwards `/api/*` → `http://localhost:8080`

---

## 🌐 API Reference

### Authentication

| Method | Endpoint | Body | Auth |
|--------|----------|------|------|
| POST | `/api/auth/register` | `{fullName, email, password}` | None |
| POST | `/api/auth/login` | `{email, password}` | None |

**Response:**
```json
{
  "token": "eyJhbGci...",
  "type": "Bearer",
  "userId": 1,
  "email": "user@example.com",
  "fullName": "John Doe"
}
```

### Resumes (all require `Authorization: Bearer <token>`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/resumes/upload` | Upload PDF/DOCX (multipart) |
| GET | `/api/resumes` | List all user resumes |
| GET | `/api/resumes/{id}` | Get single resume |
| POST | `/api/resumes/{id}/analyze` | Trigger AI analysis |
| POST | `/api/resumes/{id}/chat` | `{question}` → AI answer |
| DELETE | `/api/resumes/{id}` | Delete resume |

---

## ☁️ Production Deployment (AWS EC2)

```bash
# 1. Launch Ubuntu 22.04 EC2 (t3.small or better)
# 2. SSH in and install Docker
sudo apt update && sudo apt install -y docker.io docker-compose-v2
sudo usermod -aG docker ubuntu

# 3. Clone your project
git clone <your-repo> && cd your-project

# 4. Configure environment
cp .env.example .env
nano .env   # Set real secrets

# 5. Deploy
docker compose up --build -d

# 6. View logs
docker compose logs -f backend
```

**Security checklist for production:**
- [ ] Change `JWT_SECRET` to a random 64-char string
- [ ] Use strong `DB_PASSWORD`
- [ ] Add your real `OPENAI_API_KEY`
- [ ] Open ports 80 (HTTP) and 443 (HTTPS) in security group
- [ ] Add SSL via Certbot / AWS Certificate Manager
- [ ] Set `CORS` to your actual domain in `application.properties`

---

## 🔑 Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DB_PASSWORD` | PostgreSQL password | `securepass123` |
| `JWT_SECRET` | JWT signing key (32+ chars) | `myLongSecret...` |
| `OPENAI_API_KEY` | OpenAI API key | `sk-proj-...` |

---

## 🧪 Test the API

```bash
# 1. Register
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"fullName":"Test User","email":"test@test.com","password":"password123"}'

# 2. Login (save the token)
TOKEN=$(curl -s -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"password123"}' | jq -r .token)

# 3. Upload resume
curl -X POST http://localhost:8080/api/resumes/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@/path/to/resume.pdf"

# 4. Analyze (replace 1 with actual resume ID)
curl -X POST http://localhost:8080/api/resumes/1/analyze \
  -H "Authorization: Bearer $TOKEN"
```

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Java 17, Spring Boot 3.2, Spring Security, JPA/Hibernate |
| Auth | JWT (JJWT 0.12) |
| Database | PostgreSQL 16 |
| File Parsing | Apache PDFBox 3.0, Apache POI 5.2 |
| AI | OpenAI GPT-4o-mini via REST (WebFlux) |
| Frontend | React 18, Vite, Tailwind CSS |
| Routing | React Router v6 |
| Charts | Recharts |
| Containerization | Docker, Docker Compose, Nginx |

---

## 🐛 Troubleshooting

**Backend won't start:**
- Check DB connection: `docker compose logs postgres`
- Verify `application.properties` credentials

**OpenAI errors:**
- Verify your API key is set in `.env`
- Check you have billing enabled on OpenAI account

**File upload fails:**
- Max size is 10MB (configurable in `application.properties`)
- Only PDF and DOCX are accepted

**CORS errors in browser:**
- Add your frontend URL to `app.cors.allowed-origins` in `application.properties`

# Centralized Patient Health Record Management System

## Tech Stack
| Layer        | Technology                          |
|--------------|-------------------------------------|
| Frontend     | Next.js + TypeScript                |
| Backend      | Django REST Framework               |
| Database     | SQLite (dev) → PostgreSQL (later)   |
| Auth         | JWT (djangorestframework-simplejwt) |
| Cache/Broker | Redis                               |
| Async Jobs   | Celery                              |
| File Storage | AWS S3 / MinIO                      |

---

## Team Responsibilities
| Person | Owns |
|--------|------|
| 1 | Project setup, auth (JWT, patient & hospital login/register), shared layout |
| 2 | Hospital & doctor onboarding, Django admin panel, dashboards |
| 3 | Consent flow, appointments, OTP verification, Celery + Redis |
| 4 | Medical records, prescriptions, audit logging, patient history |

---

## Getting Started — do this once after cloning

### 1. Clone the repo
```
git clone <repo-url>
cd health-record-system
```

### 2. Set up the backend

```
cd backend
python -m venv venv
```

Activate the virtual environment:
- **Windows:** `venv\Scripts\activate`
- **Mac/Linux:** `source venv/bin/activate`

```
pip install -r requirements.txt
```

### 3. Set up your .env file
```
copy .env.example .env        # Windows
cp .env.example .env          # Mac / Linux
```
The default values in `.env.example` work as-is for local development.
You don't need to change anything to get started.

### 4. Run migrations and start the server
```
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```
The API will be live at `http://localhost:8000`

> **Note:** The database is SQLite — a simple file (`db.sqlite3`) that gets
> created automatically when you run migrate. No database installation needed.

---

## Getting Started — Frontend
```
cd frontend
npm install
cp .env.local.example .env.local    # Mac/Linux
copy .env.local.example .env.local  # Windows
npm run dev
```
The frontend will be live at `http://localhost:3000`

---

## How to contribute (everyone follow this)

**Never push directly to `main`.** Always work on your own branch.

```
# 1. Make sure you're up to date before starting
git checkout main
git pull origin main

# 2. Create your feature branch
git checkout -b feature/your-feature-name

# 3. Make your changes, then commit
git add .
git commit -m "feat: describe what you did"

# 4. Push your branch to GitHub
git push origin feature/your-feature-name

# 5. Open a Pull Request on GitHub → base: main
```

### Branch naming guide
| Person | Example branch name |
|--------|---------------------|
| 1 | `feature/auth-jwt` |
| 2 | `feature/hospital-onboarding` |
| 3 | `feature/consent-flow` |
| 4 | `feature/medical-records` |

---

## API Endpoints so far
| Method | URL | Description |
|--------|-----|-------------|
| POST | `/api/auth/register/patient/` | Register a new patient |
| POST | `/api/auth/login/` | Login — returns JWT tokens |
| POST | `/api/auth/token/refresh/` | Get a new access token |
| GET  | `/api/auth/me/` | Get current logged-in user |
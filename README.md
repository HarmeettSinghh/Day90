# Day 90 — Consumer Health Adherence & Verdict Engine

> **A production-ready full-stack application built for Mosaic Wellness (Man Matters / Be Bodywise).**  
> Designed for quick evaluation on mobile devices (WhatsApp link opening context), focusing on clarity, zero friction, and high clinical credibility.

---

## 📍 Project Location

The entire project is located in:
```
/Users/navneetsingh/.gemini/antigravity-ide/scratch/day90
```

> **Recommendation**: Set `/Users/navneetsingh/.gemini/antigravity-ide/scratch/day90` as your active workspace in Antigravity IDE.

---

## 🎯 The Problem Solved

Consumer health treatments fail in users' minds long before they have a biological chance to work.
1. **Biological Realities vs. Consumer Impatience**: Hair growth and skin turnover require 90–120 days. Most users churn at week 3 or 4 when they notice shedding or no change.
2. **False Attribution**: When users quit, they assume the formulation didn't work, even if adherence was <40%.
3. **The 90-Day Verdict**: A clear, deterministic rule engine combined with Groq AI clinical context that gives consumers a transparent verdict:
   - `TOO_EARLY`: Still within initial biological latency (<4 weeks).
   - `NOT_FAIR_TEST`: Adherence is below the 70% clinical threshold.
   - `CONSIDER_DOCTOR`: 12+ weeks of disciplined use (≥70%) without progress — honest recommendation to consult a doctor.
   - `KEEP_GOING`: Adherence is strong with positive momentum.

---

## 🛠️ Tech Stack & Architecture

- **Frontend (`/client`)**:
  - React 19 + Vite
  - Framer Motion (micro-animations, ink-in day strip transitions, responsive SVG trend charts)
  - Pure CSS Design System (`design-system.css`) adhering to warm, grounded clinical wellness aesthetics (no generic blue/purple AI kitsch)
  - IndexedDB (`photoStorage.js`): 100% on-device private photo storage (zero cloud upload)
  - React Router v7 with guest & auth guards
  - Axios with JWT request/response interceptors

- **Backend (`/server`)**:
  - Node.js & Express
  - MongoDB & Mongoose (Schemas for Users, Routines, Check-ins, Weekly Logs, Timeline Roadmaps)
  - Deterministic Math & Service Layer (`verdictService.js`)
  - Groq API Integration (`groqService.js` using LLaMA 3.3 70B Versatile with automated medical fallbacks and in-memory TTL caching)
  - Rate limiting, bcrypt authentication, and 24-hour TTL Demo User Sandboxing

- **Testing**:
  - Jest test suite with 42 unit tests covering all edge cases, leap years, timezone offsets, windowing, and threshold calculations.

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- Node.js (v18+)
- MongoDB (local or Atlas URI)
- Groq API Key (optional, built-in intelligent fallbacks provided if not set)

### 2. Configure Environment
Create `.env` in `server/.env`:
```bash
cp .env.example server/.env
```
Fill in `MONGODB_URI`, `JWT_SECRET`, and optional `GROQ_API_KEY`.

### 3. Run Development Servers
```bash
# In one terminal (Server on port 3001)
npm run dev:server

# In another terminal (Client on port 5173)
npm run dev:client
```

### 4. Interactive 1-Tap Demo Flow
Open [http://localhost:5173](http://localhost:5173).  
Click **"Try Live Demo as Rahul (Day 47)"** on the landing page or login page to instantly explore:
- Pre-populated Day 47 routine with realistic consistency dots
- 90-day progress strip with past check-ins and milestones
- SVG rating trendline
- Real-time Groq AI question answering & weekly reflections
- Month-3 economic breakdown & physician evaluation report

### 5. Running Tests
```bash
npm run test:server
```
Runs all 42 automated tests covering verdict rules, time windows, and adherence calculations.

---

## 🛡️ Privacy & Compliance
- **Photos Never Leave the Phone**: Handled via browser IndexedDB directly.
- **Account Deletion**: Complete cascade delete route (`DELETE /api/account`) ensuring GDPR/Indian DPDP compliance.
# Day90

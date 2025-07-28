# LLM Chat with TTS 🗨️🔊  

Chat with an OpenAI-powered assistant that **speaks** using the open-source [Chatterbox](https://github.com/resemble-ai/chatterbox) text-to-speech model.  
The project ships with:

* **Next.js 14 + React 18 + Tailwind CSS** frontend (TypeScript, App Router, Server Actions)  
* **FastAPI** backend (Python 3.10+) with OpenAI Chat Completion & Chatterbox TTS  
* Live audio playback, voice controls, theme switcher, API-key management, and rich chat UI  
* Docker-first workflow & one-command local bootstrap

---

## ✨ Features
| Category | Highlights |
|----------|------------|
| Chat | GPT-4/3.5-Turbo streaming, role-based messages, markdown rendering |
| TTS  | Chatterbox zeroshot voices, exaggeration & CFG sliders, WAV caching |
| UX   | Dark/Light theme, animated message bubbles, typing indicator, voice wave |
| Dev Ex | Fully typed codebase, ESLint / Prettier / Tailwind-Merge, Husky hooks |
| Ops  | `.env` driven config, Docker Compose, production-grade logging & CORS |

---

## 🖼️ Screenshots / Demo  
| Desktop | Mobile |
|---------|--------|
| ![Desktop chat screenshot](docs/ss-desktop.png) | ![Mobile chat screenshot](docs/ss-mobile.png) |

A live demo is available at **https://llm-chat-tts.example.com** (public Hugging Face Space / Vercel preview).

---

## 🏗️ Architecture  

```
┌─────────────┐   HTTP        ┌──────────────────────┐
│  Next.js    │──────────────▶│  FastAPI  (Backend)  │
│  Frontend   │               │  /api/chat           │
│  (3000)     │◀──────────────│  /api/tts            │
└─────────────┘  audio stream └──────────┬───────────┘
                       │                ▼
                       │         Chatterbox TTS
                       │                │
                       └──── OpenAI Chat API
```

---

## ⚙️ Technology Stack
| Layer          | Tech |
|----------------|------|
| Frontend       | Next.js 14, React 18, TypeScript, Tailwind CSS, Radix UI, Framer Motion |
| Backend        | FastAPI, Pydantic v2, Uvicorn, Chatterbox-TTS, OpenAI Python SDK v1 |
| Audio / ML     | PyTorch 2.x, Torchaudio, Librosa, FFmpeg |
| Tooling        | Docker & Docker-Compose, GitHub Actions CI, ESLint, Prettier |
| Deployment     | Vercel (frontend), Fly.io / Render / Railway (backend) |

---

## 🚀 Quick Start

### 1. Clone & bootstrap

```bash
git clone https://github.com/your-org/llm-chat-tts.git
cd llm-chat-tts
cp backend/.env.example backend/.env   # fill in OPENAI_API_KEY
docker compose up --build
```

*Frontend:* http://localhost:3000  
*Backend API:* http://localhost:8000/docs (Swagger UI)

### 2. Local development (without Docker)

Frontend ```bash
cd frontend
npm install
npm run dev          # http://localhost:3000
```

Backend ```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

> On Apple Silicon or CPU-only machines, Chatterbox automatically falls back to CPU.  
> For GPU (CUDA 11.8+) ensure `nvidia-smi` is available and `torch` is built with CUDA.

---

## 🔧 Environment Variables

| Variable | Where | Description |
|----------|-------|-------------|
| `OPENAI_API_KEY` | backend | OpenAI secret key |
| `TTS_DEVICE` | backend | `cuda` / `cpu` / `mps` |
| `CORS_ORIGINS` | backend | Allowed origins (CSV) |
| `NEXT_PUBLIC_API_BASE` | frontend | e.g. `http://localhost:8000` (only needed if reverse proxy is disabled) |

---

## 📑 API Reference

### `POST /api/chat`

| Field | Type | Description |
|-------|------|-------------|
| `messages` | `[{role,user/assistant/system,content}]` | chat history |
| `model` | string | OpenAI model (default `gpt-3.5-turbo`) |
| `temperature` | float | sampling temperature |
| `enable_tts` | bool | also generate speech |
| `tts_voice` | enum | `default`, `male`, `female`, `robot` |
| `tts_exaggeration` | float | 0.0 – 1.0 |
| `tts_cfg_weight` | float | 0.0 – 1.0 |

Returns

```json
{
  "message": {"role":"assistant","content":"Hello!"},
  "audio_url": "/api/audio/4d5e.wav"
}
```

### `POST /api/chat/stream`
Same payload with `"stream": true`, responds as **Server-Sent Events** (`text/event-stream`).

### `POST /api/tts`
Generate speech only.

```json
{ "text": "Hello world", "voice": "default" }
```

Responds `audio/wav`.

### `GET /api/audio/{filename}`
Serves cached WAV files.

### `GET /health`
Simple health-check.

---

## 🩺 Troubleshooting

| Issue | Fix |
|-------|-----|
| `CUDA error: device not found` | Set `TTS_DEVICE=cpu` |
| `openai.error.RateLimitError` | Lower request rate or upgrade plan |
| Audio stutters in Safari | WAV streaming is chunked; fallback to full download by setting `ENABLE_STREAM_WAV=false` |
| `torch.cuda.OutOfMemory` | Use CPU or reduce concurrent TTS requests |

Enable verbose logs: `LOG_LEVEL=DEBUG` in `.env`.

---

## 🛠️ Developer Guide

* **Frontend storybook:** `npm run storybook`
* **Lint/format:** `npm run lint && npm run format`
* **API docs:** FastAPI auto-generates Swagger at `/docs` and Redoc at `/redoc`
* **Unit tests:** `pytest` (backend), `vitest` (frontend)

---

## 📦 Production Deployment

1. _Backend_ – Containerize with the provided **`Dockerfile.backend`** and deploy to Fly.io or Render (mount `/cache` volume for persisted audio).  
2. _Frontend_ – `npm run build && next start` on Node 20, or push to Vercel for zero-config deployment.  
3. Point domain `chat.example.com` to frontend; add `/api/*` reverse-proxy to backend to keep same origin.

---

## 🤝 Contributing

PRs & issues welcome!  
1. Fork → feature branch → PR  
2. Ensure `npm test` & `pytest` pass  
3. Follow the [Contributor Covenant](CODE_OF_CONDUCT.md)

---

## 📄 License
MIT © 2025 
---

_Enjoy chatting with a talking AI assistant!_ 🚀

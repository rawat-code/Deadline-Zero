# ⏰ Deadline Zero

> **An AI-powered productivity companion designed to prevent missed deadlines through early risk alerts, structured prioritization, and step-by-step action plans.**

[![Next.js](https://img.shields.io/badge/Next.js-15.x-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Firebase](https://img.shields.io/badge/Firebase-12.x-orange?logo=firebase)](https://firebase.google.com/)
[![Gemini AI](https://img.shields.io/badge/Gemini-AI%20Powered-4285F4?logo=google)](https://ai.google.dev/)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)

---

## 🚀 Overview

**Deadline Zero** is your intelligent productivity partner that helps you stay ahead of every commitment. Powered by Google Gemini AI, it doesn't just track your tasks — it actively monitors risk, predicts bottlenecks, and generates personalized action plans so you never miss a deadline again.

Whether you're a student juggling assignments, a developer managing sprints, or a professional handling multiple projects, Deadline Zero gives you the clarity and AI-driven guidance to work smarter.

---

## ✨ Features

- **🤖 AI-Powered Risk Detection** — Gemini AI analyzes your tasks and flags at-risk deadlines before they become a problem
- **📋 Smart Task Prioritization** — Automatically ranks tasks based on urgency, complexity, and deadlines
- **🗺️ Step-by-Step Action Plans** — Breaks down overwhelming tasks into manageable, actionable steps
- **📊 Progress Visualization** — Beautiful charts (powered by Recharts) to track your momentum
- **🔥 Real-time Sync** — Firebase backend keeps your data in sync across all devices
- **🎉 Completion Celebrations** — Satisfying confetti animations when you hit your goals
- **🌓 Clean, Responsive UI** — Built with Tailwind CSS for a seamless experience on any screen

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | Next.js 15 (App Router) |
| **Language** | TypeScript 5.7 |
| **AI** | Google Gemini API (`@google/genai`) |
| **Database & Auth** | Firebase 12 |
| **Styling** | Tailwind CSS 4 |
| **Charts** | Recharts |
| **Icons** | Lucide React |
| **Animations** | canvas-confetti |

---

## 📦 Prerequisites

Before getting started, make sure you have:

- **Node.js** (v18 or higher)
- A **Gemini API Key** — get one free at [Google AI Studio](https://aistudio.google.com/)
- A **Firebase project** — set up at [Firebase Console](https://console.firebase.google.com/)

---

## 🔧 Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/rawat-code/Deadline-Zero.git
cd Deadline-Zero
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Copy the example environment file and fill in your keys:

```bash
cp .env.example .env.local
```

Open `.env.local` and add your credentials:

```env
# Gemini API key for server-side AI operations
GEMINI_API_KEY=your_gemini_api_key_here
```

### 4. Configure Firebase

Update `firebase-applet-config.json` with your Firebase project credentials (available in your Firebase Console under Project Settings).

### 5. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see Deadline Zero in action.

---

## 📜 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Starts the development server with hot reload |
| `npm run build` | Builds the app for production |
| `npm start` | Starts the production server |
| `npm run lint` | Runs ESLint for code quality checks |

---

## 🌐 Live Demo

Try the app live on Google AI Studio:
👉 [https://ai.studio/apps/6ec2b2fe-8f98-489f-a4d8-1f9b9905a049](https://ai.studio/apps/6ec2b2fe-8f98-489f-a4d8-1f9b9905a049)

---

## 📁 Project Structure

```
Deadline-Zero/
├── app/                    # Next.js App Router pages & layouts
├── lib/                    # Utility functions & shared logic
├── .env.example            # Environment variable template
├── firebase-applet-config.json  # Firebase configuration
├── metadata.json           # App metadata & AI capability flags
├── next.config.ts          # Next.js configuration
├── tailwind.config.ts      # Tailwind CSS configuration
└── tsconfig.json           # TypeScript configuration
```

---

## 🤝 Contributing

Contributions are welcome! Here's how to get started:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Commit your changes: `git commit -m 'Add some feature'`
4. Push to the branch: `git push origin feature/your-feature-name`
5. Open a Pull Request

Please make sure your code passes linting (`npm run lint`) before submitting.

---

## 📄 License

This project is open source. See the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgements

- Built with [Google AI Studio](https://ai.google.dev/) and the Gemini API
- Bootstrapped from [google-gemini/aistudio-repository-template](https://github.com/google-gemini/aistudio-repository-template)

---

<p align="center">Made with ❤️ to bring your deadlines to zero.</p>

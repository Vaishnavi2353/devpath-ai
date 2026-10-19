# DevPath AI 🚀

**Turn your project ideas into realistic, actionable roadmaps.**

DevPath AI is an AI-powered project planning application designed to help students move from an idea to execution. It helps break down a project into manageable phases based on existing skills, available study time, and deadlines.

🔗 **Live Demo:** https://devpath-ai-alpha.vercel.app/

## 💡 The Problem

Having a project idea is easy. Knowing where to start, what to build first, which technologies to use, and how to finish within a deadline can be overwhelming.

DevPath AI aims to bridge that gap by turning project ideas into structured plans that students can follow step by step.

## ✨ Features

- **AI-Powered Roadmaps:** Generate a structured project plan from an idea.
- **Personalized Planning:** Consider your current skills, preferred tech stack, available hours, and deadline.
- **Phased Execution:** Break a project into smaller, manageable tasks.
- **Feasibility Awareness:** Help assess whether a plan fits the available time.
- **User Authentication:** Sign up, log in, and access protected application features.

## 🛠️ Tech Stack

**Frontend**
- React
- Vite
- JavaScript

**Backend**
- Node.js
- Express.js
- REST API

**Database**
- MongoDB
- Mongoose

**AI Integration**
- Google Gemini API

**Deployment**
- Vercel (frontend)
- Render (backend)
- MongoDB Atlas (database)

## ⚙️ How It Works

1. Enter your project idea and planning constraints.
2. Provide your current skills, available time, and target deadline.
3. DevPath AI processes the inputs and generates a structured roadmap.
4. Use the resulting phases and tasks to guide project execution.

## 🏗️ Architecture

The application uses a React frontend connected to an Express backend through API endpoints. The backend validates requests, communicates with the Gemini API, and uses MongoDB for persistent data.

```text
React + Vite Frontend
        |
        v
   Express REST API
        |
        +------> Input Validation
        |
        +------> Gemini API
        |
        v
    MongoDB Atlas
```

## 🚀 Running Locally

### Prerequisites

- Node.js and npm
- MongoDB connection string
- Google Gemini API key

### 1. Clone the repository

```bash
git clone https://github.com/Vaishnavi2353/devpath-ai.git
cd devpath-ai
```

### 2. Configure environment variables

Create the required `.env` files using the provided `.env.example` files in the relevant directories. Add

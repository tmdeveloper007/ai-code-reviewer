# Contributing to RepoSage 🚀

First off, thank you for considering contributing to **RepoSage**! It's contributors like you that make this AI-powered developer copilot so powerful. 

We are officially participating in **GirlScript Summer of Code (GSSoC) 2026**! Whether you are a beginner or an experienced developer, we are thrilled to have you here.

---

## 🏷️ GSSoC '26 Contribution Workflow

To ensure a smooth collaboration process, please follow these steps:

1. **Find an Issue**: Look at our open issues on GitHub or check [GOOD_FIRST_ISSUES.md](GOOD_FIRST_ISSUES.md). Look for the `gssoc26` and `good-first-issue` labels.
2. **Request Assignment**: Comment on the issue stating your interest. Please wait for a Project Admin or Mentor to officially assign the issue to you before writing code. *We will not review or merge PRs from unassigned contributors to avoid duplicate work.*
3. **Fork & Clone**: Fork the repository to your account and clone it locally.
4. **Create a Feature Branch**:
   ```bash
   git checkout -b feat/issue-description
   # Example: git checkout -b feat/clipboard-copy
   ```
5. **Develop & Test**: Run the modules locally to verify your changes. Make sure your changes compile cleanly.
   - Frontend: `npm run dev` or `npm run build` to verify.
   - Backend: `npm start`
   - AI Engine: `uvicorn app:app --reload`
6. **Commit & Push**: Use semantic commit messages (e.g., `feat(frontend): add copy code button to code viewer`).
7. **Submit a Pull Request**: Submit your PR targeting the `main` branch. 
   - Reference the issue number in your PR description (e.g., `Closes #12`).
   - Provide screenshots or GIFs of UI changes where possible.

---

## 🏷️ Issue Labels

We categorize tasks using the following GitHub labels:
- `gssoc26` - Official GirlScript Summer of Code '26 tasks.
- `good-first-issue` - Simple tasks ideal for beginners.
- `documentation` - Enhancing READMEs, guides, or API specifications.
- `frontend` - React & CSS-related enhancements.
- `backend` - Express.js API & system logic.
- `ai-engine` - Python FastAPI & LLM prompts.

## 🛠️ Code Style Guidelines

- **Frontend (React)**: Write reusable functional components, use clean CSS styling, and ensure responsive layouts.
- **Backend (Node.js)**: Use asynchronous JavaScript (`async/await`) and handle errors gracefully.
- **AI Engine (Python)**: Ensure compliance with PEP 8 and include descriptive type annotations.

Please respect our [Code of Conduct](CODE_OF_CONDUCT.md) in all communication channels. Happy hacking! 💻🔥

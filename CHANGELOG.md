# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0] - 2026-06-08

### Added
- **AI-Powered Code Review Engine**: Integration with Groq (Llama 3.3, DeepSeek, Gemma models) to perform full repository static analysis, identify bugs, security threats, optimization suggestions, and code conventions.
- **Interactive Web Dashboard**: React-based frontend client for uploading/submitting codebases, viewing file structures, selecting models, and viewing colored reviews per line.
- **Mermaid.js Flowchart Generator**: Automatic generation of visual architecture flowcharts showing project imports and file connections.
- **Complexity Metrics Analyzer**: Slates indicating Code Complexity grades (A-F), total SLOC, and estimated cognitive complexity per file.
- **HTML Report Export**: Endpoint and frontend action to export comprehensive repository analysis reviews as highly-styled HTML files.
- **GitHub Action**: Integration module packaging RepoSage analysis directly into automated CI workflows.
- **Community Templates**:
  - Issue templates: `bug_report.md`, `feature_request.md`, `gssoc_task_claim.md`
  - Pull request templates: `pull_request_template.md`
  - Environment configuration files: `.env.example` across modules
- **CI/CD Pipeline**: GitHub Actions setup verifying frontend compilation and backend module package integrity.
- **Docker Compose Setup**: Full dev-env orchestration mapping `frontend`, `backend`, and `ai-engine` microservices.

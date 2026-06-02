# 🌟 Good First Issues (GSSoC '26)

Welcome to the **RepoSage** contributor hub! If you are participating in **GSSoC '26** or looking to make your first contributions, these tasks are designed specifically for you.

To claim an issue:
1. Browse the list below or check the GitHub Issues tab.
2. Comment on the issue requesting to be assigned.
3. Wait for an administrator or mentor to assign it to you.
4. Submit your PR within the specified timeline.

---

## 📋 Open Issues List

### 1. 🎨 Frontend: Implement "Copy Code" Button in Code Viewer
* **Description**: When reviewing code files in the dashboard, users want to quickly copy file content. We need a "Copy Code" button at the top of the code viewer.
* **Suggested Labels**: `gssoc26`, `good-first-issue`, `frontend`
* **Implementation Hints**:
  - Locate the code container inside `frontend/src/App.tsx`.
  - Add a clipboard copy button (using a `lucide-react` icon like `Copy` or `Check` for success state).
  - Use `navigator.clipboard.writeText(selectedFileContent)` to save to clipboard.
  - Implement a 2-second visual feedback (e.g., changing the icon or showing "Copied!").

### 2. ⚙️ Backend: Add Detection Rules for Private Keys & API Tokens
* **Description**: Expand the backend's security scanner helper to detect generic private keys and other common credentials to protect developer codebases.
* **Suggested Labels**: `gssoc26`, `good-first-issue`, `backend`
* **Implementation Hints**:
  - Open `backend/index.js` and locate the `scanSecrets` function.
  - Add regex rules for:
    1. Generic Private Keys (e.g. detecting `-----BEGIN PRIVATE KEY-----` or `-----BEGIN RSA PRIVATE KEY-----`).
    2. Common credentials in `.env` / config files (e.g. `PASSWORD = "..."`, `SECRET_KEY = "..."`) using refined regex.
    3. Twilio Account SID (`AC[a-f0-9]{32}`) and Auth Token.
  - Confirm the new findings are correctly mapped to findings list format.

### 3. 🧠 AI Engine & Docs: Document API Endpoints in API.md
* **Description**: Document the HTTP API endpoints exposed by both the Node.js Express backend and the FastAPI AI engine to make developer onboarding easier.
* **Suggested Labels**: `gssoc26`, `good-first-issue`, `documentation`
* **Implementation Hints**:
  - Create a new markdown file named `API.md` in the root folder.
  - Document `POST /api/analyze` on the Express backend (inputs: `repoUrl`, `model`, `language`, outputs: JSON structure containing `bugs`, `security`, `optimization` findings, and file list).
  - Document `POST /analyze` on the Python FastAPI server.
  - Provide complete `curl` request and response JSON examples.
  - Add a link to `API.md` in the root `README.md`.

### 4. 🎨 Frontend: Persist Contributor Assignments to Local Storage
* **Description**: The GSSoC contributor assignment portal simulator on the React dashboard resets assignments when the page is refreshed. Let's persist these to `localStorage`.
* **Suggested Labels**: `gssoc26`, `good-first-issue`, `frontend`
* **Implementation Hints**:
  - Open `frontend/src/App.tsx` and find the state declaration `assignedContributors`.
  - Initialize the state by loading data from `localStorage.getItem('reposage_contributor_assignments')` if present.
  - Update `handleAssignContributor` to save assignments into `localStorage` using `localStorage.setItem`.
  - Add a "Reset Assignments" button below the simulator grid to clear `localStorage` and reset assignments to "Unassigned".

---

Let's make RepoSage an amazing open-source experience together! 🚀🔥


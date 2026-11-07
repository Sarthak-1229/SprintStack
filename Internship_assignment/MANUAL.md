# SprintStack - User & Developer Manual
**Automated Git-Ops & Developer Task Management System**

---

## 1. Overview & Core Philosophy

**SprintStack** is a specialized project management platform designed for software engineering teams and student developers. Unlike generic Kanban boards where any user can arbitrarily drag tasks into "Done", SprintStack enforces **true developer discipline through Git automation**:

- **Strict Traceability**: Tasks cannot be dragged manually into the **Done** column.
- **Commit-Gated Completion**: Tasks only transition to **Done** when a verified Git commit containing the unique Task ID (e.g. `TASK-101`) is processed.
- **Multi-Project Sessions**: Teams operate in isolated project workspaces joined via 6-character invitation codes.
- **Role-Based Governance**: Clear segregation between **Project Admins** (Leads) and **Team Members** (Developers).
- **Strict Client & Server Validation**: Robust validation preventing empty task creations, malformed logins, and invalid transitions.
- **Instant Visual Identification**: Custom user profile pictures appear directly on Kanban task cards, navbar, and rosters, eliminating the need to repeatedly open cards to verify task allotment.
- **Horizontal Task Carousel Navigation**: Column cards scroll horizontally with snappy card alignment, navigation chevrons, position dots, and a quick switch to traditional vertical list view.

---

## 2. Role Privileges & Access Matrix

| Feature / Action | 🛡️ Project Admin | ⚡ Team Member |
| :--- | :---: | :---: |
| Register with Role Selection | Yes | Yes |
| Create New Projects | Yes | — |
| Generate Unique Team Codes | Yes | — |
| Join Existing Projects via Code | Yes | Yes |
| Switch Between Project Workspaces | Yes | Yes |
| Create & Assign Tasks (`TASK-XXX`) | Yes | — |
| Start Task (`To Do` ➔ `In Progress`) | Yes | Yes |
| Manually Move to `Done` Column | ⛔ Blocked | ⛔ Blocked |
| Complete Task via Git Commit | Yes | Yes |
| Push via In-App Git Terminal | Yes | Yes |
| Delete Tasks | Yes | — |
| Set Profile Picture & Developer Track | Yes | Yes |
| Horizontal Carousel & List View Toggle | Yes | Yes |

---

## 3. Step-by-Step Workflow Guide

### Step 1: Account Creation & Sign In (Clean & Validated)
1. Open the application at `http://localhost:3000`.
2. **Clean Interface**: The login screen is completely sanitized with demo boxes removed for clean production use.
   > **Default Seeded Accounts (For Evaluation/Testing)**:
   > - **Lead Admin**: `sarthak` / `sarthak_1204`
   > - **Team Member**: `alex_dev` / `password123`
3. **Sign In Validation Rules**:
   - **Identifier (Username or Email)**: Cannot be empty; must be at least 3 characters.
   - **Passcode**: Cannot be empty; must be at least 6 characters.
   - If submitted empty or invalid, the form displays field-level red outlines and an alert banner detailing the exact errors.
4. **Register Account Validation Rules**:
   - Choose your role: **Team Member** (Developer) or **Project Admin** (Lead).
   - **Username**: Minimum 3 characters; letters, numbers, and underscores only.
   - **Email**: Must conform to a valid email format (e.g., `user@domain.com`).
   - **Passcode**: Minimum 6 characters required.
   - Select your profile track (**Student** or **Working Professional**).
5. Click **Create Account** to enter the workspace.

---

### Step 2: Managing Workspaces (Projects Hub)
Navigate to the **Projects Hub** tab in the top navigation bar:

#### For Admins: Creating a Project
1. Click **Create New Project**.
2. Enter the **Project Name** (e.g. `Autonomous Drone Telemetry`), Description, and optional GitHub repository URL.
3. Click **Generate Project & Code**.
4. A unique uppercase 6-character code (e.g., `PRJ-9042`) is generated. Click the **Copy** button to share it with your team.

#### For Team Members: Joining a Project
1. In the **Join Project via Team Code** card, enter the 6-character code provided by your admin.
2. Click **Enter Project**. You will immediately gain access to the project's task board and commit stream.

---

### Step 3: Managing Tasks & The Commit-Gated Rule

Navigate to the **Task Board** tab:

1. **Creating Tasks with Title Validation (Admin Only)**:
   - Click **+ Create & Assign Task**.
   - **Empty Title Guard**: If an admin leaves the title blank and presses **Issue Task**, the form blocks submission, highlights the input with a high-contrast red border, automatically focuses the cursor, and displays a clear warning:
     > *"Warning: Task title is required! Please enter a title before creating the task."*
   - Once a title is typed, the warning automatically disappears.
   - Fill in Priority, Category, Due Date, and assign to a team member.
   - The system automatically issues a sequential identifier: `[TASK-101]`, `[TASK-102]`, etc.

2. **Instant Assignee Identification on Cards**:
   - Every task card prominently displays the assignee's **profile photo** and handle (`@username`) in the card footer.
   - Team members instantly know who is allotted to which task without needing to click or expand the modal.

3. **Starting a Task (Developer)**:
   - Click the **Start Work** button on any card in the **To Do** column (or drag it into **In Progress**).
   - The card status changes to **In Progress**.

4. **The Commit-Gated "Done" Column (Strict Rule)**:
   - **Try dragging a task directly into "Done"**: The action will be **blocked** immediately.
   - A high-contrast warning banner will appear:
     > *"Done status is commit-gated! Tasks can only be completed automatically via a Git commit containing the task ID (e.g. TASK-101)."*

---

### Step 4: Completing Tasks via Git

You have three distinct ways to trigger automated task completion:

#### Method A: Using the In-App Git Terminal (Fastest for Demos & Testing)
1. Navigate to the **Git Automation** tab.
2. Under **In-App Commit Dispatcher**:
   - Select the target task from the dropdown (e.g., `TASK-102: Build Neo-brutalist Multi-Project Hub`).
   - The commit message preview automatically formats as:
     `TASK-102: <your work summary>`
   - Click **Dispatch Commit & Advance Task**.
3. The server validates the commit, appends it to the project commit history, and automatically transitions `TASK-102` to **Done** via WebSockets!

#### Method B: GitHub Webhook (For Real Remote Repositories)
1. On GitHub, go to your repository's **Settings ➔ Webhooks ➔ Add webhook**.
2. Copy the **Webhook URL** provided in the SprintStack **Git Automation** tab:
   `http://<your-server-ip>:5000/api/projects/<project-id>/webhook`
3. Content Type: `application/json`.
4. Whenever you run `git push origin main` on your local terminal with a commit like:
   ```bash
   git commit -m "TASK-101: added commit parser webhook"
   git push origin main
   ```
   SprintStack catches the payload and moves `TASK-101` to **Done**.

#### Method C: Local Git Hook (`post-commit`)
1. In your local Git repository folder, navigate to `.git/hooks/`.
2. Create an executable file named `post-commit` (no extension).
3. Copy the script snippet generated in SprintStack's **Git Automation ➔ Local Git Hook Setup**.
4. Every local commit will automatically sync with SprintStack:
   ```bash
   git commit -m "TASK-101: completed flight calibration"
   ```
   SprintStack instantly marks `TASK-101` as **Done** on your live screen!

---

### Step 5: Setting Profile Image & Visual Identity Across Kanban

Navigate to the **Profile** tab to customize your account photo:

1. **Upload Local Photo**:
   - Click the camera icon or **Upload Local Photo**.
   - Select any image file (PNG, JPG, WebP, SVG). The client automatically crops and compresses it on an HTML5 canvas for fast, lightweight storage.
2. **Developer Avatar Presets**:
   - Choose from ready-made presets (e.g. *Bot Lead*, *Frontend Dev*, *Adventurer*, *Pixel Hacker*, *Tech Pro*, *Cyberpunk*).
3. **Direct Image URL**:
   - Enter any image URL (e.g. your GitHub avatar `https://github.com/username.png`) and click **Set URL**.
4. **Universal Visual Synchronization**:
   - Your profile image is propagated instantly to:
     - **Kanban Task Cards**: Displayed next to your name in task footers.
     - **Navbar**: Displayed in the top right user badge.
     - **Task View Modal**: Displayed in the assignee detail section.
     - **Team Members Cluster & Roster**: Visible in the board header and modal roster.
     - **Git Commit Logs**: Visible beside each commit author.

---

### Step 6: Horizontal Scrolling Carousel & View Switching

Each column (**To Do**, **In Progress**, **Done**) supports horizontal card browsing:

1. **Horizontal Carousel Mode (Default)**:
   - When multiple tasks exist in a column, cards align side-by-side in a responsive horizontal track.
   - **Snap Scrolling**: Smooth `x mandatory` CSS scroll-snap ensures each card settles neatly in view when scrolling.
   - **Navigation Chevrons**: Solid Bauhaus left and right arrow buttons let you step through tasks card-by-card.
   - **Position Dot Indicators**: Interactive dots at the bottom of the column show the active card index and let you click directly to jump to any task.
2. **View Mode Toggle**:
   - Each column header features a toggle button (`Carousel` / `List`) in its top-right corner.
   - Click the list icon to switch to standard vertical stacking, or click the carousel icon to switch back to horizontal browsing.
3. **Full Drag-and-Drop Compatibility**:
   - Tasks can be dragged horizontally within the carousel or across columns without breaking alignment.

---

## 4. User Profile & Portfolios

Navigate to the **Profile** tab to maintain your developer record:

### Student Track:
- **University / College**: Institution name.
- **Degree & Branch**: Academic discipline (e.g., Computer Engineering / TY).
- **Year / Semester**: Current semester status.
- **Technical Skills**: Interactive tags (React, Node, Python, Docker).
- **GitHub Link**: Clickable link to your public GitHub profile.

### Working Professional Track:
- **Company / Organization**: Workplace name.
- **Department & Title**: Seniority and engineering specialty.
- **Experience Level**: Years in industry.

### Productivity Matrix:
The profile automatically calculates and displays:
- Total Workspaces Joined.
- Tasks Assigned to You.
- Tasks Verified & Completed via Git Commits.
- Individual Sprint Completion Velocity (%).

---

## 5. Quick Demonstration Script (Viva / Presentation Guide)

When demonstrating this project to an evaluator or team:

1. **Start Screen & Login Validation**:
   - Show the clean login form (demo credential box removed). Try clicking **Enter Workspace** with empty inputs.
   - Point out the red validation highlight and error messages (*"Username or email address is required"*, *"Passcode is required"*).
2. **Profile Avatar Customization**:
   - Log in as `sarthak` (Admin).
   - Navigate to **Profile** and upload or select an avatar preset.
   - Show how the avatar immediately updates in the navbar and profile hero.
3. **Project Hub**:
   - Create a project named *"Autonomous Robotics"*. Point out the auto-generated Team Code (e.g., `PRJ-4821`).
4. **Team Member Joining & Visual Allotment**:
   - In an incognito window, log in as `alex_dev` (Member) and join `PRJ-4821`.
   - On the Admin's board, create a task assigned to `alex_dev`.
   - Show how `alex_dev`'s avatar and handle are directly visible on the task card in the board without having to click into it!
5. **Right Rolling Wheel Animation**:
   - Point out the rolling image wheel on the right edge of the card in all three columns (To Do, In Progress, Done).
   - Hover over the card to demonstrate the speed acceleration.
6. **Start Task & Demonstrate Commit-Gate**:
   - Move task to **In Progress** via **Start Work**.
   - Attempt to drag the task directly to **Done**; show the strict commit-gate rejection warning.
7. **Commit & Complete**:
   - Switch to **Git Automation** tab.
   - Execute `$ git commit -m "TASK-101: completed sensor calibration"`.
   - Switch back to the **Task Board** to show the task verified and completed in **Done** with the emerald green verified rolling wheel!

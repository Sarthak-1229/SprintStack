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
| Customize Student / Professional Profile | Yes | Yes |

---

## 3. Step-by-Step Workflow Guide

### Step 1: Account Creation & Sign In (Strict Validation)
1. Open the application at `http://localhost:3000`.
2. **Sign In Validation Rules**:
   - **Identifier (Username or Email)**: Cannot be empty; must be at least 3 characters.
   - **Passcode**: Cannot be empty; must be at least 6 characters.
   - If submitted empty or invalid, the form displays field-level red outlines and an alert banner detailing the exact errors.
3. **Register Account Validation Rules**:
   - Choose your role: **Team Member** (Developer) or **Project Admin** (Lead).
   - **Username**: Minimum 3 characters; letters, numbers, and underscores only.
   - **Email**: Must conform to a valid email format (e.g., `user@domain.com`).
   - **Passcode**: Minimum 6 characters required.
   - Select your profile track (**Student** or **Working Professional**).
4. Click **Create Account** to enter the workspace.
   > **Quick Demo Logins:**
   > - **Admin**: `sarthak` / `sarthak_1204`
   > - **Member**: `alex_dev` / `password123`

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

2. **Starting a Task (Developer)**:
   - Click the **Start Work** button on any card in the **To Do** column (or drag it into **In Progress**).
   - The card status changes to **In Progress**.

3. **The Commit-Gated "Done" Column (Strict Rule)**:
   - **Try dragging a task directly into "Done"**: The action will be **blocked** immediately.
   - A high-contrast warning banner will appear:
     > *"Done status is commit-gated! Tasks can only be completed automatically via a Git commit containing the task ID (e.g. TASK-101)."*

---

### Step 4: Completing Tasks via Git

You have three distinct ways to trigger automated task completion:

#### Method A: Using the In-App Git Terminal (Fastest for Demos & Testing)
1. Go to the **Git Automation** tab.
2. Under **Quick-link an Active Task**, select your task (e.g. `[TASK-101]`).
3. The terminal command line automatically populates:
   ```bash
   $ git commit -m "TASK-101: implemented sensor telemetry loop"
   ```
4. Click **Push Commit ($ git push)**.
5. **Instant Result**:
   - The terminal logs `Commit accepted!`.
   - The task board automatically moves `TASK-101` into the **Done** column.
   - A green verified badge is attached to the card displaying `#<hash>` and the committer name.
   - A celebratory banner appears across the board in real time.

---

#### Method B: Real GitHub Webhook (For Public Production Repos)
1. In the **Git Automation** tab, copy the **Webhook URL**:
   ```
   http://<your-server-url>/api/projects/<projectId>/webhook
   ```
2. In your GitHub repository:
   - Go to **Settings** ➔ **Webhooks** ➔ **Add webhook**.
   - Paste the URL into **Payload URL**.
   - Set **Content type** to `application/json`.
   - Select **Just the push event**.
   - Click **Add webhook**.
3. Now, whenever developers push commits containing `TASK-XXX` to GitHub, SprintStack updates the board automatically!

---

#### Method C: Local Git Post-Commit Hook (Real Terminal Commits on Your PC)
If you are developing locally and want real `git commit` commands in your computer terminal to update SprintStack automatically:

1. In your local Git repository folder on your machine, create or edit `.git/hooks/post-commit`:
2. Add the following script:

```bash
#!/bin/sh
# SprintStack Local Commit Hook
COMMIT_MSG=$(git log -1 --pretty=%B)
COMMIT_HASH=$(git log -1 --pretty=%h)
AUTHOR=$(git log -1 --pretty=%an)

curl -s -X POST http://localhost:5000/api/projects/<YOUR_PROJECT_ID>/commit \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>" \
  -d "{\"commitMessage\":\"$COMMIT_MSG\",\"commitHash\":\"$COMMIT_HASH\",\"author\":\"$AUTHOR\"}" > /dev/null
```
3. Whenever you run:
   ```bash
   git commit -m "TASK-101: completed flight calibration"
   ```
   SprintStack instantly marks `TASK-101` as **Done** on your live screen!

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
   - Show the login form and try clicking **Enter Workspace** with empty inputs.
   - Point out the red validation highlight and error messages (*"Username or email address is required"*, *"Passcode is required"*).
2. **Project Hub**:
   - Log in as `sarthak` (Admin).
   - Create a project named *"Autonomous Robotics"*. Point out the auto-generated Team Code (e.g., `PRJ-4821`).
3. **Team Member Joining**:
   - Open an incognito browser window and log in as `alex_dev` (Member).
   - Enter `PRJ-4821` to join the project.
4. **Issue a Task (Empty Title Validation)**:
   - Click **+ Create & Assign Task**. Leave Title blank and click **Issue Task**.
   - Show the bold warning banner: *"Warning: Task title is required!"* with the input highlighted in red and auto-focused.
   - Enter title *"Calibrate LiDAR Sensor"* and assign it to `alex_dev`. Note the auto-generated sequential ID `[TASK-101]`.
5. **Start Task**:
   - As `alex_dev`, click **Start Work** to move `TASK-101` to **In Progress**.
6. **Demonstrate the Commit-Gate**:
   - Try to drag `TASK-101` into **Done**.
   - Show the red alert: explain that SprintStack prevents developers from claiming work is done without verified code commits.
7. **Commit & Complete**:
   - Switch to the **Git Automation** tab.
   - Run the commit `$ git commit -m "TASK-101: completed sensor calibration"`.
   - Switch back to the **Task Board** to show `TASK-101` now resting in **Done** with green commit hash `#...` and author attribution!

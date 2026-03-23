# National 2026 Hackathon

Welcome to the official repository for the National 2026 Hackathon! This repository is where all teams will submit their final project code.

## Submission Guidelines

To keep everyone's code organized and prevent conflicts, all submissions must be uploaded using the **Fork and Pull Request** workflow. 

Your code must be placed inside the `submissions/` folder in a sub-folder named with your team number and team name.
**Format:** `submissions/[Team Number]-[Team Name]/`
**Example:** `submissions/04-code-ninjas/`

---

## Step-by-Step Submission Guide for Beginners

If you are new to Git and GitHub, follow these exact steps to submit your project:

### Step 1: Fork the Repository
1. Click the **"Fork"** button in the top right corner of this repository.
2. This creates a complete copy of this repository under your own GitHub account.

### Step 2: Clone Your Fork
1. Go to your newly forked repository on your GitHub profile.
2. Click the green **"Code"** button and copy the URL.
3. Open your computer's terminal (or command prompt) and run:
   ```bash
   git clone https://github.com/Expert-Labs-IN/NH26
   ```
4. Move into the project folder:
   ```bash
   cd NH26
   ```

### Step 3: Create Your Team's Folder
1. Navigate to the `submissions` folder:
   ```bash
   cd submissions
   ```
2. Create a new folder with your team number and team name (use hyphens, no spaces):
   ```bash
   mkdir 04-code-ninjas
   ```
3. Place all of your project code, assets, and documentation **inside this folder only**.

### Step 4: Add Your Code and Commit
Once your code is ready, save it to Git:
```bash
git add .
git commit -m "Add final project submission for Team 04-code-ninjas"
```

### Step 5: Push to Your Fork
Upload the code from your computer back to your GitHub account:
```bash
git push origin main
```
*(Note: If your default branch is `master`, use `git push origin master` instead).*

### Step 6: Create a Pull Request (PR)
1. Go to the original National 2026 repository (this page).
2. You should see a banner saying your branch is ahead of the main repository. Click **"Compare & pull request"**.
3. Title your Pull Request with your team name (e.g., `Submission: Team 04-code-ninjas`).
4. Add any necessary descriptions about your project.
5. Click **"Create pull request"**.

**Congratulations! Your project is now officially submitted.**

---

## ⚠️ Important Rules
* **DO NOT** edit, move, or delete any files outside of your designated team folder.
* Ensure you do not upload heavy dependencies (like `node_modules` or `__pycache__`). Use a `.gitignore` file inside your project folder.
* Your folder name must match exactly: `TeamNumber-TeamName`.

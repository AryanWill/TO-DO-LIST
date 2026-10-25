# TaskFlow — To-Do App

A polished, responsive task manager built with **HTML, CSS, and vanilla JavaScript**. TaskFlow helps you organize your day with categories, priorities, due dates, search, filters, progress stats, and drag-and-drop ordering.

![TaskFlow](https://placehold.co/1200x630/100d19/c4b5fd?text=TaskFlow%20%E2%80%94%20Make%20space%20for%20focus)

## ✨ Features

- **Task CRUD** — create, edit, complete, and delete tasks.
- **Categories** — organize work into Personal, Work, Study, Ideas, or add your own.
- **Priority levels** — low, medium, and high.
- **Due dates** — see upcoming, due-today, and overdue tasks.
- **Search and filters** — search task titles, descriptions, and categories; filter by active/completed.
- **Sorting** — use manual order, due date, priority, or recently added.
- **Drag and drop** — reorder tasks in manual sorting mode.
- **Progress dashboard** — total, active, completed, and completion rate.
- **Local persistence** — tasks and categories are stored in your browser using `localStorage`.
- **Responsive design** — layouts adapt to desktop, tablet, and mobile.
- **Small quality-of-life details** — keyboard shortcuts, toast feedback, empty states, and reduced-motion support.

## 🧰 Built with

- HTML5
- CSS3 (custom properties, grid, flexbox, animations, responsive media queries)
- Vanilla JavaScript (DOM APIs, event delegation, localStorage, native drag-and-drop)

No frameworks, build tools, or dependencies are required.

## 🚀 Run locally

### Option 1: Open directly
1. Download or clone this repository.
2. Open `index.html` in your browser.

### Option 2: Use a local server (recommended)
If you have Python installed, open a terminal in the project folder and run:

```bash
python -m http.server 8000
```

Then visit [http://localhost:8000](http://localhost:8000).

You can also use the **Live Server** extension in VS Code.

## ⌨️ Keyboard shortcuts

| Shortcut | Action |
| --- | --- |
| `N` | Open the new task dialog |
| `/` | Focus the search field |
| `Esc` | Close a dialog or mobile navigation |

## 📁 Project structure

```text
taskflow-todo/
├── index.html    # App structure and dialogs
├── styles.css    # Theme, responsive layout, animations
├── app.js        # Task state, rendering, interactions, localStorage
├── README.md     # Project documentation
├── LICENSE       # MIT license
└── .gitignore    # Common local/editor files
```

## 🌐 Deploy with GitHub Pages

1. Create a new repository on GitHub, for example `taskflow-todo`.
2. Upload or push all project files to the repository root.
3. Open **Settings → Pages**.
4. Under **Build and deployment**, choose **Deploy from a branch**.
5. Select `main` and `/ (root)`, then save.
6. Wait for GitHub Pages to publish your site. The URL appears in the Pages settings.

## 🧑‍💻 Push it to GitHub

Run these commands from the project folder after creating an empty GitHub repository:

```bash
git init
git add .
git commit -m "Build TaskFlow to-do app"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/taskflow-todo.git
git push -u origin main
```

Replace `YOUR-USERNAME` with your GitHub username.

## 🗺️ Possible future improvements

- Export/import tasks as JSON
- Light theme toggle
- Recurring tasks and reminders
- Backend sync and authentication
- Unit tests for task filtering and sorting

## 💾 Data and privacy

Tasks are stored in the browser's `localStorage` on the device where the app is used. They do not sync between browsers or devices. Clearing browser site data can remove saved tasks, so export/backup functionality would be a useful future enhancement.

## 📄 License

Distributed under the MIT License. See [`LICENSE`](LICENSE).

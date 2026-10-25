(() => {
  "use strict";

  const STORAGE_KEY = "taskflow.tasks.v1";
  const CATEGORY_KEY = "taskflow.categories.v1";
  const DEFAULT_CATEGORIES = [
    { name: "Personal", color: "#a78bfa" },
    { name: "Work", color: "#80aaff" },
    { name: "Study", color: "#f0a2d7" },
    { name: "Ideas", color: "#67e8b1" }
  ];

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const todayISO = () => {
    const date = new Date();
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  };
  const uid = () => (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`);
  const escapeHTML = (value = "") => String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[char]));

  let categories = loadCategories();
  let tasks = loadTasks();
  let activeView = "all";
  let activeCategory = "";
  let activeFilter = "all";
  let searchTerm = "";
  let sortMode = "manual";
  let draggedId = null;

  const taskList = $("#taskList");
  const taskModal = $("#taskModal");
  const taskForm = $("#taskForm");
  const taskTitle = $("#taskTitle");

  function loadCategories() {
    try {
      const saved = JSON.parse(localStorage.getItem(CATEGORY_KEY));
      return Array.isArray(saved) && saved.length ? saved : DEFAULT_CATEGORIES.map(c => ({...c}));
    } catch { return DEFAULT_CATEGORIES.map(c => ({...c})); }
  }
  function loadTasks() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (Array.isArray(saved)) return saved;
    } catch { /* corrupted local storage: start clean */ }
    return [
      { id: uid(), title: "Make a plan for the week", description: "Choose the three things that would make this week a win.", category: "Personal", priority: "high", dueDate: todayISO(), completed: false, createdAt: Date.now() - 3600000, order: 1 },
      { id: uid(), title: "Review JavaScript fundamentals", description: "Spend 30 minutes on arrays, objects, and functions.", category: "Study", priority: "medium", dueDate: "", completed: false, createdAt: Date.now() - 1800000, order: 2 },
      { id: uid(), title: "Sketch out a new project idea", description: "Write down the problem, audience, and first feature.", category: "Ideas", priority: "low", dueDate: "", completed: true, createdAt: Date.now() - 900000, order: 3 }
    ];
  }
  function persist() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
      localStorage.setItem(CATEGORY_KEY, JSON.stringify(categories));
    } catch { toast("Could not save changes in this browser.", "error"); }
  }
  function categoryFor(name) {
    return categories.find(c => c.name === name) || { name: name || "Other", color: "#a78bfa" };
  }
  function formatDate(iso) {
    if (!iso) return "";
    const date = new Date(`${iso}T12:00:00`);
    return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  }
  function dueState(task) {
    if (!task.dueDate || task.completed) return "";
    if (task.dueDate < todayISO()) return "overdue";
    if (task.dueDate === todayISO()) return "today";
    return "";
  }
  function dueText(task) {
    const state = dueState(task);
    if (state === "overdue") return `Overdue · ${formatDate(task.dueDate)}`;
    if (state === "today") return "Due today";
    return task.dueDate ? `Due ${formatDate(task.dueDate)}` : "";
  }
  function getVisibleTasks() {
    let visible = [...tasks];
    if (activeView === "today") visible = visible.filter(t => !t.completed && t.dueDate === todayISO());
    if (activeView === "upcoming") visible = visible.filter(t => !t.completed && t.dueDate && t.dueDate > todayISO());
    if (activeView === "completed") visible = visible.filter(t => t.completed);
    if (activeView === "category") visible = visible.filter(t => t.category === activeCategory);
    if (activeFilter === "active") visible = visible.filter(t => !t.completed);
    if (activeFilter === "completed") visible = visible.filter(t => t.completed);
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      visible = visible.filter(t => `${t.title} ${t.description} ${t.category}`.toLowerCase().includes(term));
    }
    if (sortMode === "due") visible.sort((a,b) => (a.dueDate || "9999").localeCompare(b.dueDate || "9999"));
    if (sortMode === "priority") {
      const rank = { high: 0, medium: 1, low: 2 };
      visible.sort((a,b) => rank[a.priority] - rank[b.priority]);
    }
    if (sortMode === "created") visible.sort((a,b) => b.createdAt - a.createdAt);
    if (sortMode === "manual") visible.sort((a,b) => (a.order || 0) - (b.order || 0));
    return visible;
  }
  function render() {
    renderNavigation();
    renderStats();
    renderTasks();
    updatePageCopy();
  }
  function renderNavigation() {
    const open = tasks.filter(t => !t.completed);
    $("#allCount").textContent = tasks.length;
    $("#todayCount").textContent = open.filter(t => t.dueDate === todayISO()).length;
    $$(".nav-item[data-view]").forEach(button => button.classList.toggle("active", button.dataset.view === activeView && activeView !== "category"));
    $("#categoryList").innerHTML = categories.map(category => {
      const count = open.filter(t => t.category === category.name).length;
      return `<button class="nav-item ${activeView === "category" && activeCategory === category.name ? "active" : ""}" data-category="${escapeHTML(category.name)}"><span class="category-dot" style="background:${escapeHTML(category.color)}"></span><span>${escapeHTML(category.name)}</span><span class="nav-count">${count}</span></button>`;
    }).join("");
    $("#taskCategory").innerHTML = categories.map(c => `<option value="${escapeHTML(c.name)}">${escapeHTML(c.name)}</option>`).join("");
    const completed = tasks.filter(t => t.completed).length;
    const rate = tasks.length ? Math.round(completed / tasks.length * 100) : 0;
    $("#weeklyPercent").textContent = `${rate}%`;
    $("#weeklyBar").style.width = `${rate}%`;
    $("#weeklyCaption").textContent = rate === 100 && tasks.length ? "Everything checked off. Amazing work!" : rate > 0 ? "Nice momentum. Keep it going." : "A fresh start. Let’s make it count.";
  }
  function renderStats() {
    const completed = tasks.filter(t => t.completed).length;
    const active = tasks.length - completed;
    const rate = tasks.length ? Math.round(completed / tasks.length * 100) : 0;
    $("#totalStat").textContent = tasks.length;
    $("#progressStat").textContent = active;
    $("#completedStat").textContent = completed;
    $("#rateStat").innerHTML = `${rate}<span class="value-percent">%</span>`;
    $("#rateBar").style.width = `${rate}%`;
    $("#completionFoot").textContent = completed ? `${completed} ${completed === 1 ? "task" : "tasks"} checked off` : "Every step counts";
  }
  function updatePageCopy() {
    const map = {
      all: ["All tasks", "Make space for <span>focus.</span>", "A little progress each day adds up to big results.", "Your tasks", "Keep your priorities clear and your momentum going."],
      today: ["Today", "Own your <span>today.</span>", "Focus on what matters most right now.", "Today’s tasks", "Small wins make a strong day."],
      upcoming: ["Upcoming", "Look ahead. <span>Stay ready.</span>", "See what’s coming and give future-you a head start.", "Coming up", "Your next steps, all in one place."],
      completed: ["Completed", "Look how far <span>you’ve come.</span>", "Every finished task is proof of progress.", "Completed tasks", "Take a moment to appreciate the work you’ve done."]
    };
    const data = activeView === "category"
      ? [`${activeCategory}`, `Make room for <span>${escapeHTML(activeCategory.toLowerCase())}.</span>`, "One clear step at a time.", `${activeCategory} tasks`, `Everything in your ${activeCategory.toLowerCase()} category.`]
      : map[activeView];
    $("#breadcrumbTitle").textContent = data[0];
    $("#pageTitle").innerHTML = data[1];
    $("#pageSubtitle").textContent = data[2];
    $("#listTitle").textContent = data[3];
    $("#listDescription").textContent = data[4];
  }
  function renderTasks() {
    const visible = getVisibleTasks();
    $("#listCount").textContent = visible.length;
    $("#filterAllCount").textContent = activeView === "all" ? tasks.length : visible.length;
    $("#footerCount").textContent = `${visible.length} ${visible.length === 1 ? "task" : "tasks"}`;
    $("#filterAllCount").textContent = activeView === "all" ? tasks.length : visible.length;
    if (!visible.length) {
      const title = searchTerm ? "No matching tasks" : activeFilter === "completed" || activeView === "completed" ? "Nothing completed just yet" : "Your space to get things done";
      const message = searchTerm ? "Try another search term or clear your search." : activeFilter === "completed" || activeView === "completed" ? "Complete a task and it’ll show up here. You’ve got this." : "Start with one small task. You’ll be surprised how quickly momentum builds.";
      taskList.innerHTML = `<div class="empty-state"><div class="empty-illustration">✦</div><h3>${title}</h3><p>${message}</p>${!searchTerm && activeView !== "completed" && activeFilter !== "completed" ? '<button class="primary-button" data-empty-add>＋ Create your first task</button>' : ""}</div>`;
      return;
    }
    taskList.innerHTML = visible.map(task => {
      const category = categoryFor(task.category);
      const due = dueText(task);
      const state = dueState(task);
      return `<article class="task-row ${task.completed ? "is-complete" : ""}" data-id="${escapeHTML(task.id)}" draggable="${sortMode === "manual"}">
        <span class="drag-handle" title="Drag to reorder" aria-label="Drag to reorder">⠿</span>
        <input class="task-check" type="checkbox" aria-label="Mark ${escapeHTML(task.title)} complete" ${task.completed ? "checked" : ""} data-complete="${escapeHTML(task.id)}" />
        <div class="task-main">
          <div class="task-name-line"><span class="task-name">${escapeHTML(task.title)}</span></div>
          ${task.description ? `<div class="task-description">${escapeHTML(task.description)}</div>` : ""}
          <div class="task-meta">
            <span class="category-pill"><span class="category-dot" style="background:${escapeHTML(category.color)}"></span>${escapeHTML(task.category)}</span>
            <span class="priority-pill ${escapeHTML(task.priority)}">${task.priority === "high" ? "↑" : task.priority === "low" ? "↓" : "–"} ${escapeHTML(task.priority[0].toUpperCase() + task.priority.slice(1))}</span>
            ${due ? `<span class="due-label ${state}">${escapeHTML(due)}</span>` : ""}
          </div>
        </div>
        <div class="task-actions"><button class="task-action" data-edit="${escapeHTML(task.id)}" title="Edit task" aria-label="Edit task">✎</button><button class="task-action delete" data-delete="${escapeHTML(task.id)}" title="Delete task" aria-label="Delete task">×</button></div>
      </article>`;
    }).join("");
  }
  function openTaskModal(task = null) {
    taskForm.reset();
    $("#taskId").value = task ? task.id : "";
    $("#modalTitle").textContent = task ? "Edit task" : "Create a task";
    $("#saveButtonLabel").textContent = task ? "Save changes" : "Create task";
    $("#taskTitle").value = task?.title || "";
    $("#taskDescription").value = task?.description || "";
    $("#taskCategory").value = task?.category && categories.some(c => c.name === task.category) ? task.category : (categories[0]?.name || "");
    $("#taskPriority").value = task?.priority || "medium";
    $("#taskDue").value = task?.dueDate || "";
    taskModal.classList.add("open");
    taskModal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    setTimeout(() => taskTitle.focus(), 60);
  }
  function closeTaskModal() {
    taskModal.classList.remove("open");
    taskModal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }
  function toast(message, type = "success") {
    const node = document.createElement("div");
    node.className = "toast";
    node.innerHTML = `<span class="toast-mark">${type === "error" ? "!" : "✓"}</span><span>${escapeHTML(message)}</span>`;
    $("#toastRegion").append(node);
    setTimeout(() => { node.classList.add("removing"); setTimeout(() => node.remove(), 220); }, 2800);
  }
  function addTask(data) {
    const highestOrder = Math.max(0, ...tasks.map(t => t.order || 0));
    tasks.unshift({ id: uid(), ...data, completed: false, createdAt: Date.now(), order: highestOrder + 1 });
    persist(); render(); toast("Task created. You’ve got this.");
  }
  function saveTask(event) {
    event.preventDefault();
    const title = $("#taskTitle").value.trim();
    if (!title) { taskTitle.focus(); return; }
    const data = {
      title,
      description: $("#taskDescription").value.trim(),
      category: $("#taskCategory").value || categories[0]?.name || "Personal",
      priority: $("#taskPriority").value,
      dueDate: $("#taskDue").value
    };
    const id = $("#taskId").value;
    if (id) {
      tasks = tasks.map(task => task.id === id ? { ...task, ...data } : task);
      persist(); render(); closeTaskModal(); toast("Your changes are saved.");
    } else {
      addTask(data); closeTaskModal();
    }
  }
  function toggleComplete(id, completed) {
    tasks = tasks.map(t => t.id === id ? { ...t, completed } : t);
    persist(); render();
    const task = tasks.find(t => t.id === id);
    toast(completed ? "Task completed. Nice work!" : "Task moved back to active.");
  }
  function deleteTask(id) {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    tasks = tasks.filter(t => t.id !== id);
    persist(); render(); toast("Task deleted.");
  }
  function setView(view) {
    activeView = view;
    activeCategory = "";
    activeFilter = "all";
    $$(".filter-tab").forEach(tab => tab.classList.toggle("active", tab.dataset.filter === "all"));
    render();
    $("#sidebar").classList.remove("open");
  }
  function addCategory() {
    const name = prompt("Name your new category:");
    if (name === null) return;
    const clean = name.trim().slice(0, 28);
    if (!clean) return;
    if (categories.some(c => c.name.toLowerCase() === clean.toLowerCase())) { toast("That category already exists.", "error"); return; }
    const colors = ["#a78bfa", "#80aaff", "#f0a2d7", "#67e8b1", "#f5c27c", "#ff8b9a"];
    categories.push({ name: clean, color: colors[categories.length % colors.length] });
    persist(); render(); toast(`Category “${clean}” added.`);
  }
  function showInfo() {
    $("#infoModal").classList.add("open");
    $("#infoModal").setAttribute("aria-hidden", "false");
  }
  function closeInfo() {
    $("#infoModal").classList.remove("open");
    $("#infoModal").setAttribute("aria-hidden", "true");
  }

  // Delegated clicks keep controls working after each render.
  document.addEventListener("click", event => {
    const viewButton = event.target.closest("[data-view]");
    if (viewButton) { setView(viewButton.dataset.view); return; }
    const categoryButton = event.target.closest("[data-category]");
    if (categoryButton) { activeView = "category"; activeCategory = categoryButton.dataset.category; activeFilter = "all"; $$(".filter-tab").forEach(tab => tab.classList.toggle("active", tab.dataset.filter === "all")); render(); $("#sidebar").classList.remove("open"); return; }
    const filterButton = event.target.closest("[data-filter]");
    if (filterButton) { activeFilter = filterButton.dataset.filter; $$(".filter-tab").forEach(tab => tab.classList.toggle("active", tab === filterButton)); renderTasks(); return; }
    if (event.target.closest("#topAddBtn, #panelAddBtn, [data-empty-add]")) { openTaskModal(); return; }
    const editButton = event.target.closest("[data-edit]");
    if (editButton) { const task = tasks.find(t => t.id === editButton.dataset.edit); if (task) openTaskModal(task); return; }
    const deleteButton = event.target.closest("[data-delete]");
    if (deleteButton) { deleteTask(deleteButton.dataset.delete); return; }
    if (event.target.closest("[data-close-modal]")) { closeTaskModal(); return; }
    if (event.target.closest("[data-close-info]")) { closeInfo(); return; }
    if (event.target.closest("#helpBtn, #workspaceInfoBtn")) { showInfo(); return; }
    if (event.target.closest("#addCategoryBtn")) { addCategory(); return; }
    if (event.target.closest("#mobileMenuBtn")) { $("#sidebar").classList.toggle("open"); return; }
    if (event.target === taskModal) closeTaskModal();
    if (event.target === $("#infoModal")) closeInfo();
  });
  document.addEventListener("change", event => {
    const checkbox = event.target.closest("[data-complete]");
    if (checkbox) toggleComplete(checkbox.dataset.complete, checkbox.checked);
  });
  taskForm.addEventListener("submit", saveTask);
  $("#searchInput").addEventListener("input", event => { searchTerm = event.target.value.trim(); renderTasks(); });
  $("#sortSelect").addEventListener("change", event => { sortMode = event.target.value; renderTasks(); });
  document.addEventListener("keydown", event => {
    const typing = ["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement?.tagName);
    if (event.key === "Escape") { closeTaskModal(); closeInfo(); $("#sidebar").classList.remove("open"); }
    if (!typing && event.key.toLowerCase() === "n") { event.preventDefault(); openTaskModal(); }
    if (!typing && event.key === "/") { event.preventDefault(); $("#searchInput").focus(); }
  });

  // Native drag-and-drop ordering. Manual order is preserved in localStorage.
  taskList.addEventListener("dragstart", event => {
    const row = event.target.closest(".task-row");
    if (!row || sortMode !== "manual") return;
    draggedId = row.dataset.id;
    row.classList.add("dragging");
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", draggedId);
  });
  taskList.addEventListener("dragover", event => {
    event.preventDefault();
    const row = event.target.closest(".task-row");
    $$(".task-row.drag-over", taskList).forEach(el => el.classList.remove("drag-over"));
    if (row && row.dataset.id !== draggedId) row.classList.add("drag-over");
  });
  taskList.addEventListener("drop", event => {
    event.preventDefault();
    const target = event.target.closest(".task-row");
    const fromId = draggedId || event.dataTransfer.getData("text/plain");
    if (!target || !fromId || target.dataset.id === fromId) return;
    const ordered = [...tasks].sort((a,b) => (a.order || 0) - (b.order || 0));
    const fromIndex = ordered.findIndex(t => t.id === fromId);
    const toIndex = ordered.findIndex(t => t.id === target.dataset.id);
    if (fromIndex < 0 || toIndex < 0) return;
    const [moved] = ordered.splice(fromIndex, 1);
    ordered.splice(toIndex, 0, moved);
    ordered.forEach((task, index) => task.order = index + 1);
    tasks = ordered;
    persist(); renderTasks();
    toast("Task order updated.");
  });
  taskList.addEventListener("dragend", () => {
    draggedId = null;
    $$(".task-row", taskList).forEach(row => row.classList.remove("dragging", "drag-over"));
  });

  $("#currentDate").textContent = new Date().toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
  render();
})();
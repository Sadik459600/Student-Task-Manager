
// ========================================
// STUDENT TASK MANAGER
// Complete JavaScript
// ========================================

// ---------- Toast Notifications ----------

function showToast(message, type = "success") {
    let toast = document.getElementById("appToast");

    if (!toast) {
        toast = document.createElement("div");
        toast.id = "appToast";
        toast.className = "app-toast";
        toast.setAttribute("role", "status");
        toast.setAttribute("aria-live", "polite");
        document.body.appendChild(toast);
    }

    toast.textContent = message;
    toast.className = `app-toast ${type} show`;

    if (toast.hideTimer) {
        clearTimeout(toast.hideTimer);
    }

    toast.hideTimer = setTimeout(() => {
        toast.classList.remove("show");
    }, 2800);
}

// ---------- Local Storage Helpers ----------

function getUsers() {
    try {
        const users = JSON.parse(localStorage.getItem("users"));
        return Array.isArray(users) ? users : [];
    } catch (error) {
        console.error("Could not read users:", error);
        return [];
    }
}

function getTasks() {
    try {
        const tasks = JSON.parse(localStorage.getItem("tasks"));
        return Array.isArray(tasks) ? tasks : [];
    } catch (error) {
        console.error("Could not read tasks:", error);
        return [];
    }
}

function getCurrentUser() {
    try {
        return JSON.parse(localStorage.getItem("currentUser"));
    } catch (error) {
        console.error("Could not read current user:", error);
        return null;
    }
}

function saveTasks(tasks) {
    try {
        localStorage.setItem("tasks", JSON.stringify(tasks));
        return true;
    } catch (error) {
        console.error("Could not save tasks:", error);
        showToast("Could not save tasks. Check browser storage.", "error");
        return false;
    }
}

// ---------- Date Validation ----------

function isValidDate(dateString) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
        return false;
    }

    const date = new Date(dateString + "T00:00:00");

    return (
        !Number.isNaN(date.getTime()) &&
        date.getFullYear() === Number(dateString.slice(0, 4)) &&
        date.getMonth() + 1 === Number(dateString.slice(5, 7)) &&
        date.getDate() === Number(dateString.slice(8, 10))
    );
}

// ---------- Registration ----------

const registerForm = document.getElementById("registerForm");

if (registerForm) {
    registerForm.addEventListener("submit", function (event) {
        event.preventDefault();

        const nameInput = document.getElementById("name");
        const emailInput = document.getElementById("email");
        const passwordInput = document.getElementById("password");
        const confirmPasswordInput =
            document.getElementById("confirmPassword");

        if (
            !nameInput ||
            !emailInput ||
            !passwordInput ||
            !confirmPasswordInput
        ) {
            alert("Registration fields are missing. Check register.html.");
            return;
        }

        const name = nameInput.value.trim();
        const email = emailInput.value.trim().toLowerCase();
        const password = passwordInput.value;
        const confirmPassword = confirmPasswordInput.value;

        if (!name || !email || !password) {
            alert("Please fill in all required fields.");
            return;
        }

        if (password !== confirmPassword) {
            alert("Passwords do not match!");
            return;
        }

        const users = getUsers();

        const existingUser = users.find(
            user => (user.email || "").toLowerCase() === email
        );

        if (existingUser) {
            alert("An account with this email already exists!");
            return;
        }

        users.push({
            id: Date.now(),
            name,
            email,
            password
        });

        localStorage.setItem("users", JSON.stringify(users));

        alert("Registration successful! Please login.");
        window.location.href = "login.html";
    });
}

// ---------- Login ----------

const loginForm = document.getElementById("loginForm");

if (loginForm) {
    loginForm.addEventListener("submit", function (event) {
        event.preventDefault();

        const emailInput = document.getElementById("loginEmail");
        const passwordInput = document.getElementById("loginPassword");

        if (!emailInput || !passwordInput) {
            alert("Login fields are missing. Check login.html.");
            return;
        }

        const email = emailInput.value.trim().toLowerCase();
        const password = passwordInput.value;

        const user = getUsers().find(
            item =>
                (item.email || "").toLowerCase() === email &&
                item.password === password
        );

        if (!user) {
            alert("Invalid email or password!");
            return;
        }

        localStorage.setItem("currentUser", JSON.stringify(user));

        alert("Login successful!");
        window.location.href = "dashboard.html";
    });
}

// ---------- Dashboard Authentication ----------

const taskList = document.getElementById("taskList");
const currentUser = getCurrentUser();

if (taskList && !currentUser) {
    window.location.href = "login.html";
}

// ---------- Show Logged-in User ----------

const userNameElement = document.getElementById("userName");

if (userNameElement && currentUser) {
    userNameElement.textContent = currentUser.name || "Student";
}

// ---------- Add Task ----------

const taskForm = document.getElementById("taskForm");

if (taskForm && currentUser) {
    taskForm.addEventListener("submit", function (event) {
        event.preventDefault();

        const titleInput = document.getElementById("taskTitle");
        const descriptionInput =
            document.getElementById("taskDescription");
        const priorityElement =
            document.getElementById("taskPriority");
        const dueDateElement =
            document.getElementById("taskDueDate");

        if (!titleInput || !descriptionInput) {
            alert("Task fields are missing. Check dashboard.html.");
            return;
        }

        const title = titleInput.value.trim();
        const description = descriptionInput.value.trim();
        const priority = priorityElement
            ? priorityElement.value
            : "Medium";
        const dueDate = dueDateElement
            ? dueDateElement.value
            : "";

        if (!title) {
            alert("Please enter a task title.");
            titleInput.focus();
            return;
        }

        if (dueDate && !isValidDate(dueDate)) {
            alert("Please enter a valid due date.");
            return;
        }

        const tasks = getTasks();

        const newTask = {
            id: Date.now(),
            userEmail: currentUser.email,
            title,
            description,
            priority: priority || "Medium",
            dueDate,
            completed: false,
            createdAt: new Date().toISOString()
        };

        tasks.push(newTask);

        if (!saveTasks(tasks)) {
            return;
        }

        taskForm.reset();

        if (priorityElement) {
            priorityElement.value = "Medium";
        }

        displayTasks();
        showToast("Task added successfully!");
    });
}

// ---------- Display Tasks ----------

function displayTasks() {
    if (!taskList || !currentUser) {
        return;
    }

    const allUserTasks = getTasks().filter(
        task => task.userEmail === currentUser.email
    );

    updateStatistics(allUserTasks);

    const searchElement = document.getElementById("searchTask");
    const searchText = searchElement
        ? searchElement.value.trim().toLowerCase()
        : "";

    const filterElement = document.getElementById("taskFilter");
    const selectedFilter = filterElement
        ? filterElement.value
        : "All";

    const priorityFilterElement =
        document.getElementById("priorityFilter");

    const selectedPriority = priorityFilterElement
        ? priorityFilterElement.value
        : "All";

    let visibleTasks = allUserTasks.filter(task => {
        const title = (task.title || "").toLowerCase();
        const description = (task.description || "").toLowerCase();

        return (
            title.includes(searchText) ||
            description.includes(searchText)
        );
    });

    if (selectedFilter === "Pending") {
        visibleTasks = visibleTasks.filter(
            task => !task.completed
        );
    } else if (selectedFilter === "Completed") {
        visibleTasks = visibleTasks.filter(
            task => task.completed
        );
    }

    if (selectedPriority !== "All") {
        visibleTasks = visibleTasks.filter(
            task => (task.priority || "Medium") === selectedPriority
        );
    }

    taskList.replaceChildren();

    if (visibleTasks.length === 0) {
        const message = document.createElement("p");
        message.className = "no-tasks";

        message.textContent = allUserTasks.length === 0
            ? "No tasks yet. Add your first task!"
            : "No tasks match your search or filter.";

        taskList.appendChild(message);
        return;
    }

    visibleTasks.sort((a, b) => {
        if (Boolean(a.completed) !== Boolean(b.completed)) {
            return Number(Boolean(a.completed)) -
                Number(Boolean(b.completed));
        }

        return Number(b.id) - Number(a.id);
    });

    visibleTasks.forEach(task => {
        const card = document.createElement("div");
        card.className = "task-card";

        if (task.completed) {
            card.classList.add("completed");
        }

        const content = document.createElement("div");
        content.className = "task-content";

        const title = document.createElement("h3");
        title.textContent = task.title || "Untitled Task";

        const description = document.createElement("p");
        description.textContent =
            task.description || "No description provided.";

        // Priority
        const priority = document.createElement("p");
        const priorityLevel = (
            task.priority || "Medium"
        ).toLowerCase();

        priority.className = "task-priority " + priorityLevel;
        priority.textContent =
            "Priority: " + (task.priority || "Medium");

        // Due Date and Status Labels
        const dueDateElement = document.createElement("p");
        dueDateElement.className = "task-due-date";

        if (!task.dueDate) {
            dueDateElement.textContent = "Due Date: Not set";
        } else if (!isValidDate(task.dueDate)) {
            dueDateElement.textContent = "Due Date: Invalid date";
        } else {
            const today = new Date();

            const todayString =
                today.getFullYear() + "-" +
                String(today.getMonth() + 1).padStart(2, "0") + "-" +
                String(today.getDate()).padStart(2, "0");

            const formattedDueDate = new Date(
                task.dueDate + "T00:00:00"
            ).toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric"
            });

            dueDateElement.textContent =
                "Due Date: " + formattedDueDate;

            if (task.completed) {
                dueDateElement.classList.add("due-completed");
                dueDateElement.textContent += " — Completed";
            } else if (task.dueDate < todayString) {
                dueDateElement.classList.add("due-overdue");
                dueDateElement.textContent += " — OVERDUE";
            } else if (task.dueDate === todayString) {
                dueDateElement.classList.add("due-today");
                dueDateElement.textContent += " — DUE TODAY";
            } else {
                dueDateElement.classList.add("due-upcoming");
                dueDateElement.textContent += " — Upcoming";
            }
        }

        const status = document.createElement("span");
        status.className = "task-status";
        status.textContent = task.completed
            ? "Completed"
            : "Pending";

        content.append(
            title,
            description,
            priority,
            dueDateElement,
            status
        );

        const actions = document.createElement("div");
        actions.className = "task-actions";

        // Complete / Undo Button
        const completeButton = document.createElement("button");
        completeButton.type = "button";
        completeButton.textContent = task.completed
            ? "Undo"
            : "Complete";

        completeButton.addEventListener("click", function () {
            completeTask(task.id);
        });

        // Edit Button
        const editButton = document.createElement("button");
        editButton.type = "button";
        editButton.textContent = "Edit";

        editButton.addEventListener("click", function () {
            editTask(task.id);
        });

        // Delete Button
        const deleteButton = document.createElement("button");
        deleteButton.type = "button";
        deleteButton.textContent = "Delete";

        deleteButton.addEventListener("click", function () {
            deleteTask(task.id);
        });

        actions.append(
            completeButton,
            editButton,
            deleteButton
        );

        card.append(content, actions);
        taskList.appendChild(card);
    });
}

// ---------- Update Statistics ----------

function updateStatistics(tasks) {
    const totalElement = document.getElementById("totalTasks");
    const completedElement = document.getElementById("completedTasks");
    const pendingElement = document.getElementById("pendingTasks");

    const completedCount = tasks.filter(
        task => task.completed
    ).length;

    const pendingCount = tasks.length - completedCount;

    if (totalElement) {
        totalElement.textContent = tasks.length;
    }

    if (completedElement) {
        completedElement.textContent = completedCount;
    }

    if (pendingElement) {
        pendingElement.textContent = pendingCount;
    }

    const percentage = tasks.length === 0
        ? 0
        : Math.round((completedCount / tasks.length) * 100);

    const progressPercentage = document.getElementById(
        "progressPercentage"
    );
    const progressFill = document.getElementById("taskProgressFill");
    const progressBar = document.getElementById("taskProgressBar");
    const progressCaption = document.getElementById("progressCaption");

    if (progressPercentage) {
        progressPercentage.textContent = `${percentage}%`;
    }

    if (progressFill) {
        progressFill.style.width = `${percentage}%`;
    }

    if (progressBar) {
        progressBar.setAttribute("aria-valuenow", percentage);
    }

    if (progressCaption) {
        progressCaption.textContent = tasks.length === 0
            ? "Add your first task to start your progress."
            : `${completedCount} of ${tasks.length} tasks completed`;
    }
}

// ---------- Complete / Undo Task ----------

function completeTask(taskId) {
    if (!currentUser) {
        return;
    }

    const tasks = getTasks();

    const task = tasks.find(
        item =>
            String(item.id) === String(taskId) &&
            item.userEmail === currentUser.email
    );

    if (!task) {
        showToast("Task not found.", "error");
        return;
    }

    task.completed = !task.completed;

    if (!saveTasks(tasks)) {
        return;
    }

    displayTasks();

    showToast(
        task.completed
            ? "Task completed successfully!"
            : "Task marked as pending."
    );
}

// ---------- Edit Task ----------

function editTask(taskId) {
    if (!currentUser) {
        return;
    }

    const tasks = getTasks();

    const task = tasks.find(
        item =>
            String(item.id) === String(taskId) &&
            item.userEmail === currentUser.email
    );

    if (!task) {
        showToast("Task not found.", "error");
        return;
    }

    const newTitle = prompt(
        "Edit task title:",
        task.title || ""
    );

    if (newTitle === null) {
        return;
    }

    if (!newTitle.trim()) {
        alert("Task title cannot be empty.");
        return;
    }

    const newDescription = prompt(
        "Edit task description:",
        task.description || ""
    );

    if (newDescription === null) {
        return;
    }

    const newPriority = prompt(
        "Enter priority: Low, Medium, or High",
        task.priority || "Medium"
    );

    if (newPriority === null) {
        return;
    }

    const priorityMap = {
        low: "Low",
        medium: "Medium",
        high: "High"
    };

    const normalizedPriority = newPriority.trim().toLowerCase();

    if (!priorityMap[normalizedPriority]) {
        alert("Priority must be Low, Medium, or High.");
        return;
    }

    const newDueDate = prompt(
        "Enter due date as YYYY-MM-DD, or leave blank:",
        task.dueDate || ""
    );

    if (newDueDate === null) {
        return;
    }

    const dueDate = newDueDate.trim();

    if (dueDate && !isValidDate(dueDate)) {
        alert("Please enter a valid date in YYYY-MM-DD format.");
        return;
    }

    task.title = newTitle.trim();
    task.description = newDescription.trim();
    task.priority = priorityMap[normalizedPriority];
    task.dueDate = dueDate;

    if (!saveTasks(tasks)) {
        return;
    }

    displayTasks();
    showToast("Task updated successfully!");
}

// ---------- Delete Task ----------

function deleteTask(taskId) {
    if (!currentUser) {
        showToast("Please log in first.", "error");
        return;
    }

    const confirmed = confirm(
        "Are you sure you want to delete this task?"
    );

    if (!confirmed) {
        return;
    }

    const tasks = getTasks();

    const updatedTasks = tasks.filter(
        task => !(
            String(task.id) === String(taskId) &&
            task.userEmail === currentUser.email
        )
    );

    if (updatedTasks.length === tasks.length) {
        showToast("Task not found or could not be deleted.", "error");
        return;
    }

    if (!saveTasks(updatedTasks)) {
        return;
    }

    displayTasks();
    showToast("Task deleted successfully!");
}

// ---------- Search and Filters ----------

const searchTaskElement = document.getElementById("searchTask");
const taskFilterElement = document.getElementById("taskFilter");
const priorityFilterElement = document.getElementById("priorityFilter");

if (searchTaskElement) {
    searchTaskElement.addEventListener("input", displayTasks);
}

if (taskFilterElement) {
    taskFilterElement.addEventListener("change", displayTasks);
}

if (priorityFilterElement) {
    priorityFilterElement.addEventListener("change", displayTasks);
}

// ---------- Initial Dashboard Render ----------

if (taskList && currentUser) {
    displayTasks();
}

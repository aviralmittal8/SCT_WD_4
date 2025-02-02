// Clock and Greeting
function updateClockAndGreeting() {
    const clockElement = document.getElementById("clock");
    const greetingElement = document.getElementById("greeting");
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const seconds = now.getSeconds();
    const timeString = `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;

    if (clockElement) clockElement.textContent = timeString;

    let greeting = "Hello";
    const userName = localStorage.getItem("userName");
    if (hours < 12) greeting = "Good Morning";
    else if (hours < 18) greeting = "Good Afternoon";
    else greeting = "Good Evening";

    if (greetingElement) {
        greetingElement.textContent = `${greeting}, ${userName || 'User'}!`;
    }
}
setInterval(updateClockAndGreeting, 1000);

// Global variables
let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
let showingCompleted = false;
let showingAll = true;
let calendar;

// Save Tasks to Local Storage (with error handling)
function safeStorageOperation(operation) {
    try {
        operation();
    } catch (error) {
        console.error('localStorage operation failed:', error);
        alert('Error saving your data. Check storage availability.');
    }
}

function saveTasksToLocalStorage() {
    safeStorageOperation(() => {
        localStorage.setItem("tasks", JSON.stringify(tasks));
    });
}

// Create Task Element
function createTaskElement(task, allowComplete = true, allowDelete = false) {
    const taskElement = document.createElement("div");
    taskElement.classList.add("task-item");

    const taskInfo = document.createElement("div");
    taskInfo.innerHTML = `
        <strong>${task.name}</strong> <br>
        <small>${task.description}</small> <br>
        <small>From: ${task.fromDate} To: ${task.toDate}</small>
    `;

    taskElement.appendChild(taskInfo);

    if (allowComplete) {
        const completeBtn = document.createElement("button");
        completeBtn.textContent = task.completed ? "Completed ✅" : "Mark as Completed";
        completeBtn.classList.add(task.completed ? "completed" : "complete-btn");
        completeBtn.addEventListener("click", () => toggleTaskCompletion(task));
        taskElement.appendChild(completeBtn);
    }

    if (allowDelete) {
        const deleteBtn = document.createElement("button");
        deleteBtn.textContent = "Delete ❌";
        deleteBtn.classList.add("delete-btn");
        deleteBtn.addEventListener("click", () => deleteTask(task.id));
        taskElement.appendChild(deleteBtn);
    }

    return taskElement;
}

// Display Tasks
function displayTasks() {
    const taskListRight = document.getElementById("task-list-right");
    if (!taskListRight) return;

    taskListRight.innerHTML = "";
    const todayDate = new Date().toISOString().split("T")[0];

    const filteredTasks = showingAll
        ? tasks
        : tasks.filter(task =>
            showingCompleted ? task.completed : !task.completed &&
            todayDate >= task.fromDate && todayDate <= task.toDate
        );

    filteredTasks.forEach(task => {
        const taskElement = createTaskElement(task, true, true);
        taskListRight.appendChild(taskElement);
    });
}

// Load Tasks for Date Range
function loadTasksForDate(date) {
    const taskListLeft = document.getElementById("task-list-left");
    if (!taskListLeft) return;

    taskListLeft.innerHTML = "<p>Loading tasks...</p>"; // Debug message

    const tasksForDate = tasks.filter(task => date >= task.fromDate && date <= task.toDate);

    taskListLeft.innerHTML = ""; // Clear after filtering

    if (tasksForDate.length === 0) {
        taskListLeft.innerHTML = "<p>No tasks found for this date.</p>";
        return;
    }

    tasksForDate.forEach(task => {
        const taskElement = createTaskElement(task, false, true);
        taskListLeft.appendChild(taskElement);
    });
}


// Toggle Task Completion
function toggleTaskCompletion(task) {
    task.completed = !task.completed;
    saveTasksToLocalStorage();
    displayTasks();
    loadTasksForDate(calendar.selectedDates[0]?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0]);
}

// Delete Task
function deleteTask(taskId) {
    tasks = tasks.filter(task => task.id !== taskId);
    saveTasksToLocalStorage();
    displayTasks();
    loadTasksForDate(calendar.selectedDates[0]?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0]);
}

// Add Task Form Submission
document.addEventListener("DOMContentLoaded", function () {
    document.getElementById("task-form")?.addEventListener("submit", function (e) {
        e.preventDefault();

        const taskName = document.getElementById("task-name").value;
        const taskDescription = document.getElementById("task-description").value;
        const fromDate = document.getElementById("from-date").value;
        const toDate = document.getElementById("to-date").value;

        if (new Date(toDate) < new Date(fromDate)) {
            alert("End date cannot be before start date!");
            return;
        }

        const newTask = {
            id: new Date().getTime(),
            name: taskName,
            description: taskDescription,
            fromDate,
            toDate,
            completed: false,
        };

        tasks.push(newTask);
        saveTasksToLocalStorage();
        displayTasks();
        loadTasksForDate(fromDate);
        document.getElementById("task-form").reset();
    });

    // Initialize Calendar
    calendar = flatpickr("#calendar", {
        inline: true,
        onChange: function (selectedDates, dateStr) {
            console.log("Selected Date:", dateStr); // Debugging: Check date selection
            loadTasksForDate(dateStr);
        },
    });
});

// Username Check
function checkAndPromptUsername() {
    if (!localStorage.getItem("userName")) {
        const userName = prompt("Please enter your name") || "User";
        localStorage.setItem("userName", userName);
    }
}

// Set minimum dates for inputs
function setMinDates() {
    const today = new Date().toISOString().split('T')[0];
    const fromDateInput = document.getElementById('from-date');
    const toDateInput = document.getElementById('to-date');

    if (fromDateInput && toDateInput) {
        fromDateInput.min = today;
        toDateInput.min = today;

        fromDateInput.addEventListener('change', (e) => {
            toDateInput.min = e.target.value;
            if (toDateInput.value && toDateInput.value < e.target.value) {
                toDateInput.value = e.target.value;
            }
        });
    }
}

// Initialize
function initialize() {
    checkAndPromptUsername();
    setMinDates();
    updateClockAndGreeting();
    displayTasks();

    const today = new Date().toISOString().split('T')[0];
    loadTasksForDate(today);

    if (calendar) {
        calendar.setDate(today);
    }

    window.addEventListener('storage', storageHandler);
}

// Handle Storage Event
function storageHandler(e) {
    if (e.key === 'tasks') {
        tasks = JSON.parse(localStorage.getItem('tasks')) || [];
        displayTasks();
        loadTasksForDate(calendar.selectedDates[0]?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0]);
    }
}

// Visibility Change Handling
document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
        updateClockAndGreeting();
        displayTasks();
        loadTasksForDate(calendar.selectedDates[0]?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0]);
    }
});

// Cleanup Event Listeners on Unload
window.addEventListener('beforeunload', () => {
    document.removeEventListener('visibilitychange', () => {});
    window.removeEventListener('storage', storageHandler);
});

// Reset App - Clears localStorage and reloads the page
document.getElementById("reset-app")?.addEventListener("click", function () {
    if (confirm("Are you sure you want to reset the app? All tasks will be lost!")) {
        localStorage.clear(); // Clears all stored data
        location.reload(); // Reloads the page to reset UI
    }
});

// Call initialize when the page loads
document.addEventListener('DOMContentLoaded', initialize);

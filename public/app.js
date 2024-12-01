// Firebase Configuration and Initialization (handled by firebase init)
const auth = firebase.auth();
const db = firebase.firestore();
// Simple Base64 Encode
function encodeTask(task) {
    return btoa(task); // Encode task to Base64
}

// Simple Base64 Decode
function decodeTask(encodedTask) {
    return atob(encodedTask); // Decode Base64 task
}
// Log current authentication state
auth.onAuthStateChanged((user) => {
    if (user) {
        console.log("User is logged in:", user.email);
        document.getElementById('auth-container').style.display = "none";
        document.getElementById('todo-container').style.display = "block";

        // Fetch tasks for the logged-in user
        fetchTasks();
    } else {
        console.log("No user is logged in");
        document.getElementById('auth-container').style.display = "block";
        document.getElementById('todo-container').style.display = "none";
    }
});

// Input validation functions
function validateTaskInput(task) {
    if (!task || task.trim() === "") {
        alert("Task cannot be empty.");
        return false;
    }

    if (task.length > 200) {
        alert("Task cannot exceed 200 characters.");
        return false;
    }

    const regex = /^[a-zA-Z0-9\s.,'!?()&-]+$/; // Allow alphanumeric and common punctuation
    if (!regex.test(task)) {
        alert("Task contains invalid characters.");
        return false;
    }

    return true;
}

function validateEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // Basic email regex
    if (!regex.test(email)) {
        alert("Invalid email address.");
        return false;
    }
    return true;
}

// Input sanitization function
function sanitizeInput(input) {
    const div = document.createElement('div');
    div.appendChild(document.createTextNode(input));
    return div.innerHTML; // Returns escaped HTML
}

// Fetch tasks for the logged-in user
function fetchTasks() {
    const userId = auth.currentUser.uid;

    db.collection('todos')
        .where("userId", "==", userId)
        .onSnapshot((snapshot) => {
            const todoList = document.getElementById('todo-list');
            todoList.innerHTML = ''; // Clear list before rendering

            snapshot.forEach((doc) => {
                const taskData = doc.data();

                // Decode the task before displaying
                const decodedTask = decodeTask(taskData.task);

                const todoItem = document.createElement('li');
                todoItem.textContent = decodedTask;
                todoList.appendChild(todoItem);

                // Add delete button
                const deleteButton = document.createElement('button');
                deleteButton.textContent = "Delete";
                deleteButton.addEventListener('click', () => {
                    db.collection('todos').doc(doc.id).delete()
                        .then(() => console.log("Task deleted successfully"))
                        .catch((error) => console.error("Error deleting task:", error.message));
                });
                todoItem.appendChild(deleteButton);

                // Add modify button
                const modifyButton = document.createElement('button');
                modifyButton.textContent = "Modify";
                modifyButton.addEventListener('click', () => {
                    const newTask = prompt("Enter the updated task:", decodedTask);
                    if (newTask && validateTaskInput(newTask)) {
                        const encodedTask = encodeTask(newTask.trim());
                        db.collection('todos').doc(doc.id).update({
                            task: encodedTask,
                        })
                            .then(() => console.log("Task updated successfully"))
                            .catch((error) => console.error("Error updating task:", error.message));
                    }
                });
                todoItem.appendChild(modifyButton);
            });
        });
}


// Sign-Up Logic with validation and logging
const signupForm = document.getElementById('signup-form');
signupForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;

    if (!validateEmail(email)) return;

    auth.createUserWithEmailAndPassword(email, password)
        .then((userCredential) => {
            console.log("User signed up successfully:", userCredential.user);
            alert("Sign-up successful!");
        })
        .catch((error) => {
            console.error("Error during sign-up:", error.message);
            alert(`Sign-up error: ${error.message}`);
        });
});

// Login Logic with validation and logging
const loginForm = document.getElementById('login-form');
loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    if (!validateEmail(email)) return;

    auth.signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
            console.log("User logged in successfully:", userCredential.user);
            alert("Login successful!");
        })
        .catch((error) => {
            console.error("Error during login:", error.message);
            alert(`Login error: ${error.message}`);
        });
});

// Logout functionality
document.getElementById('logout-button').addEventListener('click', () => {
    auth.signOut()
        .then(() => {
            console.log("User logged out successfully");
            alert("Logout successful!");
        })
        .catch((error) => {
            console.error("Error during logout:", error.message);
        });
});

// Adding new tasks to Firestore with validation and sanitization
const todoForm = document.getElementById('todo-form');
todoForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const task = document.getElementById('todo-input').value;

    if (!validateTaskInput(task)) return;

    const userId = auth.currentUser.uid;

    // Encode the task before saving
    const encodedTask = encodeTask(task.trim());

    db.collection('todos').add({
        task: encodedTask, // Store the encoded task
        userId: userId,
        completed: false,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    })
        .then(() => {
            console.log("Encoded task added successfully");
            todoForm.reset();
        })
        .catch((error) => {
            console.error("Error adding encoded task:", error.message);
            alert(`Error adding task: ${error.message}`);
        });
});


const appCheck = firebase.appCheck();
appCheck.activate('6LeV_Y4qAAAAAAxN5xg6VSHgshKCOnZHw29nBDSp', true);
db.collection('todos').get().then((snapshot) => {
    snapshot.forEach((doc) => {
        db.collection('todos').doc(doc.id).update({ verified: true });
    });
});
const messaging = firebase.messaging();

// Request notification permissions
messaging.requestPermission()
    .then(() => {
        console.log("Notification permission granted.");
        return messaging.getToken();
    })
    .then((token) => {
        console.log("FCM Token:", token);
        // Save token to Firestore for the logged-in user
        if (auth.currentUser) {
            db.collection('users').doc(auth.currentUser.uid).set(
                { fcmToken: token },
                { merge: true }
            );
        }
    })
    .catch((error) => {
        console.error("Error requesting notification permission:", error);
    });

// Handle foreground messages
messaging.onMessage((payload) => {
    console.log("Message received:", payload);
    alert(`${payload.notification.title}: ${payload.notification.body}`);
});

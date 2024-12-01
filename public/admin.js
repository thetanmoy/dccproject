// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyDq9BnmumHmg11AIuTSMSoXw024DKpQg9U",
    authDomain: "cloud-based-to-do-lists.firebaseapp.com",
    projectId: "cloud-based-to-do-lists",
    storageBucket: "cloud-based-to-do-lists.appspot.com",
    messagingSenderId: "1050553276520",
    appId: "1:1050553276520:web:5a87e9ac149fb558c403dd",
    measurementId: "G-PMRYC0EG49"
};

// Initialize Firebase App
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

// Firebase Services
const auth = firebase.auth();
const db = firebase.firestore();

// Monitor Authentication State
auth.onAuthStateChanged((user) => {
    if (user) {
        if (user.email === "iammanish321@gmail.com") {
            loadUsers();
        } else {
            alert("Access denied: You are not an admin.");
            window.location.href = "index.html";
        }
    } else {
        alert("No user is logged in.");
        window.location.href = "index.html";
    }
});

// Load Users
function loadUsers() {
    const userTable = document.getElementById('user-table');
    userTable.innerHTML = ''; // Clear the table

    db.collection('users').get().then((snapshot) => {
        snapshot.forEach((doc) => {
            const userData = doc.data();
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${userData.email}</td>
                <td>${userData.isAdmin ? "Admin" : "User"}</td>
                <td>
                    <button class="btn btn-danger btn-sm" onclick="deleteUser('${doc.id}')">Delete</button>
                </td>
            `;
            userTable.appendChild(row);
        });
    }).catch((error) => {
        console.error("Error loading users:", error);
    });
}

// Delete User
function deleteUser(userId) {
    db.collection('users').doc(userId).delete().then(() => {
        console.log("User deleted");
        loadUsers(); // Refresh the table
    }).catch((error) => {
        console.error("Error deleting user:", error);
    });
}

// Logout
document.getElementById('logout-button').addEventListener('click', () => {
    auth.signOut().then(() => {
        console.log("Logged out");
        window.location.href = "index.html";
    }).catch((error) => {
        console.error("Logout error:", error);
    });
});

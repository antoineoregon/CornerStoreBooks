/**
 * LOGIN FUNCTION
 */
async function loginUser(username, password) {
    try {
        const response = await fetch('http://localhost:3000/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (data.success) {
            localStorage.setItem('userId', data.user.id); 
            
            const path = window.location.pathname;
            if (path.includes('index.html') || path === '/' || !path.includes('/pages/')) {
                window.location.href = 'pages/home.html';
            } else {
                window.location.href = 'home.html';
            }
        } else {
            alert("Login Failed: " + (data.message || "Invalid credentials"));
        }
    } catch (error) {
        console.error("Login Error:", error);
        alert("Could not connect to the server. Is your backend running on port 3000?");
    }
}

/**
 * SIGN-UP FUNCTION
 */
async function signUpUser(username, password, genres) {
    try {
        const response = await fetch('http://localhost:3000/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password, genres })
        });

        const data = await response.json();

        if (data.success) {
            alert("Account created! You can now log in.");
            window.location.href = '../index.html'; 
        } else {
            alert("Error: " + data.message);
        }
    } catch (error) {
        console.error("Signup Error:", error);
    }
}

/**
 * DISPLAY BOOKS FUNCTION (Home Page)
 */
async function displayBooks() {
    const grid = document.querySelector('.book-grid');
    if (!grid) return;

    try {
        const response = await fetch('http://localhost:3000/books');
        if (!response.ok) throw new Error("Failed to fetch books");
        
        const books = await response.json();
        grid.innerHTML = ''; 

        if (books.length === 0) {
            grid.innerHTML = '<p>No books available in the catalog.</p>';
            return;
        }

        books.forEach(book => {
            const card = document.createElement('div');
            card.className = 'book-card';
            card.innerHTML = `
                <h3>${book.title}</h3>
                <p><strong>Author:</strong> ${book.author}</p>
                <p><strong>Genre:</strong> ${book.genre}</p>
                <button onclick="addToList(${book.id})">Add to My List</button>
            `;
            grid.appendChild(card);
        });
    } catch (error) {
        console.error("Error loading books:", error);
        grid.innerHTML = '<p style="color: red;">Failed to load books. Ensure your backend server is running.</p>';
    }
}

/**
 * ADD TO LIST FUNCTION
 */
async function addToList(bookId) {
    const userId = localStorage.getItem('userId');
    
    if (!userId) {
        alert("Please log in first!");
        window.location.href = '../index.html';
        return;
    }

    try {
        const response = await fetch('http://localhost:3000/add-to-list', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: parseInt(userId), bookId: bookId })
        });

        const data = await response.json();
        if (data.success) {
            alert("Book added to your list!");
        } else {
            alert("Failed: " + data.message);
        }
    } catch (error) {
        console.error("Add to List Error:", error);
    }
}

/**
 * DISPLAY MY LIST (Settings/My List Page)
 */
async function displayMyList() {
    const grid = document.getElementById('my-saved-books') || document.querySelector('.book-grid');
    const userId = localStorage.getItem('userId');

    if (!grid || !userId) return;

    try {
        // 1. Get User Data to see their saved IDs
        const userResp = await fetch(`http://localhost:3000/user/${userId}`);
        const userData = await userResp.json();
        const savedIds = userData.myList || [];

        // 2. Get All Books Catalog
        const bookResp = await fetch('http://localhost:3000/books');
        const allBooks = await bookResp.json();

        grid.innerHTML = ''; 

        if (savedIds.length === 0) {
            grid.innerHTML = '<p>Your list is empty. Go add some books!</p>';
            return;
        }

        // 3. Filter catalog to show only saved books
        const myBooks = allBooks.filter(book => savedIds.includes(book.id));

        myBooks.forEach(book => {
            const card = document.createElement('div');
            card.className = 'book-card';
            card.innerHTML = `
                <h3>${book.title}</h3>
                <p><strong>Author:</strong> ${book.author}</p>
                <button onclick="removeFromList(${book.id})" style="background-color: blue; color: white;">Remove</button>
            `;
            grid.appendChild(card);
        });
    } catch (error) {
        console.error("Error loading My List:", error);
        grid.innerHTML = '<p>Error loading your saved books.</p>';
    }
}

/**
 * DELETE ACCOUNT FUNCTION
 */
async function deleteAccount() {
    const userId = localStorage.getItem('userId');
    if (!userId) return;

    // 1. Confirm with the user
    const confirmed = confirm("By deleting your account you will lose access to your list and saved preferences permanently.");
    
    if (confirmed) {
        try {
            // 2. Send the DELETE request to the User Service
            const response = await fetch(`http://localhost:3000/delete-account/${userId}`, {
                method: 'DELETE'
            });

            const data = await response.json();

            if (data.success) {
                alert("Your account has been deleted.");
                // 3. Clear local storage and send them back to the login page
                localStorage.removeItem('userId');
                window.location.href = '../index.html';
            } else {
                alert("Failed to delete account: " + data.message);
            }
        } catch (error) {
            console.error("Delete Account Error:", error);
            alert("An error occurred while trying to delete your account.");
        }
    }
}

/**
 * PAGE ROUTER / INITIALIZATION
 */
console.log("Script execution started...");

window.onload = () => {
    const path = window.location.pathname.toLowerCase();
    console.log("Path detected:", path);
    
    if (path.includes('home')) {
        displayBooks();
    } else if (path.includes('mylist')) { // Changed from 'settings'
        displayMyList();
    }
};

// Also ensure you have a logout function in app.js if not already there
function logout() {
    localStorage.removeItem('userId');
    window.location.replace('../index.html');
}
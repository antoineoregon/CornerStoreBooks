/**
 * Authenticate user and redirect to the home page
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
            
            // Redirect logic based on current directory
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
        alert("Could not connect to the server. Please ensure the backend is running.");
    }
}

/**
 * Register a new user and log them in automatically
 */
async function signUpUser(username, password, genres) {
    try {
        const response = await fetch('http://localhost:3000/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password, genres })
        });

        const data = await response.json();

        if (data.success && data.user) {
            localStorage.setItem('userId', data.user.id);
            localStorage.setItem('username', data.user.username);

            alert(`Welcome, ${data.user.username}! Your account has been created.`);

            const path = window.location.pathname;
            if (path.includes('index.html') || path === '/' || !path.includes('/pages/')) {
                window.location.href = 'pages/home.html';
            } else {
                window.location.href = 'home.html';
            }
        } else {
            alert("Sign up failed: " + (data.message || "Please check your details and try again."));
        }
    } catch (error) {
        console.error("Sign up error:", error);
        alert("Connection error. Please check your server status.");
    }
}

/**
 * Fetch and display the book catalog, excluding skipped books
 */
async function displayBooks() {
    // Target ONLY the grid inside #catalog-section
    const grid = document.querySelector('#catalog-section .book-grid');
    const userId = localStorage.getItem('userId');
    if (!grid) return;

    try {
        const userResp = await fetch(`http://localhost:3000/user/${userId}`);
        const userData = await userResp.json();
        const skippedIds = userData.skippedBooks || [];

        const response = await fetch('http://localhost:3000/books');
        const allBooks = await response.json();

        // Filter out skipped books
        const visibleBooks = allBooks.filter(book => !skippedIds.includes(book.id));

        grid.innerHTML = ''; // This will now ONLY clear the catalog grid
        visibleBooks.forEach(book => {
            const card = document.createElement('div');
            card.className = 'book-card';
            card.ondblclick = () => addToList(book.id);
            card.innerHTML = `
                <h3>${book.title}</h3>
                <p>${book.author}</p>
                <button onclick="addToList(${book.id})">Add</button>
                <button onclick="skipBook(${book.id})" style="background:#ccc;">Skip</button>
            `;
            grid.appendChild(card);
        });
    } catch (e) { console.error("Error displaying books:", e); }
}

/**
 * Add a specific book to the user's saved list
 */
async function addToList(bookId) {
    const userId = localStorage.getItem('userId');
    
    if (!userId) {
        alert("Please log in first to start saving books!");
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
            alert("Success! This book has been added to your list.");
        } else {
            alert("Note: " + data.message);
        }
    } catch (error) {
        console.error("Add to List Error:", error);
    }
}

/**
 * Display only the books saved by the current user
 */
async function displayMyList() {
    const grid = document.getElementById('my-saved-books') || document.querySelector('.book-grid');
    const userId = localStorage.getItem('userId');

    if (!grid || !userId) return;

    try {
        const userResp = await fetch(`http://localhost:3000/user/${userId}`);
        const userData = await userResp.json();
        const savedIds = userData.myList || [];

        const bookResp = await fetch('http://localhost:3000/books');
        const allBooks = await bookResp.json();

        grid.innerHTML = ''; 

        if (savedIds.length === 0) {
            grid.innerHTML = '<p>Your list is empty. Go add some books!</p>';
            return;
        }

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
 * Hide a book from the user's view permanently
 */
async function skipBook(bookId) {
    const confirmSkip = confirm("Are you sure you want to skip this book? It will be hidden from your account.");
    if (!confirmSkip) return;

    const userId = localStorage.getItem('userId');
    try {
        const response = await fetch('http://localhost:3000/skip-book', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: parseInt(userId), bookId: bookId })
        });
        
        const data = await response.json();
        if (data.success) {
            displayBooks(); 
        }
    } catch (error) {
        console.error("Skip Error:", error);
        alert("Could not hide the book at this time.");
    }
}

/**
 * Remove a book from the user's saved list
 */
async function removeFromList(bookId) {
    const userId = localStorage.getItem('userId');
    const confirmed = confirm("Are you sure you want to remove this book from your list?");
    if (!confirmed) return;

    try {
        const response = await fetch('http://localhost:3000/remove-from-list', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: parseInt(userId), bookId: bookId })
        });

        const data = await response.json();
        if (data.success) {
            displayMyList();
        } else {
            alert("Could not remove the book: " + data.message);
        }
    } catch (error) {
        console.error("Remove error:", error);
        alert("Connection error. Please try again later.");
    }
}

/**
 * Fetch and display recommended books specifically
 */
async function displayRecommendations() {
    const grid = document.getElementById('recommendations-grid'); 
    const userId = localStorage.getItem('userId');
    
    if (!grid || !userId) return;

    try {
        const response = await fetch(`http://localhost:3005/recommendations/${userId}`);
        const data = await response.json();

        // Safety Check: If data is an error object, it's not an array
        if (!Array.isArray(data)) {
            console.error("Server returned an error instead of a list:", data);
            throw new Error(data.error || "Server Error");
        }

        const recommendedBooks = data;

        // Inside displayRecommendations() in app.js
// ... after recommendedBooks = data;

        if (recommendedBooks.length > 0) {
            const itemIds = recommendedBooks.map(b => b.id);
            
            fetch('http://localhost:3008/log', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'RECOMMENDATION_SERVED',
                    userId: userId,
                    data: { itemIds: itemIds }
                })
            }).catch(err => console.error("Audit logging failed for recommendation:", err));
        }

        if (recommendedBooks.length === 0) {
            grid.innerHTML = '<p>No specific recommendations yet. Try adding more genres to your profile!</p>';
            return;
        }

        grid.innerHTML = ''; 
        recommendedBooks.forEach(book => {
            const card = document.createElement('div');
            card.className = 'book-card recommended-style';
            card.innerHTML = `
                <h3>${book.title}</h3>
                <p><strong>${book.author}</strong></p>
                <p><small>${book.genre}</small></p>
                <button onclick="addToList(${book.id})">Add</button>
            `;
            grid.appendChild(card);
        });
    } catch (e) {
        console.error("Could not load recommendations:", e);
        grid.innerHTML = '<p>Personalized feed is currently unavailable.</p>';
    }
}

async function displayDiscoveryTags() {
    const userId = localStorage.getItem('userId');
    const container = document.getElementById('discovery-tags-container');
    if (!container || !userId) return;

    try {
        const response = await fetch(`http://localhost:3006/tags/discovery/${userId}`);
        const tags = await response.json();
        
        container.innerHTML = '<h4>Explore New Genres:</h4> ' + 
            tags.map(t => `<span class="tag-badge">${t}</span>`).join(' ');
    } catch (e) {
        console.error("Discovery tags failed", e);
    }
}

// Example of how to call your new service from the frontend
async function saveUserPreferences(userId, selectedTags) {
    try {
        const response = await fetch('http://localhost:3007/update', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, tags: selectedTags })
        });
        
        const data = await response.json();
        if (data.success) {
            alert("Preferences saved successfully!");
            // Optionally refresh the view or UI state here
        }
    } catch (err) {
        console.error("Update failed:", err);
    }
}

async function loadGenreSettings() {
    const container = document.getElementById('genre-checkboxes');
    const userId = localStorage.getItem('userId');
    
    // 1. Get all available genres (from your Tag Service)
    const allResp = await fetch('http://localhost:3006/all-genres');
    const allGenres = await allResp.json();
    
    // 2. Get user's current genres (from your User Service)
    const userResp = await fetch(`http://localhost:3000/user/${userId}`);
    const userData = await userResp.json();
    const current = userData.interest_tags || [];

    // 3. Render checkboxes, pre-checking the ones the user already has
    container.innerHTML = allGenres.map(genre => `
        <label style="display: block;">
            <input type="checkbox" value="${genre}" ${current.includes(genre) ? 'checked' : ''}> 
            ${genre}
        </label>
    `).join('');
}

/**
 * Reads the checkboxes and calls the save service
 */
async function saveMyGenres() {
    const userId = localStorage.getItem('userId');
    if (!userId) {
        alert("User session expired. Please log in again.");
        return;
    }

    // Find all checked boxes in the settings section
    const checkboxes = document.querySelectorAll('#genre-checkboxes input:checked');
    const selectedTags = Array.from(checkboxes).map(cb => cb.value);

    // Pass the data to your existing save helper
    await saveUserPreferences(parseInt(userId), selectedTags);
}

/**
 * Permanently delete the user account and clear local storage
 */
async function deleteAccount() {
    const userId = localStorage.getItem('userId');
    if (!userId) return;

    const confirmed = confirm("Are you sure? You will lose access to your list and preferences permanently.");
    
    if (confirmed) {
        try {
            const response = await fetch(`http://localhost:3000/delete-account/${userId}`, {
                method: 'DELETE'
            });

            const data = await response.json();

            if (data.success) {
                alert("Your account has been deleted.");
                localStorage.clear();
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
 * Initialize page content based on URL path
 */
window.onload = () => {
    const path = window.location.pathname.toLowerCase();
    if (path.includes('home')) {
        displayRecommendations();
        displayBooks();
    } else if (path.includes('mylist')) {
        displayMyList();
    } else if (path.includes('settings')) {
        loadGenreSettings(); // Call this when settings.html loads
    }
};

const myButton = document.getElementById('my-button');
if (myButton) {
    // Added 'async' here
    myButton.addEventListener('click', async () => {
        const container = document.getElementById('discovery-tags-container');
        const userId = localStorage.getItem('userId');
        
        container.innerHTML = '<p>Loading new genres...</p>';
        
        try {
            const response = await fetch(`http://localhost:3006/tags/discovery/${userId}`);
            const tags = await response.json();
            
            if (tags.length === 0) {
                container.innerHTML = '<p>You have discovered all available genres!</p>';
            } else {
                const randomTag = tags[Math.floor(Math.random() * tags.length)];
                container.innerHTML = '<h4>Suggested Genre to Explore:</h4>' + 
                    `<span class="tag-badge">${randomTag}</span>`;
            }
        } catch (err) {
            container.innerHTML = '<p>Could not load discovery tags.</p>';
        }
    });
}

/**
 * Clear session data and redirect to login
 */
function logout() {
    localStorage.removeItem('userId');
    window.location.replace('../index.html');
}
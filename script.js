// API Configuration
const API_BASE_URL = 'http://localhost:3000';
const API_ENDPOINTS = {
    MOVIES: '/api/movies'
};

// DOM Elements
const addMovieForm = document.getElementById('addMovieForm');
const moviesList = document.getElementById('moviesList');
const loading = document.getElementById('loading');
const noMovies = document.getElementById('noMovies');
const movieCount = document.getElementById('movieCount');
const refreshBtn = document.getElementById('refreshBtn');
const resetBtn = document.getElementById('resetBtn');
const apiStatus = document.getElementById('apiStatus');
const ratingSlider = document.getElementById('rating');
const ratingValue = document.querySelector('.rating-value');
const toast = document.getElementById('toast');

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initApp();
});

// Initialize application
function initApp() {
    // Check API connection
    checkApiConnection();
    
    // Load movies on page load
    loadMovies();
    
    // Setup event listeners
    setupEventListeners();
    
    // Initialize rating display
    ratingSlider.addEventListener('input', updateRatingDisplay);
}

// Check API connection
async function checkApiConnection() {
    apiStatus.textContent = 'Checking...';
    apiStatus.className = 'api-status checking';
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/movies`);
        if (response.ok) {
            apiStatus.textContent = 'Online';
            apiStatus.className = 'api-status online';
        } else {
            apiStatus.textContent = 'Offline';
            apiStatus.className = 'api-status offline';
        }
    } catch (error) {
        console.error('API Connection Error:', error);
        apiStatus.textContent = 'Offline';
        apiStatus.className = 'api-status offline';
        showToast('Cannot connect to server. Make sure backend is running.', 'error');
    }
}

// Setup event listeners
function setupEventListeners() {
    // Form submission
    addMovieForm.addEventListener('submit', handleAddMovie);
    
    // Refresh button
    refreshBtn.addEventListener('click', loadMovies);
    
    // Reset button
    resetBtn.addEventListener('click', resetForm);
}

// Update rating display
function updateRatingDisplay() {
    ratingValue.textContent = ratingSlider.value;
}

// Show toast notification
function showToast(message, type = 'success') {
    toast.textContent = message;
    toast.className = 'toast';
    
    // Add type-based styling
    if (type === 'error') {
        toast.style.borderLeftColor = '#ff4c4c';
    } else if (type === 'warning') {
        toast.style.borderLeftColor = '#ffcc00';
    } else {
        toast.style.borderLeftColor = '#6a11cb';
    }
    
    // Show toast
    toast.classList.add('show');
    
    // Hide after 3 seconds
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Load movies from API
async function loadMovies() {
    showLoading(true);
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/movies`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const movies = await response.json();
        displayMovies(movies);
        
        // Update movie count
        movieCount.textContent = `${movies.length} movie${movies.length !== 1 ? 's' : ''}`;
        
    } catch (error) {
        console.error('Error loading movies:', error);
        moviesList.innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-triangle fa-3x"></i>
                <h3>Unable to load movies</h3>
                <p>${error.message}</p>
                <p>Make sure the backend server is running on http://localhost:3000</p>
            </div>
        `;
        showToast('Failed to load movies. Check console for details.', 'error');
    } finally {
        showLoading(false);
    }
}

// Show/hide loading state
function showLoading(isLoading) {
    loading.style.display = isLoading ? 'block' : 'none';
    moviesList.style.display = isLoading ? 'none' : 'grid';
}

// Display movies in the grid
function displayMovies(movies) {
    if (!movies || movies.length === 0) {
        noMovies.style.display = 'block';
        moviesList.style.display = 'none';
        return;
    }
    
    noMovies.style.display = 'none';
    moviesList.style.display = 'grid';
    
    moviesList.innerHTML = movies.map(movie => createMovieCard(movie)).join('');
}

// Create movie card HTML
function createMovieCard(movie) {
    const stars = getStarRating(movie.rating || 5);
    
    return `
        <div class="movie-card">
            <div class="movie-header">
                <h3 class="movie-title">${escapeHtml(movie.title)}</h3>
                <span class="movie-year">${movie.year || 'N/A'}</span>
            </div>
            
            <div class="movie-details">
                <div class="movie-detail">
                    <i class="fas fa-user"></i>
                    <span>${movie.director || 'Unknown Director'}</span>
                </div>
                <div class="movie-detail">
                    <i class="fas fa-tags"></i>
                    <span>${movie.genre || 'Uncategorized'}</span>
                </div>
                ${movie.rating ? `
                    <div class="movie-detail">
                        <i class="fas fa-star"></i>
                        <span>Rating: ${movie.rating}/10</span>
                    </div>
                ` : ''}
            </div>
            
            ${movie.rating ? `
                <div class="rating-stars">
                    ${stars}
                </div>
            ` : ''}
            
            ${movie.description ? `
                <div class="movie-description">
                    ${escapeHtml(movie.description)}
                </div>
            ` : ''}
        </div>
    `;
}

// Get star rating HTML
function getStarRating(rating) {
    const fullStars = Math.floor(rating / 2);
    const halfStar = rating % 2 >= 1 ? 1 : 0;
    const emptyStars = 5 - fullStars - halfStar;
    
    return `
        ${'<i class="fas fa-star"></i>'.repeat(fullStars)}
        ${halfStar ? '<i class="fas fa-star-half-alt"></i>' : ''}
        ${'<i class="far fa-star"></i>'.repeat(emptyStars)}
    `;
}

// Handle form submission
async function handleAddMovie(event) {
    event.preventDefault();
    
    const formData = new FormData(addMovieForm);
    const movieData = {
        title: formData.get('title').trim(),
        year: parseInt(formData.get('year')),
        genre: formData.get('genre'),
        director: formData.get('director').trim(),
        description: formData.get('description').trim(),
        rating: parseInt(formData.get('rating'))
    };
    
    // Validate required fields
    if (!movieData.title || !movieData.year || !movieData.genre) {
        showToast('Please fill in all required fields (Title, Year, Genre)', 'error');
        return;
    }
    
    // Validate year
    if (movieData.year < 1900 || movieData.year > new Date().getFullYear() + 2) {
        showToast('Please enter a valid year (1900-present)', 'error');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/movies`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(movieData)
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }
        
        const newMovie = await response.json();
        showToast(`"${newMovie.title}" added successfully!`, 'success');
        
        // Reset form and reload movies
        addMovieForm.reset();
        ratingValue.textContent = '5';
        ratingSlider.value = 5;
        loadMovies();
        
    } catch (error) {
        console.error('Error adding movie:', error);
        showToast(`Failed to add movie: ${error.message}`, 'error');
    }
}

// Reset form
function resetForm() {
    addMovieForm.reset();
    ratingValue.textContent = '5';
    ratingSlider.value = 5;
    showToast('Form reset', 'info');
}

// Utility function to escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Periodically check API status
setInterval(checkApiConnection, 60000); // Every minute
// Coffee Shop Advanced JavaScript Application

// Global State Management
class CoffeeShopApp {
    constructor() {
        this.cart = JSON.parse(localStorage.getItem('coffeeCart')) || [];
        this.favorites = JSON.parse(localStorage.getItem('coffeeFavorites')) || [];
        this.reviews = JSON.parse(localStorage.getItem('coffeeReviews')) || [];
        this.users = JSON.parse(localStorage.getItem('coffeeUsers')) || [];
        this.notifications = JSON.parse(localStorage.getItem('coffeeNotifications')) || [];
        this.currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;
        this.orderHistory = JSON.parse(localStorage.getItem('orderHistory')) || [];
        this.isDarkMode = localStorage.getItem('darkMode') === 'true';
        this.stats = JSON.parse(localStorage.getItem('coffeeStats')) || {
            coffeeServed: 0,
            happyCustomers: 0,
            avgRating: 0
        };

        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadInitialData();
        this.applyTheme();
        this.updateUI();
        this.initializeAnimations();
    }

    setupEventListeners() {
        // Navigation
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', (e) => this.handleSmoothScroll(e));
        });

        // Dark mode
        document.getElementById('dark-mode-toggle').addEventListener('click', () => this.toggleDarkMode());

        // Search
        document.getElementById('search-toggle').addEventListener('click', () => this.toggleSearch());
        document.getElementById('search-input').addEventListener('input', (e) => this.handleSearch(e.target.value));
        document.getElementById('search-close').addEventListener('click', () => this.closeSearch());

        // User authentication
        document.getElementById('user-btn').addEventListener('click', () => this.showAuthModal());
        document.getElementById('login-btn').addEventListener('click', () => this.showLoginForm());
        document.getElementById('register-btn').addEventListener('click', () => this.showRegisterForm());

        // Notifications
        document.getElementById('notifications-btn').addEventListener('click', () => this.toggleNotifications());

        // Menu filters and sorting
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', () => this.filterMenu(btn.dataset.filter));
        });
        document.getElementById('sort-select').addEventListener('change', (e) => this.sortMenu(e.target.value));

        // Menu interactions
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('add-to-cart')) this.addToCart(e.target);
            if (e.target.classList.contains('favorite-btn')) this.toggleFavorite(e.target);
            if (e.target.classList.contains('qty-btn')) this.updateQuantity(e.target);
        });

        // Cart
        document.getElementById('cart-link').addEventListener('click', (e) => this.showCart(e));
        document.getElementById('clear-cart-btn').addEventListener('click', () => this.clearCart());
        document.getElementById('checkout-btn').addEventListener('click', () => this.checkout());

        // Reviews
        document.getElementById('add-review-btn').addEventListener('click', () => this.showReviewModal());
        document.getElementById('review-form').addEventListener('submit', (e) => this.submitReview(e));

        // Contact
        document.getElementById('contact-form').addEventListener('submit', (e) => this.submitContact(e));
        document.getElementById('newsletter-btn').addEventListener('click', () => this.subscribeNewsletter());

        // Modal close
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal') || e.target.classList.contains('close-modal')) {
                this.closeModals();
            }
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboard(e));
    }

    // Navigation & UI
    handleSmoothScroll(e) {
        e.preventDefault();
        const target = document.querySelector(e.target.getAttribute('href'));
        if (target) {
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }

    toggleDarkMode() {
        this.isDarkMode = !this.isDarkMode;
        localStorage.setItem('darkMode', this.isDarkMode);
        this.applyTheme();
    }

    applyTheme() {
        document.documentElement.setAttribute('data-theme', this.isDarkMode ? 'dark' : 'light');
        const icon = document.querySelector('#dark-mode-toggle i');
        icon.className = this.isDarkMode ? 'fas fa-sun' : 'fas fa-moon';
    }

    toggleSearch() {
        const searchBar = document.getElementById('search-bar');
        searchBar.classList.toggle('hidden');
        if (!searchBar.classList.contains('hidden')) {
            document.getElementById('search-input').focus();
        }
    }

    closeSearch() {
        document.getElementById('search-bar').classList.add('hidden');
        document.getElementById('search-input').value = '';
        this.showAllMenuItems();
    }

    handleSearch(query) {
        const items = document.querySelectorAll('.menu-item');
        const lowerQuery = query.toLowerCase();

        items.forEach(item => {
            const name = item.dataset.name.toLowerCase();
            const description = item.querySelector('p').textContent.toLowerCase();
            const shouldShow = name.includes(lowerQuery) || description.includes(lowerQuery);
            item.style.display = shouldShow ? 'block' : 'none';
        });
    }

    showAllMenuItems() {
        document.querySelectorAll('.menu-item').forEach(item => {
            item.style.display = 'block';
        });
    }

    filterMenu(filter) {
        document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
        event.target.classList.add('active');

        const items = document.querySelectorAll('.menu-item');
        items.forEach(item => {
            if (filter === 'all' || item.classList.contains(filter)) {
                item.style.display = 'block';
                item.style.animation = 'fadeIn 0.5s ease';
            } else {
                item.style.display = 'none';
            }
        });
    }

    sortMenu(criteria) {
        const container = document.querySelector('.menu-items');
        const items = Array.from(document.querySelectorAll('.menu-item'));

        items.sort((a, b) => {
            switch (criteria) {
                case 'name':
                    return a.dataset.name.localeCompare(b.dataset.name);
                case 'price-low':
                    return parseFloat(a.dataset.price) - parseFloat(b.dataset.price);
                case 'price-high':
                    return parseFloat(b.dataset.price) - parseFloat(a.dataset.price);
                case 'rating':
                    return parseFloat(b.dataset.rating) - parseFloat(a.dataset.rating);
                default:
                    return 0;
            }
        });

        items.forEach(item => container.appendChild(item));
    }

    // Cart Management
    addToCart(button) {
        const item = button.closest('.menu-item');
        const quantity = parseInt(item.querySelector('.quantity').textContent);
        const name = item.dataset.name;
        const price = parseFloat(item.dataset.price);

        const existingItem = this.cart.find(cartItem => cartItem.name === name);
        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            this.cart.push({ name, price, quantity });
        }

        this.saveCart();
        this.updateCartUI();
        this.showNotification(`${quantity} ${name}(s) added to cart!`, 'success');
    }

    updateQuantity(button) {
        const quantitySpan = button.parentElement.querySelector('.quantity');
        let quantity = parseInt(quantitySpan.textContent);

        if (button.classList.contains('plus')) {
            quantity++;
        } else if (button.classList.contains('minus') && quantity > 1) {
            quantity--;
        }

        quantitySpan.textContent = quantity;
    }

    updateCartUI() {
        const cartCount = document.getElementById('cart-count');
        const cartItems = document.getElementById('cart-items');
        const cartTotal = document.getElementById('cart-total');

        cartCount.textContent = this.cart.reduce((sum, item) => sum + item.quantity, 0);
        cartItems.innerHTML = '';
        let total = 0;

        this.cart.forEach((item, index) => {
            const itemTotal = item.price * item.quantity;
            total += itemTotal;

            const itemElement = document.createElement('div');
            itemElement.className = 'cart-item';
            itemElement.innerHTML = `
                <div class="cart-item-info">
                    <div class="cart-item-details">
                        <h4>${item.name}</h4>
                        <p>$${item.price} each</p>
                    </div>
                    <div class="cart-quantity">
                        <button class="qty-btn minus" onclick="app.updateCartQuantity(${index}, -1)">-</button>
                        <span class="quantity">${item.quantity}</span>
                        <button class="qty-btn plus" onclick="app.updateCartQuantity(${index}, 1)">+</button>
                    </div>
                </div>
                <div>
                    <span class="price">$${itemTotal.toFixed(2)}</span>
                    <button onclick="app.removeFromCart(${index})" style="margin-left: 1rem;">Remove</button>
                </div>
            `;
            cartItems.appendChild(itemElement);
        });

        cartTotal.textContent = `Total: $${total.toFixed(2)}`;
    }

    updateCartQuantity(index, change) {
        this.cart[index].quantity += change;
        if (this.cart[index].quantity <= 0) {
            this.cart.splice(index, 1);
        }
        this.saveCart();
        this.updateCartUI();
    }

    removeFromCart(index) {
        this.cart.splice(index, 1);
        this.saveCart();
        this.updateCartUI();
    }

    clearCart() {
        this.cart = [];
        this.saveCart();
        this.updateCartUI();
        this.showNotification('Cart cleared!', 'info');
    }

    checkout() {
        if (this.cart.length === 0) {
            this.showNotification('Your cart is empty!', 'warning');
            return;
        }

        if (!this.currentUser) {
            this.showNotification('Please log in to checkout', 'warning');
            this.showAuthModal();
            return;
        }

        const total = this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const order = {
            id: Date.now(),
            items: [...this.cart],
            total: total,
            date: new Date().toISOString(),
            status: 'confirmed'
        };

        this.orderHistory.push(order);
        this.saveOrderHistory();

        // Update stats
        this.stats.coffeeServed += this.cart.reduce((sum, item) => sum + item.quantity, 0);
        this.stats.happyCustomers++;
        this.saveStats();

        this.showNotification(`Order confirmed! Total: $${total.toFixed(2)}`, 'success');
        this.cart = [];
        this.saveCart();
        this.updateCartUI();
        this.updateDashboard();
    }

    showCart(e) {
        e.preventDefault();
        const cartSection = document.getElementById('cart');
        cartSection.classList.toggle('show');
        cartSection.scrollIntoView({ behavior: 'smooth' });
    }

    saveCart() {
        localStorage.setItem('coffeeCart', JSON.stringify(this.cart));
    }

    // Favorites
    toggleFavorite(button) {
        const item = button.closest('.menu-item');
        const name = item.dataset.name;

        if (this.favorites.includes(name)) {
            this.favorites = this.favorites.filter(fav => fav !== name);
            button.classList.remove('favorited');
            button.innerHTML = '<i class="far fa-heart"></i>';
            this.showNotification('Removed from favorites', 'info');
        } else {
            this.favorites.push(name);
            button.classList.add('favorited');
            button.innerHTML = '<i class="fas fa-heart"></i>';
            this.showNotification('Added to favorites!', 'success');
        }

        this.saveFavorites();
        this.updateDashboard();
    }

    saveFavorites() {
        localStorage.setItem('coffeeFavorites', JSON.stringify(this.favorites));
    }

    // User Authentication
    showAuthModal() {
        const modal = document.getElementById('auth-modal');
        modal.style.display = 'block';
        this.showLoginForm();
    }

    showLoginForm() {
        const content = document.getElementById('auth-content');
        content.innerHTML = `
            <h2>Login</h2>
            <form id="login-form">
                <input type="email" id="login-email" placeholder="Email" required>
                <input type="password" id="login-password" placeholder="Password" required>
                <button type="submit">Login</button>
            </form>
            <p>Don't have an account? <a href="#" onclick="app.showRegisterForm()">Register</a></p>
        `;

        document.getElementById('login-form').addEventListener('submit', (e) => this.login(e));
    }

    showRegisterForm() {
        const content = document.getElementById('auth-content');
        content.innerHTML = `
            <h2>Register</h2>
            <form id="register-form">
                <input type="text" id="register-name" placeholder="Full Name" required>
                <input type="email" id="register-email" placeholder="Email" required>
                <input type="password" id="register-password" placeholder="Password" required>
                <button type="submit">Register</button>
            </form>
            <p>Already have an account? <a href="#" onclick="app.showLoginForm()">Login</a></p>
        `;

        document.getElementById('register-form').addEventListener('submit', (e) => this.register(e));
    }

    login(e) {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;

        const user = this.users.find(u => u.email === email && u.password === password);
        if (user) {
            this.currentUser = user;
            localStorage.setItem('currentUser', JSON.stringify(user));
            this.closeModals();
            this.updateUI();
            this.showNotification(`Welcome back, ${user.name}!`, 'success');
        } else {
            this.showNotification('Invalid email or password', 'error');
        }
    }

    register(e) {
        e.preventDefault();
        const name = document.getElementById('register-name').value;
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;

        if (this.users.find(u => u.email === email)) {
            this.showNotification('Email already registered', 'error');
            return;
        }

        const newUser = { id: Date.now(), name, email, password };
        this.users.push(newUser);
        this.saveUsers();
        this.currentUser = newUser;
        localStorage.setItem('currentUser', JSON.stringify(newUser));
        this.closeModals();
        this.updateUI();
        this.showNotification(`Welcome to Coffee Haven, ${name}!`, 'success');
    }

    logout() {
        this.currentUser = null;
        localStorage.removeItem('currentUser');
        this.updateUI();
        this.showNotification('Logged out successfully', 'info');
    }

    saveUsers() {
        localStorage.setItem('coffeeUsers', JSON.stringify(this.users));
    }

    // Reviews System
    showReviewModal() {
        if (!this.currentUser) {
            this.showNotification('Please log in to write a review', 'warning');
            this.showAuthModal();
            return;
        }

        const modal = document.getElementById('review-modal');
        modal.style.display = 'block';
    }

    submitReview(e) {
        e.preventDefault();
        const rating = document.querySelector('input[name="rating"]:checked')?.value;
        const text = document.getElementById('review-text').value;

        if (!rating) {
            this.showNotification('Please select a rating', 'warning');
            return;
        }

        const review = {
            id: Date.now(),
            userId: this.currentUser.id,
            userName: this.currentUser.name,
            rating: parseInt(rating),
            text: text,
            date: new Date().toISOString()
        };

        this.reviews.push(review);
        this.saveReviews();
        this.updateReviewsUI();
        this.closeModals();
        document.getElementById('review-form').reset();
        this.showNotification('Review submitted successfully!', 'success');
    }

    updateReviewsUI() {
        const reviewsList = document.getElementById('reviews-list');
        const overallRating = document.getElementById('overall-rating-value');
        const totalReviews = document.getElementById('total-reviews');

        reviewsList.innerHTML = '';
        const totalRating = this.reviews.reduce((sum, review) => sum + review.rating, 0);
        const avgRating = this.reviews.length > 0 ? (totalRating / this.reviews.length).toFixed(1) : 0;

        overallRating.textContent = avgRating;
        totalReviews.textContent = `Based on ${this.reviews.length} reviews`;

        this.reviews.slice(-5).reverse().forEach(review => {
            const reviewElement = document.createElement('div');
            reviewElement.className = 'review-item';
            reviewElement.innerHTML = `
                <div class="review-header">
                    <span class="review-author">${review.userName}</span>
                    <span class="review-date">${new Date(review.date).toLocaleDateString()}</span>
                </div>
                <div class="review-rating">${'★'.repeat(review.rating)}${'☆'.repeat(5 - review.rating)}</div>
                <p>${review.text}</p>
            `;
            reviewsList.appendChild(reviewElement);
        });

        this.stats.avgRating = parseFloat(avgRating);
        this.saveStats();
    }

    saveReviews() {
        localStorage.setItem('coffeeReviews', JSON.stringify(this.reviews));
    }

    // Dashboard
    updateDashboard() {
        const dashboard = document.querySelector('.dashboard-section');
        const content = document.getElementById('dashboard-content');

        if (!this.currentUser) {
            content.innerHTML = `
                <div class="login-prompt">
                    <h3>Please log in to view your dashboard</h3>
                    <button id="login-btn" class="primary-btn">Login</button>
                    <button id="register-btn" class="secondary-btn">Register</button>
                </div>
            `;
            dashboard.classList.remove('show');
            return;
        }

        dashboard.classList.add('show');
        const userOrders = this.orderHistory.filter(order => order.userId === this.currentUser.id);

        content.innerHTML = `
            <div class="dashboard-card">
                <h4>Welcome back, ${this.currentUser.name}!</h4>
                <p>Email: ${this.currentUser.email}</p>
                <button onclick="app.logout()" class="secondary-btn">Logout</button>
            </div>

            <div class="dashboard-card">
                <h4>Order History</h4>
                <div class="order-history">
                    ${userOrders.length > 0 ?
                        userOrders.slice(-3).reverse().map(order => `
                            <div class="order-item">
                                <div>
                                    <strong>Order #${order.id}</strong>
                                    <br>${new Date(order.date).toLocaleDateString()}
                                </div>
                                <div>$${order.total.toFixed(2)}</div>
                            </div>
                        `).join('') :
                        '<p>No orders yet</p>'
                    }
                </div>
            </div>

            <div class="dashboard-card">
                <h4>Your Favorites</h4>
                <div class="favorites-list">
                    ${this.favorites.length > 0 ?
                        this.favorites.map(fav => `
                            <div class="favorite-item">
                                <h5>${fav}</h5>
                            </div>
                        `).join('') :
                        '<p>No favorites yet</p>'
                    }
                </div>
            </div>
        `;
    }

    saveOrderHistory() {
        localStorage.setItem('orderHistory', JSON.stringify(this.orderHistory));
    }

    // Notifications
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : type === 'warning' ? 'exclamation-triangle' : 'info-circle'}"></i>
            ${message}
        `;

        notification.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            background: ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : type === 'warning' ? '#ffc107' : '#17a2b8'};
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            z-index: 1001;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            animation: slideIn 0.3s ease;
            max-width: 300px;
        `;

        document.body.appendChild(notification);

        // Add to notifications array
        this.notifications.unshift({
            id: Date.now(),
            message,
            type,
            timestamp: new Date().toISOString(),
            read: false
        });
        this.saveNotifications();
        this.updateNotificationBadge();

        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    toggleNotifications() {
        const panel = document.getElementById('notification-panel');
        panel.classList.toggle('show');

        if (panel.classList.contains('show')) {
            this.notifications.forEach(notif => notif.read = true);
            this.saveNotifications();
            this.updateNotificationBadge();
        }
    }

    updateNotificationBadge() {
        const badge = document.getElementById('notification-count');
        const unreadCount = this.notifications.filter(n => !n.read).length;
        badge.textContent = unreadCount;
        badge.style.display = unreadCount > 0 ? 'inline' : 'none';
    }

    saveNotifications() {
        localStorage.setItem('coffeeNotifications', JSON.stringify(this.notifications));
    }

    // Contact & Newsletter
    submitContact(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData);

        // Simulate sending email
        console.log('Contact form submitted:', data);
        this.showNotification('Thank you for your message! We\'ll get back to you soon.', 'success');
        e.target.reset();
    }

    subscribeNewsletter() {
        const email = document.getElementById('newsletter-email').value;
        if (!email) {
            this.showNotification('Please enter an email address', 'warning');
            return;
        }

        if (!this.isValidEmail(email)) {
            this.showNotification('Please enter a valid email address', 'error');
            return;
        }

        this.showNotification('Successfully subscribed to newsletter!', 'success');
        document.getElementById('newsletter-email').value = '';
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // Stats & Analytics
    updateStats() {
        document.getElementById('coffee-served').textContent = this.stats.coffeeServed.toLocaleString();
        document.getElementById('happy-customers').textContent = this.stats.happyCustomers.toLocaleString();
        document.getElementById('avg-rating').textContent = this.stats.avgRating.toFixed(1);
    }

    saveStats() {
        localStorage.setItem('coffeeStats', JSON.stringify(this.stats));
        this.updateStats();
    }

    // UI Updates
    updateUI() {
        this.updateCartUI();
        this.updateReviewsUI();
        this.updateDashboard();
        this.updateNotificationBadge();
        this.updateStats();

        // Update user button
        const userBtn = document.getElementById('user-btn');
        if (this.currentUser) {
            userBtn.innerHTML = '<i class="fas fa-user-check"></i>';
            userBtn.title = `Logged in as ${this.currentUser.name}`;
        } else {
            userBtn.innerHTML = '<i class="fas fa-user"></i>';
            userBtn.title = 'User Account';
        }

        // Update favorites
        document.querySelectorAll('.favorite-btn').forEach(btn => {
            const item = btn.closest('.menu-item');
            const name = item.dataset.name;
            if (this.favorites.includes(name)) {
                btn.classList.add('favorited');
                btn.innerHTML = '<i class="fas fa-heart"></i>';
            }
        });
    }

    // Modal Management
    closeModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.style.display = 'none';
        });
    }

    // Keyboard Shortcuts
    handleKeyboard(e) {
        if (e.key === 'Escape') {
            this.closeModals();
            document.getElementById('notification-panel').classList.remove('show');
        }
        if (e.ctrlKey && e.key === 'k') {
            e.preventDefault();
            this.toggleSearch();
        }
        if (e.key === '/') {
            e.preventDefault();
            this.toggleSearch();
        }
    }

    // Animations
    initializeAnimations() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                }
            });
        }, { threshold: 0.1 });

        document.querySelectorAll('section').forEach(section => {
            observer.observe(section);
        });
    }

    // Data Loading
    loadInitialData() {
        // Load favorites state
        document.querySelectorAll('.menu-item').forEach(item => {
            const name = item.dataset.name;
            const favBtn = item.querySelector('.favorite-btn');
            if (this.favorites.includes(name)) {
                favBtn.classList.add('favorited');
                favBtn.innerHTML = '<i class="fas fa-heart"></i>';
            }
        });

        // Update notification panel
        this.updateNotificationPanel();
    }

    updateNotificationPanel() {
        const list = document.getElementById('notification-list');
        list.innerHTML = this.notifications.slice(0, 5).map(notif => `
            <div class="notification-item">
                <i class="fas fa-${notif.type === 'success' ? 'check-circle' : notif.type === 'error' ? 'exclamation-circle' : notif.type === 'warning' ? 'exclamation-triangle' : 'info-circle'}"></i>
                ${notif.message}
                <br><small>${new Date(notif.timestamp).toLocaleDateString()}</small>
            </div>
        `).join('');
    }
}

// Initialize the application
const app = new CoffeeShopApp();

// Make app globally available for onclick handlers
window.app = app;

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeIn {
        from { opacity: 0; transform: scale(0.9); }
        to { opacity: 1; transform: scale(1); }
    }

    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }

    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }

    .notification {
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    }

    .notification.success { background: #28a745 !important; }
    .notification.error { background: #dc3545 !important; }
    .notification.warning { background: #ffc107 !important; color: #000 !important; }
    .notification.info { background: #17a2b8 !important; }
`;
document.head.appendChild(style);
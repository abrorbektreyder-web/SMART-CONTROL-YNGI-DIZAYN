const API_URL = "http://localhost:8000/api";

// ========================================
// AUTH GUARD - Token tekshiruvi
// ========================================
function checkAuth() {
    const token = localStorage.getItem("access_token");
    if (!token) {
        window.location.href = "login.html";
        return false;
    }
    return true;
}

function getAuthHeaders() {
    const token = localStorage.getItem("access_token");
    return {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
    };
}

function logout() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("role");
    localStorage.removeItem("username");
    localStorage.setItem("userId", "");
    window.location.href = "login.html";
}

// CURRENT USER STATE (from localStorage)
let currentUser = {
    name: localStorage.getItem("username") || "User",
    role: localStorage.getItem("role") || "cashier"
};

// POS STATE — cart localStorage dan qayta tiklanadi
let cart = [];
try {
    const savedCart = localStorage.getItem('pos_cart');
    if (savedCart) {
        cart = JSON.parse(savedCart);
    }
} catch (e) {
    console.warn('Saqlangan savat yuklanmadi:', e);
    cart = [];
}

// Cart ni localStorage ga saqlash funksiyasi
function saveCartToStorage() {
    try {
        localStorage.setItem('pos_cart', JSON.stringify(cart));
    } catch (e) {
        console.warn('Savatni saqlashda xatolik:', e);
    }
}
let todaySalesCount = 0;
let todaySalesTotal = 0;

// ========================================
// TOAST NOTIFICATION SYSTEM (Task 7)
// ========================================
function showToast(message, type = 'info') {
    // Remove existing toast
    const existingToast = document.getElementById('toast-notification');
    if (existingToast) existingToast.remove();

    // Create toast container if not exists
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10000;
            display: flex;
            flex-direction: column;
            gap: 10px;
        `;
        document.body.appendChild(container);
    }

    // Define colors by type
    const colors = {
        success: { bg: 'rgba(34, 197, 94, 0.95)', icon: '✅' },
        error: { bg: 'rgba(239, 68, 68, 0.95)', icon: '❌' },
        warning: { bg: 'rgba(234, 179, 8, 0.95)', icon: '⚠️' },
        info: { bg: 'rgba(59, 130, 246, 0.95)', icon: 'ℹ️' }
    };

    const { bg, icon } = colors[type] || colors.info;

    // Create toast element
    const toast = document.createElement('div');
    toast.id = 'toast-notification';
    toast.style.cssText = `
        background: ${bg};
        color: white;
        padding: 15px 20px;
        border-radius: 10px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        gap: 12px;
        min-width: 280px;
        max-width: 400px;
        animation: slideIn 0.3s ease;
        font-weight: 500;
    `;
    toast.innerHTML = `<span style="font-size: 1.3rem;">${icon}</span><span>${message}</span>`;

    // Add animation style
    if (!document.getElementById('toast-styles')) {
        const style = document.createElement('style');
        style.id = 'toast-styles';
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes slideOut {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }

    container.appendChild(toast);

    // Auto remove after 4 seconds
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

// Error message translations (Task 7)
function getErrorMessage(error, context = '') {
    const errorMessages = {
        'Not authenticated': 'Login talab qilinadi',
        'Could not validate credentials': 'Sessiya tugagan - qayta kiring',
        'Invalid username or password': "Noto'g'ri login yoki parol",
        'User is blocked': 'Foydalanuvchi bloklangan',
        'Not enough stock': 'Omborda yetarli mahsulot yo\'q',
        'Permission denied': 'Ruxsat yo\'q',
        'Forbidden': 'Ruxsat yo\'q - Role mos emas',
        'Product not found': 'Mahsulot topilmadi',
        'Debt record not found': 'Qarz topilmadi',
        'User not found': 'Foydalanuvchi topilmadi',
        'Failed to fetch': 'Server bilan bog\'lanishda xatolik',
        'NetworkError': 'Internet aloqasi yo\'q'
    };

    // Check for known error patterns
    for (const [key, value] of Object.entries(errorMessages)) {
        if (error.includes(key)) return value;
    }

    return context ? `${context}: ${error}` : error;
}

document.addEventListener("DOMContentLoaded", () => {
    // Auth Guard - token yo'q bo'lsa login ga haydash
    if (!checkAuth()) return;

    // Update UI with user info
    const username = localStorage.getItem("username") || "User";
    const role = localStorage.getItem("role") || "cashier";

    currentUser.name = username;
    currentUser.role = role;

    document.getElementById('user-name').innerText = username;
    document.getElementById('user-role').innerText = role.charAt(0).toUpperCase() + role.slice(1);
    document.getElementById('user-avatar').innerText = username.substring(0, 2).toUpperCase();

    initChart();
    fetchDashboardData();
    updateUIForRole();

    // Event Listener for Users Menu
    const usersMenuBtn = document.getElementById('menu-users');
    if (usersMenuBtn) {
        usersMenuBtn.addEventListener('click', (e) => {
            e.preventDefault();
            loadUsers();
        });
    }
});

// ROLE MANAGEMENT
function switchRole() {
    const selectedRole = document.getElementById('role-switcher').value;
    currentUser.role = selectedRole;

    if (selectedRole === 'owner') {
        currentUser.name = "Admin";
        document.getElementById('user-name').innerText = "Admin";
        document.getElementById('user-role').innerText = "Owner";
        document.getElementById('user-avatar').innerText = "AD";
    } else {
        currentUser.name = "Kassir";
        document.getElementById('user-name').innerText = "Kassir";
        document.getElementById('user-role').innerText = "Cashier";
        document.getElementById('user-avatar').innerText = "KS";
    }

    updateUIForRole();
    loadDashboard();
}

function updateUIForRole() {
    const menuItems = document.querySelectorAll('.menu a');
    const usersMenu = document.getElementById('menu-users');

    // 1. Handle Users Menu Visibility (Owner only)
    if (currentUser.role === 'owner') {
        if (usersMenu) usersMenu.style.display = 'flex';
    } else {
        if (usersMenu) usersMenu.style.display = 'none';
    }

    // 2. Handle Cashier Restrictions
    // Menu indices have changed due to adding "Users" at index 1
    // 0: Dashboard, 1: Users, 2: Products, 3: Sales, 4: Debts, 5: Reports
    if (currentUser.role === 'cashier') {
        // Hide Debts (index 4) and Reports (index 5)
        if (menuItems[4]) menuItems[4].style.display = 'none';
        if (menuItems[5]) menuItems[5].style.display = 'none';
    } else {
        // Show Debts and Reports for Owner (Users menu is handled above)
        if (menuItems[4]) menuItems[4].style.display = 'flex';
        if (menuItems[5]) menuItems[5].style.display = 'flex';
    }
}

// NAVIGATION FUNCTIONS
function loadDashboard() {
    setActiveMenu('loadDashboard');
    document.getElementById('page-title').innerText = "Boshqaruv Paneli";

    // Ensure Users section is hidden
    showSection('dashboard-view');

    const mainContent = document.querySelector('.view-container');

    if (currentUser.role === 'cashier') {
        mainContent.innerHTML = `
            <div class="card glass" style="padding: 30px; margin-bottom: 20px; background: rgba(239, 68, 68, 0.1); border-color: rgba(239, 68, 68, 0.3);">
                <h3 style="color: var(--accent-red); margin-bottom: 10px;">⚠️ Kassir Rejimi</h3>
                <p style="color: var(--text-secondary);">Siz kassir sifatida tizimga kirdingiz. Moliyaviy ma'lumotlar yashirilgan.</p>
            </div>
            
            <div class="stats-grid" style="grid-template-columns: repeat(2, 1fr);">
                <div class="card stat-card glass">
                    <div class="stat-icon stock">📦</div>
                    <div class="stat-info">
                        <h3>Mahsulotlar Soni</h3>
                        <h2 id="product-count">0</h2>
                        <span class="sub-text">Jami mahsulotlar</span>
                    </div>
                </div>

                <div class="card stat-card glass">
                    <div class="stat-icon stock">⚠️</div>
                    <div class="stat-info">
                        <h3>Kam Qolgan</h3>
                        <h2 id="low-stock">0</h2>
                        <span class="sub-text">To'ldirish kerak</span>
                    </div>
                </div>
            </div>

            <div class="card glass" style="padding: 40px; text-align: center; margin-top: 20px;">
                <h2>🛒 Yangi Savdo Boshlash</h2>
                <p style="color: var(--text-secondary); margin-top: 15px;">
                    Yangi savdo boshlash uchun "Yangi savdo" bo'limiga o'ting.
                </p>
                <button onclick="loadSales()" style="margin-top: 20px; padding: 12px 30px; background: var(--accent-blue); color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 1rem;">
                    Savdo Boshlash
                </button>
            </div>
        `;

        document.getElementById('product-count').innerText = "45";
        document.getElementById('low-stock').innerText = "12";

    } else if (currentUser.role === 'accountant') {
        // ACCOUNTANT VIEW
        mainContent.innerHTML = `
            <div class="stats-grid">
                <div class="card stat-card glass">
                    <div class="stat-icon sales">💰</div>
                    <div class="stat-info">
                        <h3>Jami Savdo</h3>
                        <h2 id="total-sales">0.00 UZS</h2>
                    </div>
                </div>

                <div class="card stat-card glass hero">
                    <div class="stat-icon cash">💵</div>
                    <div class="stat-info">
                        <h3>Sof Foyda</h3>
                        <h2 id="net-profit">0.00 UZS</h2>
                    </div>
                </div>
            </div>

            <div class="card chart-container glass" style="margin-top: 20px;">
                <div class="card-header">
                    <h3>Moliyaviy Grafika</h3>
                </div>
                <canvas id="salesChart"></canvas>
            </div>
        `;
        initChart();
        fetchDashboardData();
    } else {
        mainContent.innerHTML = `
            <div class="stats-grid" style="grid-template-columns: repeat(3, 1fr);">
                <div class="card stat-card glass hero">
                    <div class="stat-icon sales">💰</div>
                    <div class="stat-info">
                        <h3>Bugungi Savdo</h3>
                        <h2 id="total-sales">0 UZS</h2>
                        <span class="sub-text">Kunlik savdo</span>
                    </div>
                </div>

                <div class="card stat-card glass">
                    <div class="stat-icon cash">💵</div>
                    <div class="stat-info">
                        <h3>Kassa</h3>
                        <h2 id="cash-flow">0 UZS</h2>
                        <span class="sub-text">Hozirgi kassada</span>
                    </div>
                </div>

                <div class="card stat-card glass">
                    <div class="stat-icon debt">📒</div>
                    <div class="stat-info">
                        <h3>Faol Qarzlar</h3>
                        <h2 id="active-debts">0 UZS</h2>
                        <span class="sub-text">Jami Qarz</span>
                    </div>
                </div>

                <div class="card stat-card glass">
                    <div class="stat-icon stock">⚠️</div>
                    <div class="stat-info">
                        <h3>Kam Qolgan Mahsulotlar</h3>
                        <h2 id="low-stock">0</h2>
                        <span class="sub-text">To'ldirish kerak</span>
                    </div>
                </div>

                <div class="card stat-card glass">
                    <div class="stat-icon profit">📊</div>
                    <div class="stat-info">
                        <h3>Bugungi Sof Foyda</h3>
                        <h2 id="net-profit-today">0 UZS</h2>
                        <span class="sub-text">Kunlik foyda</span>
                    </div>
                </div>

                <div class="card stat-card glass">
                    <div class="stat-icon products">📦</div>
                    <div class="stat-info">
                        <h3>Jami Mahsulotlar</h3>
                        <h2 id="total-products">0</h2>
                        <span class="sub-text">Omborda</span>
                    </div>
                </div>
            </div>

            <div class="content-grid">
                <div class="card chart-container glass">
                    <div class="card-header">
                        <h3>Savdo Grafigi</h3>
                        <select class="chart-filter">
                            <option>Oxirgi 7 kun</option>
                            <option>Oxirgi 30 kun</option>
                        </select>
                    </div>
                    <canvas id="salesChart"></canvas>
                </div>

                <div class="card table-container glass">
                    <div class="card-header">
                        <h3>So'nggi Savdolar</h3>
                        <button class="btn-text">Barchasini ko'rish</button>
                    </div>
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Vaqt</th>
                                <th>Summa</th>
                                <th>To'lov</th>
                                <th>Holat</th>
                            </tr>
                        </thead>
                        <tbody id="transactions-body"></tbody>
                    </table>
                </div>
            </div>

        `;

        initChart();
        fetchDashboardData();
    }
}

function loadProducts() {
    setActiveMenu('loadProducts');
    document.getElementById('page-title').innerText = "Mahsulotlar";
    showSection('dashboard-view');

    const mainContent = document.querySelector('.view-container');
    mainContent.innerHTML = `
        <div class="card glass" style="padding: 40px; text-align: center;">
            <h2>📦 Mahsulotlar Bo'limi</h2>
            <p style="color: var(--text-secondary); margin-top: 20px;">
                Bu yerda mahsulotlarni boshqarish funksiyalari bo'ladi.
            </p>
            <p style="color: var(--text-secondary); margin-top: 10px;">
                (Keyingi qadamda backend bilan ulanadi)
            </p>
        </div>
    `;
}

function loadSales() {
    setActiveMenu('loadSales');
    document.getElementById('page-title').innerText = "Yangi Savdo";
    showSection('dashboard-view');

    const mainContent = document.querySelector('.view-container');
    mainContent.innerHTML = `
        <style>
            .pos-grid { display: grid; grid-template-columns: 2fr 1fr; gap: 20px; height: calc(100vh - 150px); }
            .pos-input { flex: 1; padding: 12px; background: var(--bg-darker); border: 1px solid var(--glass-border); border-radius: 8px; color: var(--text-primary); font-size: 1rem; }
            .pos-input:focus { outline: none; border-color: var(--accent-blue); }
            .pos-select { width: 100%; padding: 12px; background: var(--bg-darker); border: 1px solid var(--glass-border); border-radius: 8px; color: var(--text-primary); font-size: 1rem; cursor: pointer; }
            .btn-primary { padding: 12px 24px; background: var(--accent-blue); color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; transition: all 0.3s; }
            .btn-primary:hover { background: #2563eb; transform: translateY(-2px); }
            .btn-checkout { width: 100%; padding: 18px; background: #4a7c44; color: white; border: none; border-radius: 12px; cursor: pointer; font-size: 1.1rem; font-weight: 700; transition: all 0.3s; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
            .btn-checkout:hover:not(:disabled) { background: #3d6638; }
            .btn-checkout:disabled { background: var(--text-secondary); cursor: not-allowed; opacity: 0.5; }
            .btn-clear { width: 100%; padding: 12px; background: #dc2626; color: white; border: none; border-radius: 12px; cursor: pointer; font-weight: 600; margin-top: 10px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
            .btn-clear:hover { background: #b91c1c; }
            .cart-item { display: flex; justify-content: space-between; align-items: center; padding: 12px; background: rgba(255, 255, 255, 0.03); border: 1px solid var(--glass-border); border-radius: 8px; margin-bottom: 10px; }
            .cart-item-info { flex: 1; }
            .cart-item-name { font-weight: 600; margin-bottom: 4px; }
            .cart-item-price { color: var(--text-secondary); font-size: 0.9rem; }
            .cart-item-actions { display: flex; align-items: center; gap: 10px; }
            .qty-btn { width: 30px; height: 30px; background: var(--accent-blue); color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: bold; }
            .qty-display { min-width: 40px; text-align: center; font-weight: 600; }
            .remove-btn { padding: 6px 12px; background: rgba(239, 68, 68, 0.2); color: var(--accent-red); border: none; border-radius: 6px; cursor: pointer; }
        </style>

        <div class="pos-grid">
            <div style="display: flex; flex-direction: column;">
                <div class="card glass" style="margin-bottom: 20px;">
                    <h3 style="margin-bottom: 15px;">🔍 Mahsulot Qidirish</h3>
                    <div style="display: flex; gap: 10px;">
                        <input type="text" id="barcode-input" placeholder="Shtrix-kod kiriting..." class="pos-input" onkeypress="if(event.key==='Enter') searchProduct()" />
                        <button onclick="searchProduct()" class="btn-primary">Qidirish</button>
                    </div>
                    <p style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 10px;">Enter tugmasini bosing</p>
                </div>

                <div class="card glass" style="flex: 1; display: flex; flex-direction: column;">
                    <h3 style="margin-bottom: 15px;">🛒 Savat</h3>
                    <div id="cart-items" style="flex: 1; overflow-y: auto; max-height: 400px;">
                        <p style="color: var(--text-secondary); text-align: center; padding: 40px 0;">Savat bo'sh</p>
                    </div>
                    
                    <div style="border-top: 1px solid var(--glass-border); padding-top: 15px; margin-top: 15px;">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                            <span>Jami:</span>
                            <strong id="cart-count">0</strong>
                        </div>
                        <div style="display: flex; justify-content: space-between; font-size: 1.3rem; color: var(--accent-blue);">
                            <strong>Summa:</strong>
                            <strong id="cart-total">0 UZS</strong>
                        </div>
                    </div>
                </div>
            </div>

            <div class="card glass">
                <h3 style="margin-bottom: 20px;">💳 To'lov</h3>
                
                <div style="margin-bottom: 20px;">
                    <label style="display: block; margin-bottom: 10px; color: var(--text-secondary);">To'lov turi:</label>
                    <select id="payment-method" class="pos-select" onchange="toggleCustomerInfo()">
                        <option value="CASH">💵 Naqd pul</option>
                        <option value="CARD">💳 Karta</option>
                        <option value="DEBT">📒 Nasiya</option>
                    </select>
                </div>

                <div id="customer-info" style="display: none; margin-bottom: 20px; padding: 15px; background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 8px;">
                    <h4 style="margin-bottom: 10px; color: var(--accent-red);">Mijoz</h4>
                    <input type="text" id="customer-name" placeholder="Ismi" class="pos-input" style="margin-bottom: 10px;" />
                    <input type="text" id="customer-phone" placeholder="+998..." class="pos-input" />
                </div>

                <button onclick="processCheckout()" class="btn-checkout" id="checkout-btn" disabled>
                    ✓ Sotish
                </button>

                <button onclick="clearCart()" class="btn-clear">🗑️ Tozalash</button>

                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid var(--glass-border);">
                    <h4 style="margin-bottom: 15px; color: var(--text-secondary);">Bugun</h4>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                        <span>Savdolar:</span>
                        <strong id="today-count">0</strong>
                    </div>
                    <div style="display: flex; justify-content: space-between;">
                        <span>Jami:</span>
                        <strong id="today-total">0 UZS</strong>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Sahifa yangilanganda savatni qayta tiklash
    if (cart.length > 0) {
        updateCartUI();
    }

    setTimeout(() => document.getElementById('barcode-input').focus(), 100);
}

function loadDebts() {
    setActiveMenu('loadDebts');
    document.getElementById('page-title').innerText = "Qarzlar";
    showSection('dashboard-view');

    const mainContent = document.querySelector('.view-container');
    mainContent.innerHTML = `
        <style>
            .debt-grid { display: grid; grid-template-columns: 1fr 2fr; gap: 20px; }
            .debt-input { width: 100%; padding: 12px; background: var(--bg-darker); border: 1px solid var(--glass-border); border-radius: 8px; color: var(--text-primary); font-size: 1rem; }
            .debt-input:focus { outline: none; border-color: var(--accent-blue); }
            .btn-search { padding: 12px 24px; background: var(--accent-blue); color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; }
            .btn-pay { padding: 8px 16px; background: var(--accent-green); color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 500; }
            .btn-pay:hover { background: #059669; }
            .debt-card { padding: 15px; background: rgba(255,255,255,0.03); border: 1px solid var(--glass-border); border-radius: 10px; margin-bottom: 12px; }
            .debt-status-open { color: var(--accent-red); }
            .debt-status-partial { color: var(--accent-yellow); }
            .debt-status-paid { color: var(--accent-green); }
            .debt-modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; z-index: 1000; }
            .modal-content { background: var(--bg-darker); padding: 30px; border-radius: 16px; width: 400px; max-width: 90%; }
        </style>

        <div class="debt-grid">
            <!-- LEFT: Search & Stats -->
            <div>
                <div class="card glass" style="margin-bottom: 20px;">
                    <h3 style="margin-bottom: 15px;">🔍 Mijozni Qidirish</h3>
                    <input type="text" id="debt-phone-search" placeholder="+998..." class="debt-input" style="margin-bottom: 10px;" />
                    <button onclick="searchDebts()" class="btn-search" style="width: 100%;">Qidirish</button>
                </div>

                <div class="card glass">
                    <h3 style="margin-bottom: 15px;">📊 Umumiy Statistika</h3>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                        <span>Jami qarzlar:</span>
                        <strong id="total-debts-count">0</strong>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                        <span>Ochiq qarzlar:</span>
                        <strong id="open-debts-count" style="color: var(--accent-red);">0</strong>
                    </div>
                    <div style="display: flex; justify-content: space-between;">
                        <span>Jami summa:</span>
                        <strong id="total-debts-amount" style="color: var(--accent-blue);">0 UZS</strong>
                    </div>
                </div>
            </div>

            <!-- RIGHT: Debts List -->
            <div class="card glass">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <h3>📒 Qarzlar Ro'yxati</h3>
                    <button onclick="loadAllDebts()" class="btn-search" style="padding: 8px 16px;">🔄 Yangilash</button>
                </div>

                <div id="debts-loading" style="text-align: center; padding: 40px;">
                    <p>⏳ Yuklanmoqda...</p>
                </div>

                <div id="debts-list" style="display: none; max-height: 500px; overflow-y: auto;">
                    <!-- Debts will be rendered here -->
                </div>

                <div id="debts-empty" style="display: none; text-align: center; padding: 40px; color: var(--text-secondary);">
                    <p>📭 Qarzlar topilmadi</p>
                </div>
            </div>
        </div>

        <!-- Payment Modal (Hidden by default) -->
        <div id="payment-modal" class="debt-modal-overlay" style="display: none;">
            <div class="modal-content">
                <h3 style="margin-bottom: 20px;">💰 Qarz To'lash</h3>
                <input type="hidden" id="pay-debt-id" />
                <div style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 5px; color: var(--text-secondary);">Mijoz:</label>
                    <p id="pay-customer-name" style="font-weight: 600;"></p>
                </div>
                <div style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 5px; color: var(--text-secondary);">Qolgan qarz:</label>
                    <p id="pay-remaining" style="font-weight: 600; color: var(--accent-red);"></p>
                </div>
                <div style="margin-bottom: 20px;">
                    <label style="display: block; margin-bottom: 5px; color: var(--text-secondary);">To'lov summasi:</label>
                    <input type="number" id="pay-amount" class="debt-input" placeholder="Summa kiriting..." />
                </div>
                <div style="display: flex; gap: 10px;">
                    <button onclick="submitPayment()" class="btn-pay" style="flex: 1; padding: 12px;">✓ To'lash</button>
                    <button onclick="closePaymentModal()" style="flex: 1; padding: 12px; background: rgba(239,68,68,0.2); color: var(--accent-red); border: 1px solid var(--accent-red); border-radius: 8px; cursor: pointer;">Bekor qilish</button>
                </div>
            </div>
        </div>
    `;

    // Load all debts on page load
    loadAllDebts();
}

// DEBTS: Load All
async function loadAllDebts() {
    const loading = document.getElementById('debts-loading');
    const list = document.getElementById('debts-list');
    const empty = document.getElementById('debts-empty');

    loading.style.display = 'block';
    list.style.display = 'none';
    empty.style.display = 'none';

    try {
        const response = await fetch(`${API_URL}/debts/`, {
            headers: getAuthHeaders()
        });

        if (!response.ok) throw new Error("Qarzlarni yuklashda xatolik");

        const debts = await response.json();
        renderDebts(debts);

    } catch (error) {
        console.error("Debts error:", error);
        loading.innerHTML = `<p style="color: var(--accent-red);">❌ ${error.message}</p>`;
    }
}

// DEBTS: Search by Phone
async function searchDebts() {
    const phone = document.getElementById('debt-phone-search').value.trim();
    if (!phone) {
        showToast("Telefon raqamini kiriting!", 'warning');
        return;
    }

    const loading = document.getElementById('debts-loading');
    const list = document.getElementById('debts-list');
    const empty = document.getElementById('debts-empty');

    loading.style.display = 'block';
    list.style.display = 'none';
    empty.style.display = 'none';

    try {
        const response = await fetch(`${API_URL}/debts/search?phone=${encodeURIComponent(phone)}`, {
            headers: getAuthHeaders()
        });

        if (!response.ok) throw new Error("Qidiruvda xatolik");

        const debts = await response.json();
        renderDebts(debts);

    } catch (error) {
        console.error("Search error:", error);
        loading.innerHTML = `<p style="color: var(--accent-red);">❌ ${error.message}</p>`;
    }
}

// DEBTS: Render List
function renderDebts(debts) {
    const loading = document.getElementById('debts-loading');
    const list = document.getElementById('debts-list');
    const empty = document.getElementById('debts-empty');

    loading.style.display = 'none';

    if (debts.length === 0) {
        empty.style.display = 'block';
        return;
    }

    list.style.display = 'block';

    // Stats
    const openDebts = debts.filter(d => d.status !== 'PAID');
    const totalAmount = debts.reduce((sum, d) => sum + parseFloat(d.remaining_amount), 0);

    document.getElementById('total-debts-count').innerText = debts.length;
    document.getElementById('open-debts-count').innerText = openDebts.length;
    document.getElementById('total-debts-amount').innerText = totalAmount.toLocaleString() + ' UZS';

    list.innerHTML = debts.map(debt => `
        <div class="debt-card">
            <div style="display: flex; justify-content: space-between; align-items: start;">
                <div>
                    <h4 style="margin-bottom: 5px;">${debt.customer_name}</h4>
                    <p style="color: var(--text-secondary); font-size: 0.9rem;">📞 ${debt.phone_number || 'N/A'}</p>
                </div>
                <span class="debt-status-${debt.status.toLowerCase()}" style="font-weight: 600;">
                    ${debt.status === 'OPEN' ? '🔴 Ochiq' : debt.status === 'PARTIAL' ? '🟡 Qisman' : '🟢 Tolangan'}
                </span>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 15px; padding-top: 15px; border-top: 1px solid var(--glass-border);">
                <div>
                    <span style="color: var(--text-secondary);">Qolgan:</span>
                    <strong style="color: var(--accent-red); margin-left: 5px;">${parseFloat(debt.remaining_amount).toLocaleString()} UZS</strong>
                    <span style="color: var(--text-secondary); margin-left: 10px;">(Asl: ${parseFloat(debt.original_amount).toLocaleString()} UZS)</span>
                </div>
                ${debt.status !== 'PAID' ? `
                    <button onclick="openPaymentModal(${debt.id}, '${debt.customer_name.replace(/'/g, "\\'")}', ${debt.remaining_amount})" class="btn-pay">
                        💰 Tolash
                    </button>
                ` : ''}
            </div>
        </div>
    `).join('');
}

// DEBTS: Open Payment Modal
function openPaymentModal(debtId, customerName, remainingAmount) {
    document.getElementById('pay-debt-id').value = debtId;
    document.getElementById('pay-customer-name').innerText = customerName;
    document.getElementById('pay-remaining').innerText = parseFloat(remainingAmount).toLocaleString() + ' UZS';
    document.getElementById('pay-amount').value = '';
    document.getElementById('pay-amount').max = remainingAmount;
    document.getElementById('payment-modal').style.display = 'flex';
}

// DEBTS: Close Payment Modal
function closePaymentModal() {
    document.getElementById('payment-modal').style.display = 'none';
}

// DEBTS: Submit Payment
async function submitPayment() {
    const debtId = document.getElementById('pay-debt-id').value;
    const amount = parseFloat(document.getElementById('pay-amount').value);

    if (!amount || amount <= 0) {
        alert("⚠️ To'g'ri summa kiriting!");
        return;
    }

    const userId = localStorage.getItem("userId") || 1;
    try {
        const response = await fetch(`${API_URL}/debts/${debtId}/pay?user_id=${userId}`, {
            method: 'POST',
            headers: {
                ...getAuthHeaders(),
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ amount: amount })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || "To'lovda xatolik");
        }

        const result = await response.json();
        showToast(`To'lov muvaffaqiyatli! Qolgan qarz: ${parseFloat(result.remaining_amount).toLocaleString()} UZS`, 'success');
        closePaymentModal();
        loadAllDebts();
        fetchDashboardData(); // Update global stats immediately

    } catch (error) {
        showToast(getErrorMessage(error.message, "To'lov xatosi"), 'error');
        console.error("Payment error:", error);
    }
}

// ========================================
// SARIQ SAVAT (Yellow Basket) MANAGEMENT
// ========================================
function loadYellowBasket() {
    setActiveMenu('loadYellowBasket');
    document.getElementById('page-title').innerText = "Sariq Savat";
    showSection('dashboard-view');

    const mainContent = document.querySelector('.view-container');
    mainContent.innerHTML = `
        <style>
            .yellow-item { background: rgba(234, 179, 8, 0.1); border: 1px solid rgba(234, 179, 8, 0.3); border-radius: 12px; padding: 15px; margin-bottom: 10px; display: flex; justify-content: space-between; align-items: center; }
            .yellow-item-info h4 { color: #eab308; margin-bottom: 5px; }
            .yellow-item-info p { color: var(--text-secondary); font-size: 0.9rem; }
            .btn-verify { padding: 10px 20px; background: var(--accent-green); color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 500; }
            .btn-verify:hover { opacity: 0.9; }
        </style>
        
        <div class="card glass" style="padding: 25px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h3>🛒 Sariq Savat - Bekor Qilingan Mahsulotlar</h3>
                <button onclick="loadYellowBasket()" style="background: var(--accent-blue); color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer;">🔄 Yangilash</button>
            </div>
            
            <div style="background: rgba(234, 179, 8, 0.15); border-radius: 10px; padding: 15px; margin-bottom: 20px;">
                <p style="color: #eab308;">⚠️ <strong>MUHIM:</strong> Smena yopishdan oldin barcha mahsulotlarni qayta skanerlashingiz kerak!</p>
            </div>
            
            <div id="yellow-basket-loading" style="text-align: center; padding: 30px;">
                <p>⏳ Yuklanmoqda...</p>
            </div>
            
            <div id="yellow-basket-list" style="display: none;"></div>
            
            <div id="yellow-basket-empty" style="display: none; text-align: center; padding: 40px;">
                <p style="font-size: 3rem;">✅</p>
                <p style="color: var(--accent-green); font-weight: 600;">Sariq savat bo'sh - Smenani yopishingiz mumkin!</p>
            </div>
        </div>
    `;

    fetchYellowBasket();
}

async function fetchYellowBasket() {
    const loading = document.getElementById('yellow-basket-loading');
    const list = document.getElementById('yellow-basket-list');
    const empty = document.getElementById('yellow-basket-empty');

    try {
        // Get user_id from token (simplified - in production decode JWT)
        const userId = localStorage.getItem("userId") || 1;

        const response = await fetch(`${API_URL}/shifts/yellow-basket/${userId}`, {
            headers: getAuthHeaders()
        });

        if (!response.ok) throw new Error("Sariq savatni yuklashda xatolik");

        const data = await response.json();
        loading.style.display = 'none';

        if (data.pending_count === 0) {
            empty.style.display = 'block';
            list.style.display = 'none';
        } else {
            empty.style.display = 'none';
            list.style.display = 'block';
            list.innerHTML = data.items.map(item => `
                <div class="yellow-item">
                    <div class="yellow-item-info">
                        <h4>${item.product_name}</h4>
                        <p>Shtrix-kod: ${item.barcode} | Miqdor: ${item.quantity} dona</p>
                        <p>Sabab: ${item.reason || 'Ko\'rsatilmagan'}</p>
                    </div>
                    <button class="btn-verify" onclick="verifyVoidItem(${item.id})">
                        ✓ Qayta Skanerlash
                    </button>
                </div>
            `).join('');
        }

    } catch (error) {
        console.error("Yellow basket error:", error);
        loading.innerHTML = `<p style="color: var(--accent-red);">❌ ${error.message}</p>`;
    }
}

async function verifyVoidItem(voidId) {
    try {
        const userId = localStorage.getItem("userId") || 1;

        const response = await fetch(`${API_URL}/shifts/verify-void/${voidId}?user_id=${userId}`, {
            method: 'POST',
            headers: getAuthHeaders()
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || "Tasdiqlashda xatolik");
        }

        const result = await response.json();
        showToast(`${result.product} omborga qaytarildi!`, 'success');
        loadYellowBasket(); // Refresh list

    } catch (error) {
        showToast(getErrorMessage(error.message), 'error');
        console.error("Verify error:", error);
    }
}

// ========================================
// SMENA BOSHQARUVI (Shift Management)
// ========================================
function loadShiftManagement() {
    setActiveMenu('loadShiftManagement');
    document.getElementById('page-title').innerText = "Smena Boshqaruvi";
    showSection('dashboard-view');

    const mainContent = document.querySelector('.view-container');
    mainContent.innerHTML = `
        <style>
            .shift-card { background: var(--glass-bg); border-radius: 16px; padding: 25px; margin-bottom: 20px; }
            .shift-btn { padding: 15px 30px; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 1rem; transition: all 0.3s; border: none; }
            .btn-open-shift { background: var(--accent-green); color: white; }
            .btn-close-shift { background: var(--accent-red); color: white; }
            .shift-info { background: rgba(59, 130, 246, 0.1); border: 1px solid rgba(59, 130, 246, 0.3); border-radius: 10px; padding: 15px; margin: 15px 0; }
            .shift-stat { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid var(--glass-border); }
            .shift-stat:last-child { border-bottom: none; }
        </style>
        
        <div class="shift-card">
            <h3 style="margin-bottom: 20px;">⏰ Smena Holati</h3>
            <div id="shift-status-container">
                <p style="text-align: center; padding: 30px;">⏳ Yuklanmoqda...</p>
            </div>
        </div>
    `;

    checkShiftStatus();
}

// Check Shift Status
async function checkShiftStatus() {
    const container = document.getElementById('shift-status-container');
    if (!container) return;
    const userId = localStorage.getItem("userId") || 1;

    try {
        const response = await fetch(`${API_URL}/shifts/status/${userId}`, {
            headers: getAuthHeaders()
        });

        if (response.status === 404) {
            // No active shift - show open shift form
            container.innerHTML = `
                <div style="text-align: center;">
                    <h2 style="color: var(--text-secondary); margin-bottom: 20px;">Faol smena yo'q</h2>
                    <p style="color: var(--text-secondary); margin-bottom: 30px;">Ish boshlash uchun smenani oching</p>
                    
                    <div style="max-width: 300px; margin: 0 auto;">
                        <label style="display: block; margin-bottom: 8px; text-align: left; color: var(--text-secondary);">Boshlang'ich Kassa (UZS):</label>
                        <input type="number" id="start-cash-input" class="debt-input" placeholder="100000" style="width: 100%; margin-bottom: 20px;" />
                        <button onclick="openShift()" class="shift-btn btn-open-shift" style="width: 100%;">
                            ▶️ Smenani Ochish
                        </button>
                    </div>
                </div>
            `;
            return;
        }

        if (!response.ok) throw new Error("Smena holatini yuklashda xatolik");

        const shift = await response.json();

        // Fetch shift summary with expected cash calculation
        let summary = null;
        try {
            const summaryRes = await fetch(`${API_URL}/shifts/summary/${userId}`, {
                headers: getAuthHeaders()
            });
            if (summaryRes.ok) {
                summary = await summaryRes.json();
            }
        } catch (e) {
            // Summary fetch failed — fallback to basic shift data
        }

        const expectedCash = summary ? summary.expected_end_cash : parseFloat(shift.start_cash);
        const totalCashSales = summary ? summary.total_cash_sales : 0;
        const totalCardSales = summary ? summary.total_card_sales : 0;
        const totalDebtSales = summary ? summary.total_debt_sales : 0;
        const pendingVoidCount = summary ? summary.pending_void_count : 0;
        const cashierName = summary ? summary.cashier_name : `Kassir ID: ${userId}`;

        // Show active shift info with FULL summary
        container.innerHTML = `
            <div class="shift-info">
                <div style="text-align: center; margin-bottom: 15px;">
                    <h3 style="color: var(--accent-green);">✅ Faol Smena</h3>
                    <p style="color: var(--text-secondary);">📋 Smena #${shift.id} | 👤 ${cashierName}</p>
                </div>
                
                <div class="shift-stat">
                    <span>Ochilgan vaqt:</span>
                    <strong>${new Date(shift.start_time).toLocaleString('uz-UZ')}</strong>
                </div>
                <div class="shift-stat">
                    <span>Boshlang'ich Kassa:</span>
                    <strong>${parseFloat(shift.start_cash || 0).toLocaleString()} UZS</strong>
                </div>
                <div class="shift-stat" style="border-bottom: none;">
                    <span>💵 Naqd savdolar:</span>
                    <strong style="color: var(--accent-green);">+${totalCashSales.toLocaleString()} UZS</strong>
                </div>
                <div class="shift-stat" style="border-bottom: none;">
                    <span>💳 Karta savdolar:</span>
                    <strong style="color: var(--accent-blue);">${totalCardSales.toLocaleString()} UZS</strong>
                </div>
                <div class="shift-stat" style="border-bottom: none;">
                    <span>📒 Nasiya savdolar:</span>
                    <strong style="color: var(--accent-yellow);">${totalDebtSales.toLocaleString()} UZS</strong>
                </div>
                <div class="shift-stat" style="background: rgba(59, 130, 246, 0.1); padding: 12px; border-radius: 8px; margin-top: 10px;">
                    <span style="font-weight: 600;">📊 KUTILGAN KASSA:</span>
                    <strong style="color: var(--accent-blue); font-size: 1.2rem;">${expectedCash.toLocaleString()} UZS</strong>
                </div>
            </div>
            
            ${pendingVoidCount > 0 ? `
                <div style="background: rgba(234, 179, 8, 0.2); border: 2px solid rgba(234, 179, 8, 0.5); border-radius: 12px; padding: 20px; margin: 20px 0; text-align: center;">
                    <h4 style="color: #eab308; margin-bottom: 10px;">⚠️ SARIQ SAVAT - DIQQAT!</h4>
                    <p style="color: #eab308; font-size: 1.1rem; font-weight: 600;">${pendingVoidCount} ta mahsulot tekshirilmagan!</p>
                    <p style="color: var(--text-secondary); margin-top: 10px;">Smena yopishdan oldin barcha mahsulotlarni qayta skanerlang.</p>
                    <button onclick="loadYellowBasket()" style="margin-top: 15px; padding: 12px 25px; background: #eab308; color: black; border: none; border-radius: 8px; cursor: pointer; font-weight: 600;">
                        🛒 Sariq Savatga O'tish
                    </button>
                </div>
            ` : ''}

            <div style="max-width: 600px; margin: 30px auto;">
                <h4 style="margin-bottom: 15px; text-align: center;">Smenani Yopish</h4>
                
                <div style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 8px; color: var(--text-secondary);">Yakuniy Kassa (UZS):</label>
                    <input type="number" id="end-cash-input" class="debt-input" placeholder="${expectedCash}" 
                           onchange="calculateShortage(${expectedCash})" 
                           oninput="calculateShortage(${expectedCash})" 
                           style="width: 100%;" />
                    <small style="color: var(--text-secondary); display: block; margin-top: 5px;">
                        ℹ️ Kutilgan summa: <strong>${expectedCash.toLocaleString()} UZS</strong>
                    </small>
                </div>
                
                <!-- Avtomatik kamomad hisobi -->
                <div id="auto-shortage-info" style="display: none; background: rgba(239, 68, 68, 0.15); border: 2px solid rgba(239, 68, 68, 0.5); border-radius: 12px; padding: 20px; margin-bottom: 20px;">
                    <h4 style="color: var(--accent-red); margin-bottom: 15px;">🚨 KAMOMAD ANIQLANDI!</h4>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                        <span>Kutilgan kassa:</span>
                        <strong>${expectedCash.toLocaleString()} UZS</strong>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                        <span>Haqiqiy kassa:</span>
                        <strong id="display-actual-cash">0 UZS</strong>
                    </div>
                    <div style="display: flex; justify-content: space-between; padding-top: 10px; border-top: 1px solid var(--glass-border);">
                        <span style="font-weight: 600; color: var(--accent-red);">KAMOMAD:</span>
                        <strong id="display-shortage" style="color: var(--accent-red); font-size: 1.3rem;">0 UZS</strong>
                    </div>
                    <p style="margin-top: 15px; font-size: 0.9rem; color: var(--text-secondary);">
                        ⚠️ Bu summa avtomatik kassir hisobiga yoziladi va Owner'ga xabar yuboriladi.
                    </p>
                </div>
                
                <input type="hidden" id="shortage-input" value="0" />
                <input type="hidden" id="expected-cash-input" value="${expectedCash}" />
                
                <!-- Yetmagan mahsulotlar ro'yxati -->
                <div id="shortage-items-container" style="display: none; margin-bottom: 20px; border: 1px solid var(--glass-border); border-radius: 8px; padding: 15px; background: rgba(239,68,68,0.05);">
                    <h5 style="margin-bottom: 15px; color: var(--accent-red);">📦 Yetmagan Mahsulotlar (ixtiyoriy)</h5>
                    
                    <div id="shortage-items-list" style="margin-bottom: 15px;">
                        <!-- Items will be added here dynamically -->
                    </div>
                    
                    <button onclick="addShortageItem()" style="width: 100%; padding: 10px; background: rgba(59,130,246,0.2); color: var(--accent-blue); border: 1px solid var(--accent-blue); border-radius: 6px; cursor: pointer; font-weight: 500;">
                        ➕ Mahsulot Qo'shish
                    </button>
                </div>
                
                <!-- IKKI TUGMA: Oddiy yopish va Kamomad bilan yopish -->
                <div style="display: flex; gap: 15px;">
                    <button onclick="closeShift(false)" id="close-shift-btn" class="shift-btn btn-close-shift" style="flex: 1;">
                        ✅ Smenani Yopish
                    </button>
                    <button onclick="closeShift(true)" id="close-shortage-btn" class="shift-btn" style="flex: 1; background: rgba(239, 68, 68, 0.3); border: 2px solid var(--accent-red); display: none;">
                        🚨 Kamomad bilan Yopish
                    </button>
                </div>
            </div>
        `;

    } catch (error) {
        container.innerHTML = `<p style="color: var(--accent-red); text-align: center;">❌ ${error.message}</p>`;
    }
}

// ========================================
// AVTOMATIK KAMOMAD HISOBLASH (Frontend)
// ========================================
function calculateShortage(expectedCash) {
    const endCashInput = document.getElementById('end-cash-input');
    const shortageInput = document.getElementById('shortage-input');
    const shortageInfo = document.getElementById('auto-shortage-info');
    const shortageContainer = document.getElementById('shortage-items-container');
    const displayActual = document.getElementById('display-actual-cash');
    const displayShortage = document.getElementById('display-shortage');
    const closeNormalBtn = document.getElementById('close-shift-btn');
    const closeShortageBtn = document.getElementById('close-shortage-btn');

    const actualCash = parseFloat(endCashInput.value) || 0;
    const shortage = expectedCash - actualCash;

    if (actualCash > 0 && Math.abs(shortage) > 1) {
        // Kamomad bor - ko'rsat
        shortageInfo.style.display = 'block';
        shortageContainer.style.display = 'block';
        displayActual.innerText = actualCash.toLocaleString() + ' UZS';
        displayShortage.innerText = shortage.toLocaleString() + ' UZS';
        shortageInput.value = shortage;

        // "Kamomad bilan Yopish" tugmasini ko'rsat
        closeShortageBtn.style.display = 'block';

        // Auto add first shortage item if none exist
        if (shortageItemsList.length === 0) {
            addShortageItem();
        }
    } else {
        // Kamomad yo'q - oddiy yopish
        shortageInfo.style.display = 'none';
        shortageContainer.style.display = 'none';
        shortageInput.value = 0;
        shortageItemsList = [];
        document.getElementById('shortage-items-list').innerHTML = '';

        // "Kamomad bilan Yopish" tugmasini yashir
        closeShortageBtn.style.display = 'none';
    }
}


// Global array for shortage items
let shortageItemsList = [];

// Toggle shortage items section
function toggleShortageItems() {
    const shortage = parseFloat(document.getElementById('shortage-input').value) || 0;
    const container = document.getElementById('shortage-items-container');

    if (shortage > 0) {
        container.style.display = 'block';
        if (shortageItemsList.length === 0) {
            addShortageItem(); // Add first item automatically
        }
    } else {
        container.style.display = 'none';
        shortageItemsList = [];
        document.getElementById('shortage-items-list').innerHTML = '';
    }
}

// Add shortage item entry
function addShortageItem() {
    const itemId = Date.now();
    const itemsContainer = document.getElementById('shortage-items-list');

    const itemHtml = `
        <div id="shortage-item-${itemId}" style="background: var(--bg-darker); padding: 15px; border-radius: 8px; margin-bottom: 10px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                <h6 style="margin: 0;">Mahsulot #${shortageItemsList.length + 1}</h6>
                <button onclick="removeShortageItem(${itemId})" style="background: transparent; color: var(--accent-red); border: none; cursor: pointer; font-size: 1.2rem;">🗑️</button>
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 10px;">
                <div>
                    <label style="display: block; font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 3px;">Mahsulot Nomi*</label>
                    <input type="text" id="item-name-${itemId}" class="debt-input" placeholder="Coca-Cola" style="width: 100%; padding: 8px;" required />
                </div>
                <div>
                    <label style="display: block; font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 3px;">Shtrix-kod</label>
                    <input type="text" id="item-barcode-${itemId}" class="debt-input" placeholder="1111" style="width: 100%; padding: 8px;" />
                </div>
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                <div>
                    <label style="display: block; font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 3px;">Narxi (UZS)*</label>
                    <input type="number" id="item-price-${itemId}" class="debt-input" placeholder="13000" style="width: 100%; padding: 8px;" required />
                </div>
                <div>
                    <label style="display: block; font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 3px;">Miqdor</label>
                    <input type="number" id="item-quantity-${itemId}" class="debt-input" placeholder="1" value="1" style="width: 100%; padding: 8px;" />
                </div>
            </div>
        </div>
    `;

    itemsContainer.insertAdjacentHTML('beforeend', itemHtml);
    shortageItemsList.push(itemId);
}

// Remove shortage item
function removeShortageItem(itemId) {
    const element = document.getElementById(`shortage-item-${itemId}`);
    if (element) {
        element.remove();
        shortageItemsList = shortageItemsList.filter(id => id !== itemId);
    }
}

// Get shortage items data
function getShortageItemsData() {
    const items = [];

    for (const itemId of shortageItemsList) {
        const name = document.getElementById(`item-name-${itemId}`)?.value.trim();
        const barcode = document.getElementById(`item-barcode-${itemId}`)?.value.trim();
        const price = parseFloat(document.getElementById(`item-price-${itemId}`)?.value);
        const quantity = parseInt(document.getElementById(`item-quantity-${itemId}`)?.value) || 1;

        if (name && price) {
            items.push({
                product_name: name,
                barcode: barcode || null,
                price: price,
                quantity: quantity
            });
        }
    }

    return items;
}

// Open Shift
async function openShift() {
    const startCash = parseFloat(document.getElementById('start-cash-input').value);

    if (!startCash || startCash < 0) {
        showToast('⚠️ To\'g\'ri summa kiriting!', 'error');
        return;
    }

    const userId = localStorage.getItem("userId") || 1;

    try {
        const response = await fetch(`${API_URL}/shifts/open?user_id=${userId}`, {
            method: 'POST',
            headers: {
                ...getAuthHeaders(),
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ start_cash: startCash })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || "Smenani ochishda xatolik");
        }

        showToast('✅ Smena muvaffaqiyatli ochildi!', 'success');
        checkShiftStatus(); // Refresh

    } catch (error) {
        showToast(getErrorMessage(error.message, "Smena ochish"), 'error');
        console.error("Open shift error:", error);
    }
}

// Close Shift (confirmShortage = false oddiy yopish, true = kamomad bilan yopish)
async function closeShift(confirmShortage = false) {
    const endCash = parseFloat(document.getElementById('end-cash-input').value);
    const shortage = parseFloat(document.getElementById('shortage-input').value) || 0;
    const expectedCash = parseFloat(document.getElementById('expected-cash-input').value) || 0;

    if (!endCash || endCash < 0) {
        showToast('⚠️ Yakuniy kassa summasini kiriting!', 'error');
        return;
    }

    // Kamomad bormi tekshir
    const calculatedShortage = expectedCash - endCash;

    // Agar kamomad bor va confirmShortage = false bo'lsa, xato ber
    if (Math.abs(calculatedShortage) > 1 && !confirmShortage) {
        showToast(`❌ Xato summa! Kutilgan: ${expectedCash.toLocaleString()} UZS, Kiritilgan: ${endCash.toLocaleString()} UZS. To'g'ri summa kiriting yoki "Kamomad bilan Yopish" tugmasini bosing.`, 'error');
        return;
    }

    // Get shortage items
    let shortageItems = [];
    if (confirmShortage && shortage > 0) {
        shortageItems = getShortageItemsData();
        // Mahsulotlar ro'yxati ixtiyoriy - majburiy emas
    }

    const userId = localStorage.getItem("userId") || 1;

    try {
        const response = await fetch(`${API_URL}/shifts/close?user_id=${userId}`, {
            method: 'POST',
            headers: {
                ...getAuthHeaders(),
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                end_cash: endCash,
                confirm_shortage: confirmShortage,  // MUHIM: Backend uchun
                shortage_amount: shortage,
                shortage_items: shortageItems
            })
        });

        if (!response.ok) {
            const error = await response.json();

            // Check if it's Yellow Basket error
            if (error.detail && error.detail.includes("sariq savat")) {
                showToast(`⚠️ ${error.detail}`, 'error');
                if (confirm("Sariq Savat'ga o'tib tekshirasizmi?")) {
                    loadYellowBasket();
                }
                return;
            }

            throw new Error(error.detail || "Smenani yopishda xatolik");
        }

        showToast('✅ Smena muvaffaqiyatli yopildi!', 'success');

        if (confirmShortage && shortage > 0) {
            showToast(`🚨 Kamomad (${shortage.toLocaleString()} UZS) Owner'ga yuborildi va kassir hisobiga yozildi!`, 'warning');
        }

        // Reset shortage items
        shortageItemsList = [];

        setTimeout(() => checkShiftStatus(), 1000); // Refresh after 1 sec

    } catch (error) {
        showToast(getErrorMessage(error.message, "Smena yopish"), 'error');
        console.error("Close shift error:", error);
    }
}



function loadReports() {
    setActiveMenu('loadReports');
    document.getElementById('page-title').innerText = "Hisobotlar";
    showSection('dashboard-view');

    const mainContent = document.querySelector('.view-container');
    const today = new Date().toISOString().split('T')[0];

    mainContent.innerHTML = `
        <style>
            .report-card { background: var(--glass-bg); border-radius: 16px; padding: 25px; margin-bottom: 20px; }
            .report-stat { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid var(--glass-border); }
            .report-stat:last-child { border-bottom: none; }
            .report-label { color: var(--text-secondary); }
            .report-value { font-weight: 600; color: var(--accent-green); }
            .export-btn { padding: 12px 24px; border-radius: 8px; cursor: pointer; font-weight: 500; transition: all 0.3s; border: none; }
            .export-csv { background: rgba(34, 197, 94, 0.2); color: var(--accent-green); border: 1px solid var(--accent-green); }
            .date-input { background: #FFFFFF; border: 1px solid #E2E8F0; padding: 8px 12px; border-radius: 6px; box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05); color: #020817; color-scheme: light; }
        </style>
        
        <div class="report-card">
            <h3 style="margin-bottom: 20px;">📅 Kunlik Hisobot</h3>
            <div style="display: flex; gap: 15px; align-items: center; margin-bottom: 20px;">
                <input type="date" id="report-date" class="date-input" value="${today}" onchange="fetchDailyReport()" />
                <button onclick="fetchDailyReport()" class="export-btn" style="background: var(--accent-blue); color: white;">🔄 Ko'rish</button>
            </div>
            <div id="daily-report-content">
                <p style="text-align: center; color: var(--text-secondary);">⏳ Yuklanmoqda...</p>
            </div>
        </div>
        
        <div class="report-card">
            <h3 style="margin-bottom: 20px;">📤 Hisobot Eksport</h3>
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin-bottom: 20px;">
                <div>
                    <label style="display: block; margin-bottom: 8px; color: var(--text-secondary);">Boshlang'ich sana:</label>
                    <input type="date" id="export-start" class="date-input" style="width: 100%;" value="${today}" />
                </div>
                <div>
                    <label style="display: block; margin-bottom: 8px; color: var(--text-secondary);">Tugatish sana:</label>
                    <input type="date" id="export-end" class="date-input" style="width: 100%;" value="${today}" />
                </div>
            </div>
            <div style="display: flex; gap: 15px;">
                <button onclick="exportTaxReport()" class="export-btn export-csv">📊 CSV Export (Soliq Hisoboti)</button>
            </div>
        </div>
        
        <div class="report-card">
            <h3 style="margin-bottom: 20px;">📈 Umumiy Statistika</h3>
            <div id="general-stats">
                <p style="text-align: center; color: var(--text-secondary);">⏳ Yuklanmoqda...</p>
            </div>
        </div>
    `;

    // Load initial data
    fetchDailyReport();
    fetchGeneralStats();
}

async function fetchDailyReport() {
    const date = document.getElementById('report-date').value;
    const container = document.getElementById('daily-report-content');

    try {
        const response = await fetch(`${API_URL}/reports/daily-sales?target_date=${date}`, {
            headers: getAuthHeaders()
        });

        if (!response.ok) throw new Error("Hisobotni yuklashda xatolik");

        const report = await response.json();

        container.innerHTML = `
            <div class="report-stat">
                <span class="report-label">📦 Jami savdolar soni:</span>
                <span class="report-value">${report.transaction_count}</span>
            </div>
            <div class="report-stat">
                <span class="report-label">💰 Umumiy summa:</span>
                <span class="report-value">${parseFloat(report.total_sales || 0).toLocaleString()} UZS</span>
            </div>
            <div class="report-stat">
                <span class="report-label">💵 Naqd to'lov:</span>
                <span class="report-value">${parseFloat(report.total_cash || 0).toLocaleString()} UZS</span>
            </div>
            <div class="report-stat">
                <span class="report-label">💳 Karta to'lov:</span>
                <span class="report-value" style="color: var(--accent-blue);">${parseFloat(report.total_card || 0).toLocaleString()} UZS</span>
            </div>
        `;
    } catch (error) {
        container.innerHTML = `<p style="color: var(--accent-red);">❌ ${error.message}</p>`;
    }
}

async function fetchGeneralStats() {
    const container = document.getElementById('general-stats');

    try {
        const response = await fetch(`${API_URL}/reports/dashboard`, {
            headers: getAuthHeaders()
        });

        if (!response.ok) throw new Error("Statistikani yuklashda xatolik");

        const stats = await response.json();

        container.innerHTML = `
            <div class="report-stat">
                <span class="report-label">📅 Bugungi savdo:</span>
                <span class="report-value">${parseFloat(stats.today_sales || 0).toLocaleString()} UZS</span>
            </div>
            <div class="report-stat">
                <span class="report-label">📆 Oylik savdo (30 kun):</span>
                <span class="report-value">${parseFloat(stats.monthly_sales || 0).toLocaleString()} UZS</span>
            </div>
            <div class="report-stat">
                <span class="report-label">📒 Faol qarzlar:</span>
                <span class="report-value" style="color: var(--accent-red);">${parseFloat(stats.active_debts || 0).toLocaleString()} UZS</span>
            </div>
            <div class="report-stat">
                <span class="report-label">⚠️ Kam qolgan mahsulotlar:</span>
                <span class="report-value" style="color: orange;">${stats.low_stock_items || 0} ta</span>
            </div>
        `;
    } catch (error) {
        container.innerHTML = `<p style="color: var(--accent-red);">❌ ${error.message}</p>`;
    }
}

function exportTaxReport() {
    const startDate = document.getElementById('export-start').value;
    const endDate = document.getElementById('export-end').value;

    if (!startDate || !endDate) {
        alert("⚠️ Sanalarni tanlang!");
        return;
    }

    // Trigger download
    window.open(`${API_URL}/reports/export/tax?start_date=${startDate}&end_date=${endDate}`, '_blank');
    alert("✅ CSV fayl yuklab olindi!");
}

// ========================================
// EXPIRING PRODUCTS (Placeholder)
// ========================================
function loadExpiringProducts() {
    setActiveMenu('loadExpiringProducts');
    document.getElementById('page-title').innerText = "Muddati Oz Qolganlar";

    showSection('dashboard-view'); // Ensure container is visible

    const mainContent = document.querySelector('.view-container');
    mainContent.innerHTML = `
        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 400px; text-align: center; color: var(--text-secondary);">
            <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-alert-triangle" style="color: var(--accent-yellow); margin-bottom: 20px;">
                <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                <path d="M12 9v4" />
                <path d="M12 17h.01" />
            </svg>
            <h2 style="color: var(--text-primary); margin-bottom: 10px;">Tez Orada!</h2>
            <p>Muddati oz qolgan mahsulotlar bo'limi ishlab chiqilmoqda.</p>
        </div>
    `;

    showToast("Bo'lim tez orada ishga tushadi", 'info');
}

// ========================================
// PRODUCTS MANAGEMENT (Owner - Full View)
// ========================================
function loadProducts() {
    setActiveMenu('loadProducts');
    document.getElementById('page-title').innerText = "Mahsulotlar";
    showSection('dashboard-view');

    const mainContent = document.querySelector('.view-container');
    const isOwner = currentUser.role === 'owner';

    mainContent.innerHTML = `
        <style>
            .product-table { width: 100%; border-collapse: collapse; }
            .product-table th, .product-table td { padding: 12px; text-align: left; border-bottom: 1px solid var(--glass-border); }
            .product-table th { background: rgba(255,255,255,0.05); font-weight: 600; }
            .btn-edit { padding: 6px 12px; background: var(--accent-blue); color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 0.85rem; margin-right: 5px; }
            .btn-delete { padding: 6px 12px; background: rgba(239,68,68,0.2); color: var(--accent-red); border: 1px solid var(--accent-red); border-radius: 4px; cursor: pointer; font-size: 0.85rem; }
            .btn-add { padding: 10px 20px; background: var(--accent-green); color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 500; }
            .stock-low { color: var(--accent-red); font-weight: 600; }
            .stock-ok { color: var(--accent-green); }
        </style>
        
        <div class="card glass" style="padding: 20px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h3>📦 Mahsulotlar Ro'yxati</h3>
                <div style="display: flex; gap: 10px;">
                    ${isOwner ? '<button onclick="openAddProductModal()" class="btn-add">➕ Yangi Mahsulot</button>' : ''}
                    <button onclick="loadProducts()" style="background: var(--accent-blue); color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer;">🔄 Yangilash</button>
                </div>
            </div>
            
            <div id="products-loading" style="text-align: center; padding: 40px;">
                <p>⏳ Yuklanmoqda...</p>
            </div>
            
            <table class="product-table" id="products-table" style="display: none;">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Shtrix-kod</th>
                        <th>Nomi</th>
                        ${isOwner ? '<th>Tannarx</th>' : ''}
                        <th>Sotuv Narxi</th>
                        ${isOwner ? '<th>Stock</th>' : ''}
                        ${isOwner ? '<th>Amal</th>' : ''}
                    </tr>
                </thead>
                <tbody id="products-body"></tbody>
            </table>
        </div>

        ${isOwner ? `
        <!-- Add Product Modal (Owner only) -->
        <div id="add-product-modal" style="display: none; position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.7); z-index: 1000; align-items: center; justify-content: center;">
            <div style="background: var(--bg-darker); padding: 30px; border-radius: 16px; width: 400px; max-width: 90%;">
                <h3 style="margin-bottom: 20px;">➕ Yangi Mahsulot Qo'shish</h3>
                <div style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 5px; color: var(--text-secondary);">Shtrix-kod:</label>
                    <input type="text" id="new-product-barcode" class="debt-input" placeholder="1111" />
                </div>
                <div style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 5px; color: var(--text-secondary);">Mahsulot Nomi:</label>
                    <input type="text" id="new-product-name" class="debt-input" placeholder="Coca-Cola 1.5L" />
                </div>
                <div style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 5px; color: var(--text-secondary);">Tannarx (UZS):</label>
                    <input type="number" id="new-product-cost" class="debt-input" placeholder="8000" />
                </div>
                <div style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 5px; color: var(--text-secondary);">Sotuv Narxi (UZS):</label>
                    <input type="number" id="new-product-price" class="debt-input" placeholder="13000" />
                </div>
                <div style="margin-bottom: 20px;">
                    <label style="display: block; margin-bottom: 5px; color: var(--text-secondary);">Boshlang'ich Stock:</label>
                    <input type="number" id="new-product-stock" class="debt-input" placeholder="100" />
                </div>
                <div style="display: flex; gap: 10px;">
                    <button onclick="saveNewProduct()" style="flex: 1; padding: 12px; background: var(--accent-green); color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 500;">✓ Saqlash</button>
                    <button onclick="closeProductModal()" style="flex: 1; padding: 12px; background: rgba(239,68,68,0.2); color: var(--accent-red); border: 1px solid var(--accent-red); border-radius: 8px; cursor: pointer;">Bekor</button>
                </div>
            </div>
        </div>
        
        <!-- Edit Modal (Owner only) -->
        <div id="edit-product-modal" style="display: none; position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.7); z-index: 1000; align-items: center; justify-content: center;">
            <div style="background: var(--bg-darker); padding: 30px; border-radius: 16px; width: 400px; max-width: 90%;">
                <h3 style="margin-bottom: 20px;">✏️ Mahsulot Tahrirlash</h3>
                <input type="hidden" id="edit-product-id" />
                <div style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 5px; color: var(--text-secondary);">Nomi:</label>
                    <input type="text" id="edit-product-name" class="debt-input" />
                </div>
                <div style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 5px; color: var(--text-secondary);">Tannarx:</label>
                    <input type="number" id="edit-product-cost" class="debt-input" />
                </div>
                <div style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 5px; color: var(--text-secondary);">Sotuv Narxi:</label>
                    <input type="number" id="edit-product-price" class="debt-input" />
                </div>
                <div style="margin-bottom: 20px;">
                    <label style="display: block; margin-bottom: 5px; color: var(--text-secondary);">Stock:</label>
                    <input type="number" id="edit-product-stock" class="debt-input" />
                </div>
                <div style="display: flex; gap: 10px;">
                    <button onclick="saveEditedProduct()" style="flex: 1; padding: 12px; background: var(--accent-green); color: white; border: none; border-radius: 8px; cursor: pointer;">✓ Saqlash</button>
                    <button onclick="closeProductModal()" style="flex: 1; padding: 12px; background: rgba(239,68,68,0.2); color: var(--accent-red); border: 1px solid var(--accent-red); border-radius: 8px; cursor: pointer;">Bekor</button>
                </div>
            </div>
        </div>
        ` : ''}
    `;

    fetchProducts();
}

async function fetchProducts() {
    const loading = document.getElementById('products-loading');
    const table = document.getElementById('products-table');
    const tbody = document.getElementById('products-body');
    const isOwner = currentUser.role === 'owner';

    try {
        const response = await fetch(`${API_URL}/products/`, {
            headers: getAuthHeaders()
        });

        if (!response.ok) throw new Error("Mahsulotlarni yuklashda xatolik");

        const products = await response.json();
        loading.style.display = 'none';
        table.style.display = 'table';

        tbody.innerHTML = products.map(p => `
            <tr>
                <td>${p.id}</td>
                <td>${p.barcode}</td>
                <td>${p.name}</td>
                ${isOwner ? `<td>${p.cost_price ? parseFloat(p.cost_price).toLocaleString() : '-'} UZS</td>` : ''}
                <td>${parseFloat(p.price).toLocaleString()} UZS</td>
                ${isOwner ? `<td class="${p.stock_quantity < 10 ? 'stock-low' : 'stock-ok'}">${p.stock_quantity}</td>` : ''}
                ${isOwner ? `<td>
                    <button class="btn-edit" onclick="editProduct(${p.id}, '${p.name.replace(/'/g, "\\'")}', ${p.cost_price || 0}, ${p.price}, ${p.stock_quantity})">✏️</button>
                    <button class="btn-delete" onclick="deleteProduct(${p.id}, '${p.name.replace(/'/g, "\\'")}')">🗑️</button>
                </td>` : ''}
            </tr>
        `).join('');

    } catch (error) {
        console.error("Products error:", error);
        loading.innerHTML = `<p style="color: var(--accent-red);">❌ ${error.message}</p>`;
    }
}

// Open Add Product Modal
function openAddProductModal() {
    document.getElementById('new-product-barcode').value = '';
    document.getElementById('new-product-name').value = '';
    document.getElementById('new-product-cost').value = '';
    document.getElementById('new-product-price').value = '';
    document.getElementById('new-product-stock').value = '';
    document.getElementById('add-product-modal').style.display = 'flex';
}

// Save New Product
async function saveNewProduct() {
    const data = {
        barcode: document.getElementById('new-product-barcode').value.trim(),
        name: document.getElementById('new-product-name').value.trim(),
        cost_price: parseFloat(document.getElementById('new-product-cost').value),
        price: parseFloat(document.getElementById('new-product-price').value),
        stock_quantity: parseInt(document.getElementById('new-product-stock').value)
    };

    // Validation
    if (!data.barcode || !data.name || !data.cost_price || !data.price || !data.stock_quantity) {
        showToast('⚠️ Barcha maydonlarni to\'ldiring!', 'error');
        return;
    }

    if (data.price <= data.cost_price) {
        showToast('⚠️ Sotuv narxi tannarxdan katta bo\'lishi kerak!', 'error');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/products/`, {
            method: 'POST',
            headers: {
                ...getAuthHeaders(),
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || "Mahsulot qo'shishda xatolik");
        }

        showToast('✅ Mahsulot muvaffaqiyatli qo\'shildi!', 'success');
        closeProductModal();
        fetchProducts();

    } catch (error) {
        showToast(getErrorMessage(error.message, "Mahsulot qo'shish"), 'error');
        console.error("Add product error:", error);
    }
}

// Open Edit Product Modal
function editProduct(id, name, cost, price, stock) {
    document.getElementById('edit-product-id').value = id;
    document.getElementById('edit-product-name').value = name;
    document.getElementById('edit-product-cost').value = cost;
    document.getElementById('edit-product-price').value = price;
    document.getElementById('edit-product-stock').value = stock;
    document.getElementById('edit-product-modal').style.display = 'flex';
}

// Save Edited Product
async function saveEditedProduct() {
    const id = document.getElementById('edit-product-id').value;
    const data = {
        name: document.getElementById('edit-product-name').value.trim(),
        cost_price: parseFloat(document.getElementById('edit-product-cost').value),
        price: parseFloat(document.getElementById('edit-product-price').value),
        stock_quantity: parseInt(document.getElementById('edit-product-stock').value)
    };

    // Validation
    if (!data.name || !data.cost_price || !data.price || data.stock_quantity === null) {
        showToast('⚠️ Barcha maydonlarni to\'ldiring!', 'error');
        return;
    }

    if (data.price <= data.cost_price) {
        showToast('⚠️ Sotuv narxi tannarxdan katta bo\'lishi kerak!', 'error');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/products/${id}`, {
            method: 'PUT',
            headers: {
                ...getAuthHeaders(),
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || "Saqlashda xatolik");
        }

        showToast('✅ Mahsulot yangilandi!', 'success');
        closeProductModal();
        fetchProducts();

    } catch (error) {
        showToast(getErrorMessage(error.message, "Mahsulot yangilash"), 'error');
        console.error("Update product error:", error);
    }
}

// Delete Product
async function deleteProduct(id, name) {
    if (!confirm(`Haqiqatan ham "${name}" mahsulotini o'chirmoqchimisiz?`)) {
        return;
    }

    try {
        const response = await fetch(`${API_URL}/products/${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || "O'chirishda xatolik");
        }

        showToast(`✅ "${name}" mahsuloti o'chirildi!`, 'success');
        fetchProducts();

    } catch (error) {
        showToast(getErrorMessage(error.message, "Mahsulot o'chirish"), 'error');
        console.error("Delete product error:", error);
    }
}

// Close Product Modal (both add and edit)
function closeProductModal() {
    const addModal = document.getElementById('add-product-modal');
    const editModal = document.getElementById('edit-product-modal');
    if (addModal) addModal.style.display = 'none';
    if (editModal) editModal.style.display = 'none';
}


// ========================================
// USERS MANAGEMENT (Owner only)
// ========================================


// ========================================
// HELPER: Switch Views
// ========================================
function showSection(sectionId) {
    // Barcha ochiq modallarni yopish — bo'limlar o'rtasida o'tishda
    const modals = document.querySelectorAll('#modal-add-user, #modal-password, #payment-modal');
    modals.forEach(modal => {
        if (modal) modal.style.display = 'none';
    });

    // Hide all sections first
    const viewContainer = document.querySelector('.view-container');
    const usersSection = document.getElementById('section-users');

    // Reset all menu items active state
    document.querySelectorAll('.menu a').forEach(a => a.classList.remove('active'));

    if (sectionId === 'section-users') {
        if (viewContainer) viewContainer.style.display = 'none';
        if (usersSection) usersSection.style.display = 'block';

        // Set active menu for Users
        const usersBtn = document.getElementById('menu-users');
        if (usersBtn) usersBtn.classList.add('active');
    } else {
        if (usersSection) usersSection.style.display = 'none';
        if (viewContainer) viewContainer.style.display = 'block';
    }
}

// ========================================
// USERS MANAGEMENT (Owner only)
// ========================================
async function loadUsers() {
    if (currentUser.role !== 'owner') {
        alert('⚠️ Faqat Owner xodimlarni ko\'ra oladi!');
        return;
    }

    setActiveMenu('loadUsers');
    document.getElementById('page-title').innerText = "Xodimlar";

    // Switch to Users Section (Static HTML)
    showSection('section-users');

    const loadingDiv = document.getElementById('users-loading');
    const tableIndex = document.getElementById('users-table');
    const tbody = document.getElementById('users-body');

    // Reset State
    loadingDiv.style.display = 'block';
    loadingDiv.innerHTML = '<p>⏳ Yuklanmoqda...</p>';
    tableIndex.style.display = 'none';
    tbody.innerHTML = '';

    try {
        const response = await fetch(`${API_URL}/auth/users`, {
            headers: getAuthHeaders()
        });

        if (response.status === 401) {
            logout();
            return;
        }

        if (response.status === 403) {
            loadingDiv.innerHTML = `
                <div style="background: rgba(239, 68, 68, 0.1); padding: 20px; border-radius: 8px;">
                    <h3 style="color: var(--accent-red);">⛔ Kirish taqiqlangan</h3>
                    <p>Sizda bu ma'lumotlarni ko'rish huquqi yo'q.</p>
                </div>
            `;
            return;
        }

        if (!response.ok) {
            throw new Error("Users ro'yxatini olishda xatolik");
        }

        const users = await response.json();
        renderUsersTable(users);

    } catch (error) {
        console.error("Users error:", error);
        loadingDiv.innerHTML = `
            <p style="color: var(--accent-red);">❌ Xatolik: ${error.message}</p>
        `;
    }
}

function renderUsersTable(users) {
    document.getElementById('users-loading').style.display = 'none';
    document.getElementById('users-table').style.display = 'table';

    const tbody = document.getElementById('users-body');
    tbody.innerHTML = users.map(user => `
        <tr>
            <td>${user.id}</td>
            <td>${user.full_name}</td>
            <td>${user.username}</td>
            <td>
                <span class="badge ${user.role === 'owner' ? 'completed' : 'debt'}">
                    ${user.role.toUpperCase()}
                </span>
            </td>
            <td>
                <span class="badge ${user.is_active ? 'completed' : 'cancelled'}">
                    ${user.is_active ? '✓ Aktiv' : '✗ Bloklangan'}
                </span>
            </td>
            <td>
                ${user.role === 'owner' ?
            '<span style="color: var(--text-secondary);">—</span>' :
            `<div style="display: flex; gap: 6px; flex-wrap: wrap;">
                        <button onclick="openPasswordModal(${user.id}, '${user.full_name.replace(/'/g, "\\'")}')" title="Parol o'zgartirish"
                            style="padding: 6px 10px; background: rgba(245, 158, 11, 0.2); color: #f59e0b; border: 1px solid rgba(245, 158, 11, 0.4); border-radius: 6px; cursor: pointer; font-size: 0.9rem; transition: all 0.2s;">🔑</button>
                        ${user.is_active ?
                `<button onclick="blockUser(${user.id})" title="Bloklash"
                                style="padding: 6px 10px; background: rgba(239, 68, 68, 0.2); color: var(--accent-red); border: 1px solid rgba(239, 68, 68, 0.4); border-radius: 6px; cursor: pointer; font-size: 0.9rem; transition: all 0.2s;">🔒</button>` :
                `<button onclick="unblockUser(${user.id})" title="Faollashtirish"
                                style="padding: 6px 10px; background: rgba(34, 197, 94, 0.2); color: var(--accent-green); border: 1px solid rgba(34, 197, 94, 0.4); border-radius: 6px; cursor: pointer; font-size: 0.9rem; transition: all 0.2s;">🔓</button>`
            }
                        <button onclick="deleteUser(${user.id})" title="O'chirish"
                            style="padding: 6px 10px; background: rgba(239, 68, 68, 0.15); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 6px; cursor: pointer; font-size: 0.9rem; transition: all 0.2s;">🗑️</button>
                    </div>`
        }
            </td>
        </tr>
    `).join('');
}

async function blockUser(userId) {
    if (!confirm("Bu foydalanuvchini bloklaysizmi?")) return;

    try {
        const response = await fetch(`${API_URL}/auth/users/${userId}/block`, {
            method: 'PATCH',
            headers: getAuthHeaders()
        });

        if (response.ok) {
            alert("✅ Foydalanuvchi bloklandi!");
            loadUsers();
        } else {
            const error = await response.json();
            alert(`❌ Xatolik: ${error.detail}`);
        }
    } catch (error) {
        alert(`❌ Xatolik: ${error.message}`);
    }
}

async function unblockUser(userId) {
    try {
        const response = await fetch(`${API_URL}/auth/users/${userId}/unblock`, {
            method: 'PATCH',
            headers: getAuthHeaders()
        });

        if (response.ok) {
            alert("✅ Foydalanuvchi faollashtirildi!");
            loadUsers();
        } else {
            const error = await response.json();
            alert(`❌ Xatolik: ${error.detail}`);
        }
    } catch (error) {
        alert(`❌ Xatolik: ${error.message}`);
    }
}

function setActiveMenu(functionName) {
    const menuItems = document.querySelectorAll('.menu a');
    menuItems.forEach((item) => {
        const onclick = item.getAttribute('onclick');
        if (onclick && onclick.includes(functionName)) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
}

// POS FUNCTIONS
function toggleCustomerInfo() {
    const method = document.getElementById('payment-method').value;
    const customerInfo = document.getElementById('customer-info');
    customerInfo.style.display = method === 'DEBT' ? 'block' : 'none';
}

async function searchProduct() {
    const barcode = document.getElementById('barcode-input').value.trim();

    if (!barcode) {
        alert('⚠️ Shtrix-kod kiriting!');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/products/${barcode}`, {
            headers: getAuthHeaders()
        });

        if (response.ok) {
            const product = await response.json();
            addToCart(product);
            document.getElementById('barcode-input').value = '';
            document.getElementById('barcode-input').focus();
        } else {
            alert(`❌ Mahsulot topilmadi: ${barcode}`);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('❌ Backend bilan boglanishda xatolik!');
    }
}

function addToCart(product) {
    const existing = cart.find(item => item.id === product.id);

    if (existing) {
        existing.quantity += 1;
    } else {
        cart.push({
            id: product.id,
            name: product.name,
            price: product.price,
            barcode: product.barcode,
            quantity: 1
        });
    }

    updateCartUI();
    saveCartToStorage();
}

function updateCartUI() {
    const container = document.getElementById('cart-items');
    const count = document.getElementById('cart-count');
    const total = document.getElementById('cart-total');
    const btn = document.getElementById('checkout-btn');

    if (cart.length === 0) {
        container.innerHTML = '<p style="color: var(--text-secondary); text-align: center; padding: 40px 0;">Savat bo\'sh</p>';
        btn.disabled = true;
    } else {
        container.innerHTML = cart.map(item => `
            <div class="cart-item">
                <div class="cart-item-info">
                    <div class="cart-item-name">${item.name}</div>
                    <div class="cart-item-price">${item.price.toLocaleString()} UZS</div>
                </div>
                <div class="cart-item-actions">
                    <button class="qty-btn" onclick="updateQty(${item.id}, -1)">-</button>
                    <span class="qty-display">${item.quantity}</span>
                    <button class="qty-btn" onclick="updateQty(${item.id}, 1)">+</button>
                    <button class="remove-btn" onclick="removeItem(${item.id})">🗑️</button>
                </div>
            </div>
        `).join('');
        btn.disabled = false;
    }

    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    count.innerText = totalItems;
    total.innerText = totalAmount.toLocaleString() + ' UZS';
}

function updateQty(id, change) {
    const item = cart.find(i => i.id === id);
    if (item) {
        item.quantity += change;
        if (item.quantity <= 0) {
            removeItem(id);
        } else {
            updateCartUI();
            saveCartToStorage();
        }
    }
}

function removeItem(id) {
    cart = cart.filter(item => item.id !== id);
    updateCartUI();
    saveCartToStorage();
}

function clearCart() {
    if (cart.length === 0) return;
    if (confirm('Savatni tozalash?')) {
        cart = [];
        updateCartUI();
        saveCartToStorage();
    }
}

async function processCheckout() {
    if (cart.length === 0) {
        alert('⚠️ Savat bosh!');
        return;
    }

    const method = document.getElementById('payment-method').value;
    const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    // ========================================
    // GET ACTIVE SHIFT ID (MUHIM!)
    // ========================================
    const userId = localStorage.getItem("userId") || 1;
    let activeShiftId = null;

    try {
        const shiftResponse = await fetch(`${API_URL}/shifts/status/${userId}`, {
            headers: getAuthHeaders()
        });

        if (!shiftResponse.ok) {
            alert('⚠️ Faol smena yo\'q! Avval smenani oching.');
            return;
        }

        const shiftData = await shiftResponse.json();
        activeShiftId = shiftData.id;
    } catch (error) {
        console.error('Shift check error:', error);
        alert('❌ Smena holatini tekshirishda xatolik!');
        return;
    }

    const saleData = {
        items: cart.map(item => ({
            barcode: item.barcode,
            quantity: item.quantity
        })),
        payment_method: method,
        shift_id: activeShiftId  // Haqiqiy faol smena ID
    };

    if (method === 'DEBT') {
        const name = document.getElementById('customer-name').value.trim();
        const phone = document.getElementById('customer-phone').value.trim();

        if (!name || !phone) {
            alert('⚠️ Mijoz malumotlarini kiriting!');
            return;
        }

        saleData.customer_name = name;
        saleData.customer_phone = phone;
    }

    try {
        const response = await fetch(`${API_URL}/sales/checkout?user_id=${userId}`, {
            method: 'POST',
            headers: {
                ...getAuthHeaders(),
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(saleData)
        });

        if (response.ok) {
            const result = await response.json();

            todaySalesCount++;
            todaySalesTotal += totalAmount;
            document.getElementById('today-count').innerText = todaySalesCount;
            document.getElementById('today-total').innerText = todaySalesTotal.toLocaleString() + ' UZS';

            showToast(`✅ Savdo yakunlandi! #${result.id} - ${totalAmount.toLocaleString()} UZS`, 'success');

            cart = [];
            updateCartUI();
            saveCartToStorage();

            if (method === 'DEBT') {
                document.getElementById('customer-name').value = '';
                document.getElementById('customer-phone').value = '';
            }

            document.getElementById('barcode-input').focus();
        } else {
            const error = await response.json();
            const errorMsg = Array.isArray(error.detail)
                ? error.detail.map(e => e.msg).join(', ')
                : (error.detail || 'Savdo amalga oshmadi');
            showToast(`❌ Xatolik: ${errorMsg}`, 'error');
        }
    } catch (error) {
        console.error('Checkout error:', error);
        showToast('❌ Backend bilan bog\'lanishda xatolik!', 'error');
    }
}

// DASHBOARD DATA
async function fetchDashboardData() {
    try {
        const response = await fetch(`${API_URL}/reports/dashboard`, {
            headers: getAuthHeaders()
        });

        if (!response.ok) {
            let errMsg = "Dashboard ma'lumotlarini yuklashda xatolik";
            try {
                const errData = await response.json();
                errMsg = errData.detail || errData.message || errMsg;
            } catch (e) {
                errMsg += ` (${response.status} ${response.statusText})`;
            }
            throw new Error(errMsg);
        }

        const stats = await response.json();

        // Update stat cards with real data
        const totalSales = document.getElementById('total-sales');
        const cashFlow = document.getElementById('cash-flow');
        const activeDebts = document.getElementById('active-debts');
        const lowStock = document.getElementById('low-stock');
        const totalProducts = document.getElementById('total-products');

        if (totalSales) {
            totalSales.innerText = parseFloat(stats.today_sales || 0).toLocaleString() + " UZS";
        }
        if (cashFlow) {
            // Use actual cash_in_register from API (start_cash + CASH sales in active shift)
            cashFlow.innerText = parseFloat(stats.cash_in_register || 0).toLocaleString() + " UZS";
        }
        if (activeDebts) {
            activeDebts.innerText = parseFloat(stats.active_debts || 0).toLocaleString() + " UZS";
        }
        if (lowStock) {
            lowStock.innerText = stats.low_stock_items || 0;
        }
        if (totalProducts) {
            totalProducts.innerText = stats.total_products || 0;
        }

        // Fetch Sariq Savat (voided items) statistics
        await fetchVoidStats();

        // Fetch recent transactions (today's sales)
        await fetchRecentTransactions();

    } catch (error) {
        console.error("Dashboard error:", error);

        const totalSales = document.getElementById('total-sales');
        if (totalSales) {
            totalSales.innerText = "Xatolik yuz berdi";
            totalSales.style.color = "var(--accent-red)";
        }
    }
}

// ========================================
// ANALYTICS PAGE (Full View)
// ========================================
function loadAnalytics() {
    setActiveMenu('loadAnalytics');
    document.getElementById('page-title').innerText = "Analitika";

    const mainContent = document.querySelector('.view-container');
    mainContent.innerHTML = `
        <div class="card glass" style="padding: 25px; margin-bottom: 20px;">
            <h3 style="color: var(--text-primary); margin-bottom: 15px;">📊 Savdo Tahlili</h3>
            <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                <button onclick="loadSalesPeriod('daily')" id="btn-period-daily" style="padding: 10px 20px; border-radius: 10px; border: 1px solid var(--accent-blue, #3b82f6); background: rgba(59,130,246,0.15); color: var(--accent-blue, #3b82f6); cursor: pointer; font-weight: 600; font-size: 0.9rem; transition: all 0.2s;">📅 Kunlik</button>
                <button onclick="loadSalesPeriod('weekly')" id="btn-period-weekly" style="padding: 10px 20px; border-radius: 10px; border: 1px solid var(--glass-border); background: transparent; color: var(--text-secondary); cursor: pointer; font-weight: 600; font-size: 0.9rem; transition: all 0.2s;">📆 Haftalik</button>
                <button onclick="loadSalesPeriod('monthly')" id="btn-period-monthly" style="padding: 10px 20px; border-radius: 10px; border: 1px solid var(--glass-border); background: transparent; color: var(--text-secondary); cursor: pointer; font-weight: 600; font-size: 0.9rem; transition: all 0.2s;">🗓️ Oylik</button>
            </div>
            <div id="analytics-sales-content" style="margin-top: 20px;">
                <p style="text-align: center; padding: 30px; color: var(--text-secondary);">⬆️ Davrni tanlang</p>
            </div>
        </div>

        <div class="card glass" style="padding: 25px;">
            <h3 style="color: var(--text-primary); margin-bottom: 15px;">🏆 Mahsulotlar Reytingi <span style="font-size: 0.8rem; font-weight: 400; color: var(--text-secondary);">(oxirgi 30 kun)</span></h3>
            <div style="display: flex; gap: 15px; flex-wrap: wrap; margin-bottom: 15px; font-size: 0.8rem;">
                <span style="display: flex; align-items: center; gap: 5px;"><span style="width: 12px; height: 12px; border-radius: 50%; background: #3b82f6; display: inline-block;"></span> Ko'p sotilgan</span>
                <span style="display: flex; align-items: center; gap: 5px;"><span style="width: 12px; height: 12px; border-radius: 50%; background: #eab308; display: inline-block;"></span> O'rtacha</span>
                <span style="display: flex; align-items: center; gap: 5px;"><span style="width: 12px; height: 12px; border-radius: 50%; background: #ef4444; display: inline-block;"></span> Kam sotilgan</span>
                <span style="display: flex; align-items: center; gap: 5px;"><span style="width: 12px; height: 12px; border-radius: 50%; background: #374151; display: inline-block;"></span> Sotilmagan</span>
            </div>
            <div id="analytics-products-content">
                <p style="text-align: center; padding: 30px; color: var(--text-secondary);">⏳ Yuklanmoqda...</p>
            </div>
        </div>
    `;

    // Auto-load daily sales and product ranking
    loadSalesPeriod('daily');
    loadProductRanking();
}

async function loadSalesPeriod(period) {
    const content = document.getElementById('analytics-sales-content');
    if (!content) return;

    // Update button styles
    ['daily', 'weekly', 'monthly'].forEach(p => {
        const btn = document.getElementById(`btn-period-${p}`);
        if (btn) {
            if (p === period) {
                btn.style.background = 'rgba(59,130,246,0.15)';
                btn.style.borderColor = 'var(--accent-blue, #3b82f6)';
                btn.style.color = 'var(--accent-blue, #3b82f6)';
            } else {
                btn.style.background = 'transparent';
                btn.style.borderColor = 'var(--glass-border)';
                btn.style.color = 'var(--text-secondary)';
            }
        }
    });

    content.innerHTML = '<p style="text-align: center; padding: 30px; color: var(--text-secondary);">⏳ Yuklanmoqda...</p>';

    try {
        const response = await fetch(`${API_URL}/reports/sales-by-period?period=${period}`, {
            headers: getAuthHeaders()
        });

        if (!response.ok) throw new Error("Ma'lumotlarni yuklashda xatolik");

        const data = await response.json();

        if (data.items.length === 0) {
            content.innerHTML = `
                <div style="text-align: center; padding: 40px;">
                    <p style="font-size: 3rem; margin-bottom: 10px;">📭</p>
                    <p style="color: var(--text-secondary);">Bu davr uchun savdo ma'lumotlari topilmadi</p>
                </div>
            `;
            return;
        }

        let tableRows = data.items.map(item => {
            const d = new Date(item.date);
            const dateStr = d.toLocaleDateString('uz-UZ', { day: '2-digit', month: '2-digit', year: 'numeric' });
            const dayName = d.toLocaleDateString('uz-UZ', { weekday: 'short' });
            return `
                <tr>
                    <td style="padding: 12px 10px; border-bottom: 1px solid var(--glass-border);">
                        <div style="font-weight: 600;">${dateStr}</div>
                        <div style="font-size: 0.75rem; color: var(--text-secondary);">${dayName}</div>
                    </td>
                    <td style="padding: 12px 10px; border-bottom: 1px solid var(--glass-border); font-weight: 600; color: var(--accent-green, #22c55e);">${parseFloat(item.total_sales).toLocaleString()} UZS</td>
                    <td style="padding: 12px 10px; border-bottom: 1px solid var(--glass-border);">${parseFloat(item.total_cash).toLocaleString()} UZS</td>
                    <td style="padding: 12px 10px; border-bottom: 1px solid var(--glass-border);">${parseFloat(item.total_card).toLocaleString()} UZS</td>
                    <td style="padding: 12px 10px; border-bottom: 1px solid var(--glass-border); text-align: center;">${item.transaction_count}</td>
                </tr>
            `;
        }).join('');

        content.innerHTML = `
            <div style="overflow-x: auto;">
                <table style="width: 100%; border-collapse: collapse; font-size: 0.9rem;">
                    <thead>
                        <tr style="border-bottom: 2px solid var(--glass-border);">
                            <th style="padding: 12px 10px; text-align: left; color: var(--text-secondary); font-weight: 500;">Sana</th>
                            <th style="padding: 12px 10px; text-align: left; color: var(--text-secondary); font-weight: 500;">Jami</th>
                            <th style="padding: 12px 10px; text-align: left; color: var(--text-secondary); font-weight: 500;">Naqd</th>
                            <th style="padding: 12px 10px; text-align: left; color: var(--text-secondary); font-weight: 500;">Karta</th>
                            <th style="padding: 12px 10px; text-align: center; color: var(--text-secondary); font-weight: 500;">Soni</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${tableRows}
                    </tbody>
                </table>
            </div>
            
            <div style="margin-top: 20px; padding: 15px; background: rgba(34, 197, 94, 0.08); border: 1px solid rgba(34, 197, 94, 0.25); border-radius: 12px;">
                <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; text-align: center;">
                    <div>
                        <div style="font-size: 0.75rem; color: var(--text-secondary); margin-bottom: 4px;">JAMI SAVDO</div>
                        <div style="font-size: 1.15rem; font-weight: 700; color: var(--accent-green, #22c55e);">${parseFloat(data.grand_total).toLocaleString()} UZS</div>
                    </div>
                    <div>
                        <div style="font-size: 0.75rem; color: var(--text-secondary); margin-bottom: 4px;">NAQD</div>
                        <div style="font-size: 1rem; font-weight: 600; color: var(--text-primary);">${parseFloat(data.grand_cash).toLocaleString()} UZS</div>
                    </div>
                    <div>
                        <div style="font-size: 0.75rem; color: var(--text-secondary); margin-bottom: 4px;">KARTA</div>
                        <div style="font-size: 1rem; font-weight: 600; color: var(--accent-blue, #3b82f6);">${parseFloat(data.grand_card).toLocaleString()} UZS</div>
                    </div>
                    <div>
                        <div style="font-size: 0.75rem; color: var(--text-secondary); margin-bottom: 4px;">TRANZAKSIYALAR</div>
                        <div style="font-size: 1rem; font-weight: 600; color: var(--text-primary);">${data.total_transactions} ta</div>
                    </div>
                </div>
            </div>
            
            <div style="margin-top: 10px; text-align: center; font-size: 0.8rem; color: var(--text-secondary);">
                ${data.start_date} — ${data.end_date}
            </div>
        `;

    } catch (error) {
        console.error("Analytics sales error:", error);
        content.innerHTML = `<p style="color: var(--accent-red); text-align: center; padding: 30px;">❌ ${error.message}</p>`;
    }
}

async function loadProductRanking() {
    const content = document.getElementById('analytics-products-content');
    if (!content) return;

    try {
        const response = await fetch(`${API_URL}/reports/product-ranking?days=30`, {
            headers: getAuthHeaders()
        });

        if (!response.ok) throw new Error("Mahsulot reytingini yuklashda xatolik");

        const products = await response.json();

        if (products.length === 0) {
            content.innerHTML = '<p style="text-align: center; padding: 30px; color: var(--text-secondary);">Mahsulotlar topilmadi</p>';
            return;
        }

        const rankStyles = {
            'top': { color: '#3b82f6', bg: 'rgba(59,130,246,0.1)', icon: '✅', label: "Ko'p" },
            'average': { color: '#eab308', bg: 'rgba(234,179,8,0.1)', icon: '🟡', label: "O'rta" },
            'low': { color: '#ef4444', bg: 'rgba(239,68,68,0.1)', icon: '🔴', label: 'Kam' },
            'none': { color: '#374151', bg: 'rgba(55,65,81,0.15)', icon: '⚫', label: "Yo'q" }
        };

        let rows = products.map((p, i) => {
            const style = rankStyles[p.rank] || rankStyles.none;
            return `
                <tr style="background: ${i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)'};">
                    <td style="padding: 10px; border-bottom: 1px solid var(--glass-border); font-weight: 500;">${i + 1}</td>
                    <td style="padding: 10px; border-bottom: 1px solid var(--glass-border); font-weight: 600;">${p.product_name}</td>
                    <td style="padding: 10px; border-bottom: 1px solid var(--glass-border); text-align: center; font-weight: 600;">${p.total_qty}</td>
                    <td style="padding: 10px; border-bottom: 1px solid var(--glass-border); font-weight: 600; color: var(--accent-green);">${parseFloat(p.total_revenue).toLocaleString()} UZS</td>
                    <td style="padding: 10px; border-bottom: 1px solid var(--glass-border);">
                        <span style="display: inline-flex; align-items: center; gap: 5px; padding: 4px 10px; border-radius: 20px; font-size: 0.8rem; font-weight: 600; background: ${style.bg}; color: ${style.color};">
                            ${style.icon} ${style.label}
                        </span>
                    </td>
                </tr>
            `;
        }).join('');

        content.innerHTML = `
            <div style="overflow-x: auto;">
                <table style="width: 100%; border-collapse: collapse; font-size: 0.9rem;">
                    <thead>
                        <tr style="border-bottom: 2px solid var(--glass-border);">
                            <th style="padding: 10px; text-align: left; color: var(--text-secondary); font-weight: 500; width: 40px;">#</th>
                            <th style="padding: 10px; text-align: left; color: var(--text-secondary); font-weight: 500;">Mahsulot</th>
                            <th style="padding: 10px; text-align: center; color: var(--text-secondary); font-weight: 500;">Sotilgan</th>
                            <th style="padding: 10px; text-align: left; color: var(--text-secondary); font-weight: 500;">Daromad</th>
                            <th style="padding: 10px; text-align: left; color: var(--text-secondary); font-weight: 500;">Holat</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rows}
                    </tbody>
                </table>
            </div>
        `;

    } catch (error) {
        console.error("Product ranking error:", error);
        content.innerHTML = `<p style="color: var(--accent-red); text-align: center; padding: 30px;">❌ ${error.message}</p>`;
    }
}


// Fetch recent transactions
async function fetchRecentTransactions() {
    try {
        const tbody = document.getElementById('transactions-body');
        if (!tbody) return;

        // Fetch today's sales report
        const today = new Date().toISOString().split('T')[0];
        const response = await fetch(`${API_URL}/reports/daily-sales?target_date=${today}`, {
            headers: getAuthHeaders()
        });

        if (response.ok) {
            const report = await response.json();

            // For now, show summary stats in table
            // In future, could add a sales list endpoint
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" style="padding: 0;">
                        <div style="margin: 10px; background: rgba(255, 255, 255, 0.03); border-radius: 10px; padding: 15px; border: 1px solid var(--glass-border);">
                            <div style="text-align: center; margin-bottom: 12px; color: var(--text-primary); font-weight: 600; font-size: 0.9rem;">
                                📊 Bugungi Umumiy Hisob
                            </div>
                            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; text-align: center;">
                                <div style="padding: 8px 4px; background: rgba(255, 255, 255, 0.02); border-radius: 8px;">
                                    <div style="font-size: 0.75rem; color: var(--text-secondary); margin-bottom: 4px;">Jami Savdolar</div>
                                    <div style="font-size: 1.1rem; font-weight: 700; color: var(--accent-blue);">${report.transaction_count || 0}</div>
                                </div>
                                <div style="padding: 8px 4px; background: rgba(34, 197, 94, 0.1); border-radius: 8px;">
                                    <div style="font-size: 0.75rem; color: var(--text-secondary); margin-bottom: 4px;">Naqd</div>
                                    <div style="font-size: 0.9rem; font-weight: 700; color: var(--accent-green);">${parseFloat(report.total_cash || 0).toLocaleString()}</div>
                                </div>
                                <div style="padding: 8px 4px; background: rgba(59, 130, 246, 0.1); border-radius: 8px;">
                                    <div style="font-size: 0.75rem; color: var(--text-secondary); margin-bottom: 4px;">Karta</div>
                                    <div style="font-size: 0.9rem; font-weight: 700; color: var(--accent-blue);">${parseFloat(report.total_card || 0).toLocaleString()}</div>
                                </div>
                            </div>
                        </div>
                    </td>
                </tr>
            `;
        }
    } catch (error) {
        console.error("Transactions error:", error);
    }
}

// Fetch Sariq Savat (Voided Items) Statistics
async function fetchVoidStats() {
    try {
        const response = await fetch(`${API_URL}/sales/voids/stats`, {
            headers: getAuthHeaders()
        });

        if (response.ok) {
            const stats = await response.json();
            const sariqSavat = document.getElementById('sariq-savat');
            if (sariqSavat) {
                sariqSavat.innerText = stats.count || 0;
            }
            // Update tooltip or additional info if needed
            const sariqSavatQty = document.getElementById('sariq-savat-qty');
            if (sariqSavatQty) {
                sariqSavatQty.innerText = stats.total_quantity || 0;
            }
        }
    } catch (error) {
        console.error("Sariq savat error:", error);
    }
}

// CHART
function initChart() {
    const el = document.getElementById('salesChart');
    if (!el) return;

    const ctx = el.getContext('2d');
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Dush', 'Sesh', 'Chor', 'Pay', 'Jum', 'Shan', 'Yak'],
            datasets: [{
                label: 'Savdo (UZS)',
                data: [1200000, 1900000, 300000, 500000, 200000, 3000000, 1500000],
                borderColor: '#3b82f6',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                borderWidth: 2,
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: 'rgba(255, 255, 255, 0.05)' },
                    ticks: { color: '#94a3b8' }
                },
                x: {
                    grid: { display: false },
                    ticks: { color: '#94a3b8' }
                }
            }
        }
    });
}
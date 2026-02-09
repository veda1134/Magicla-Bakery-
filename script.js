const itemForm = document.getElementById('addItemForm');
const itemNameInput = document.getElementById('itemName');
const expiryDateInput = document.getElementById('expiryDate');
const inventoryGrid = document.getElementById('inventoryGrid');
const toastContainer = document.getElementById('toastContainer');
const notificationBtn = document.getElementById('notificationBtn');

// Load items from localStorage on startup
document.addEventListener('DOMContentLoaded', () => {
    loadItems();
    updateStats();
    checkAlarms();

    // Auto-request permission if not already decided, as requested by user ("automatically triggers alarm")
    // Note: Browsers block this unless triggered by user interaction, but we'll try or set up the button.
    if (Notification.permission === 'default') {
        // We can't auto-request on load in most modern browsers, so we rely on the button
        // But the user said "make it ask... or automatically triggers".
        // We will highlight the button if permission is needed.
        notificationBtn.classList.add('animate-pulse');
    }
});

notificationBtn.addEventListener('click', () => {
    Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
            showToast('Alarms Enabled!', 'You will be notified when magic fades.');
            notificationBtn.classList.remove('animate-pulse');
            checkAlarms();
        }
    });
});

itemForm.addEventListener('submit', (e) => {
    e.preventDefault();
    addItem();
});

function loadItems() {
    const items = JSON.parse(localStorage.getItem('magicalBakeryItems')) || [];
    inventoryGrid.innerHTML = '';

    items.sort((a, b) => new Date(a.expiry) - new Date(b.expiry));

    items.forEach((item, index) => {
        createItemCard(item, index);
    });
}

function addItem() {
    const name = itemNameInput.value.trim();
    const expiry = expiryDateInput.value;

    if (!name || !expiry) return;

    const items = JSON.parse(localStorage.getItem('magicalBakeryItems')) || [];
    items.push({ name, expiry, added: new Date().toISOString() });
    localStorage.setItem('magicalBakeryItems', JSON.stringify(items));

    itemNameInput.value = '';
    expiryDateInput.value = '';

    loadItems();
    updateStats();
    showToast('Magical Item Summoned!', `${name} added to inventory.`);
}

function removeItem(index) {
    const items = JSON.parse(localStorage.getItem('magicalBakeryItems')) || [];
    const removedItem = items[index];
    items.splice(index, 1);
    localStorage.setItem('magicalBakeryItems', JSON.stringify(items));

    loadItems();
    updateStats();
    showToast('Munched!', `${removedItem.name} was consumed.`);
}

function createItemCard(item, index) {
    const today = new Date();
    const expiryDate = new Date(item.expiry);
    const timeDiff = expiryDate - today;
    const daysLeft = Math.ceil(timeDiff / (1000 * 3600 * 24));

    let daysText = daysLeft < 0 ? 'Expired' : (daysLeft === 0 ? 'Today!' : (daysLeft === 1 ? 'Tomorrow!' : `${daysLeft} days`));
    let colorClass, icon, bgClass, rot;

    // Determine card style based on item name hash or properties
    // Simple logic for variety
    const hash = item.name.length;

    if (daysLeft < 0) {
        colorClass = 'text-red-500';
        icon = 'warning';
        bgClass = 'bg-red-50';
    } else if (daysLeft <= 2) {
        colorClass = 'text-primary';
        icon = 'priority_high';
        bgClass = 'bg-primary/10';
    } else {
        colorClass = 'text-ink';
        icon = 'restaurant_menu';
        bgClass = hash % 2 === 0 ? 'bg-pastel-blue/20' : 'bg-pastel-yellow/20';
    }

    const rotate = (index % 3 === 0) ? '-rotate-1' : (index % 3 === 1 ? 'rotate-1' : 'rotate-0');

    const card = document.createElement('div');
    card.className = `group relative bg-white dark:bg-gray-800 rounded-3xl p-5 shadow-sm hover:shadow-chibi transition-all duration-300 border-2 border-ink hover:-translate-y-1 ${rotate}`;

    card.innerHTML = `
        <div class="h-40 w-full rounded-2xl ${bgClass} mb-4 flex items-center justify-center border-2 border-dashed border-ink/10 group-hover:border-ink/20 transition-colors relative overflow-hidden">
             <!-- Placeholder SVG Icon based on name -->
             <div class="text-6xl select-none transform group-hover:scale-110 transition-transform duration-500">
                ${getItemIcon(item.name)}
             </div>
        </div>
        <div class="flex justify-between items-start mb-2">
            <div>
                <h3 class="font-hand font-bold text-2xl text-ink dark:text-white leading-tight">${item.name}</h3>
                <p class="text-xs text-ink-light font-display mt-1 bg-parchment inline-block px-2 py-0.5 rounded-md">Expiry: ${item.expiry}</p>
            </div>
        </div>
        <div class="flex items-center justify-between mt-3 pt-3 border-t-2 border-dashed border-ink/10">
            <div class="flex flex-col">
                <span class="text-[10px] uppercase tracking-wider text-ink-light font-bold">Eat By</span>
                <span class="text-lg font-hand font-bold ${colorClass}">${daysText}</span>
            </div>
            <button onclick="removeItem(${index})" class="text-ink hover:text-white hover:bg-primary hover:border-ink border-2 border-transparent transition-colors w-10 h-10 flex items-center justify-center rounded-full" title="Eat / Remove">
                <span class="material-symbols-outlined">restaurant_menu</span>
            </button>
        </div>
    `;
    inventoryGrid.appendChild(card);
}

function getItemIcon(name) {
    const icons = ['🥐', '🥯', '🍞', '🥖', '🥨', '🥞', '🧇', '🍰', '🧁', '🥧', '🍪', '🍩'];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % icons.length;
    return icons[index];
}

function updateStats() {
    const items = JSON.parse(localStorage.getItem('magicalBakeryItems')) || [];
    const statsContainer = document.getElementById('statsContainer');

    const total = items.length;
    const expiringSoon = items.filter(i => {
        const days = Math.ceil((new Date(i.expiry) - new Date()) / (1000 * 3600 * 24));
        return days >= 0 && days <= 2;
    }).length;

    statsContainer.innerHTML = `
        <div class="bg-white dark:bg-gray-800 p-4 rounded-wobbly-sm border-2 border-ink shadow-sm hover:shadow-chibi transition-all cursor-default transform hover:-translate-y-1">
            <div class="flex flex-col items-center justify-center gap-1">
                <span class="text-4xl font-bold text-pastel-blue font-hand drop-shadow-sm">${total}</span>
                <span class="text-sm uppercase tracking-wider text-ink-light font-bold font-display">Items</span>
            </div>
        </div>
        <div class="bg-white dark:bg-gray-800 p-4 rounded-wobbly-sm border-2 border-ink shadow-sm hover:shadow-chibi transition-all cursor-default transform hover:-translate-y-1 rotate-1">
            <div class="flex flex-col items-center justify-center gap-1">
                <span class="text-4xl font-bold text-primary font-hand drop-shadow-sm">${expiringSoon}</span>
                <span class="text-sm uppercase tracking-wider text-primary-dark font-bold font-display">Eat Soon!</span>
            </div>
        </div>
    `;
}

function showToast(title, message) {
    const toast = document.createElement('div');
    toast.className = 'bg-white p-4 rounded-wobbly border-2 border-ink shadow-chibi flex items-center gap-4 animate-bounce-slow max-w-sm toast-enter';
    toast.innerHTML = `
        <div class="w-10 h-10 rounded-full bg-pastel-green border-2 border-ink text-ink flex items-center justify-center">
            <span class="material-symbols-outlined text-[20px] font-bold">check</span>
        </div>
        <div>
            <p class="text-lg font-hand font-bold text-ink">${title}</p>
            <p class="text-xs text-ink-light font-display">${message}</p>
        </div>
        <button class="ml-2 text-ink-light hover:text-primary transition-colors" onclick="this.parentElement.remove()">
            <span class="material-symbols-outlined text-[20px]">close</span>
        </button>
    `;

    toastContainer.appendChild(toast);

    // Trigger animation
    requestAnimationFrame(() => {
        toast.classList.remove('toast-enter');
        toast.classList.add('toast-enter-active');
    });

    setTimeout(() => {
        toast.classList.remove('toast-enter-active');
        toast.classList.add('toast-exit-active');
        setTimeout(() => toast.remove(), 500);
    }, 3000);
}

function checkAlarms() {
    if (Notification.permission !== 'granted') return;

    const items = JSON.parse(localStorage.getItem('magicalBakeryItems')) || [];
    const today = new Date().toDateString();

    items.forEach(item => {
        const productExpiry = new Date(item.expiry).toDateString();

        // Simple check: if checking today and item expires today or tomorrow
        // In a real app, track 'notified' state so we don't spam.
        // Here we'll just notify if it matches exact criteria for demo.
        const daysLeft = Math.ceil((new Date(item.expiry) - new Date()) / (1000 * 3600 * 24));

        if (daysLeft === 0 || daysLeft === 1) {
            new Notification(`Bazooka! ${item.name} is expiring soon!`, {
                body: `Better eat it before the magic fades.`,
                icon: 'https://cdn-icons-png.flaticon.com/512/3081/3081840.png'
            });
        }
    });
}

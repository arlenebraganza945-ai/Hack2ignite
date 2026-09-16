const authSection = document.getElementById('auth-section');
const dashboardSection = document.getElementById('dashboard-section');
const authMessage = document.getElementById('auth-message');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');

async function handleAuth(action) {
    const username = usernameInput.value;
    const password = passwordInput.value;

    if (!username || !password) {
        authMessage.innerText = "Please enter both.";
        return;
    }

    try {
        const response = await fetch(action, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (response.ok) {
            authSection.style.display = 'none';
            dashboardSection.style.display = 'block';
        } else {
            authMessage.innerText = data.error;
        }
    } catch (err) {
        authMessage.innerText = "Error connecting to server.";
    }
}

document.getElementById('signup-btn').addEventListener('click', () => handleAuth('/register'));
document.getElementById('login-btn').addEventListener('click', () => handleAuth('/login'));

// --- Expense Form Logic ---
const expenseForm = document.getElementById('expense-form');
const amountInput = document.getElementById('amount');
const categoryInput = document.getElementById('category');
const noteInput = document.getElementById('note');
const expenseMessage = document.getElementById('expense-message');

expenseForm.addEventListener('submit', async (e) => {
    e.preventDefault(); // Stops the page from refreshing

    const amount = amountInput.value;
    const category = categoryInput.value;
    const note = noteInput.value;

    try {
        const response = await fetch('/expenses', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ amount, category, note })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            expenseMessage.innerText = "Expense added successfully!";
            amountInput.value = ''; // Clear inputs for the next entry
            noteInput.value = '';
            loadExpenses();
            
            // Hide the success message after 2 seconds
            setTimeout(() => expenseMessage.innerText = '', 2000);
        } else {
            expenseMessage.innerText = data.error;
        }
    } catch (err) {
        expenseMessage.innerText = "Error saving expense.";
    }
});
// --- LIVE CHECKOUT MOCK LOGIC ---
const modal = document.getElementById('payment-modal');
const openMockBtn = document.getElementById('open-mock-btn');
const cancelPayBtn = document.getElementById('cancel-pay-btn');
const confirmPayBtn = document.getElementById('confirm-pay-btn');

// Show the modal when the button is clicked
openMockBtn.addEventListener('click', () => {
    modal.style.display = 'flex';
});

// Hide the modal if they click cancel
cancelPayBtn.addEventListener('click', () => {
    modal.style.display = 'none';
});

// Handle the "Pay" button
confirmPayBtn.addEventListener('click', async () => {
    const category = document.getElementById('mock-category').value;
    
    // Post the fake transaction to your backend
    try {
        const response = await fetch('/expenses', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ amount: 240, category: category, note: 'Cafe (Live Mock)' })
        });

        if (response.ok) {
            modal.style.display = 'none'; // Close modal
            if (typeof loadExpenses === 'function') loadExpenses(); // Refresh list on screen
            alert('Payment Authorized & Logged to ClearSpend!');
        } else {
            alert('Error processing mock payment.');
        }
    } catch (err) {
        console.error(err);
        alert('Could not connect to server.');
    }
});
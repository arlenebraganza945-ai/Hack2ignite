const authSection = document.getElementById('auth-section');
const dashboardSection = document.getElementById('dashboard-section');
const authMessage = document.getElementById('auth-message');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');

let expenseChartInstance = null; // Keeps track of the active chart

// --- AUTHENTICATION ---
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
            
            // Silently fetch past data upon login
            loadExpenses(); 
        } else {
            authMessage.innerText = data.error;
        }
    } catch (err) {
        authMessage.innerText = "Error connecting to server.";
    }
}
document.getElementById('signup-btn').addEventListener('click', () => handleAuth('/register'));
document.getElementById('login-btn').addEventListener('click', () => handleAuth('/login'));

// --- ADD EXPENSE LOGIC ---
const expenseForm = document.getElementById('expense-form');
const amountInput = document.getElementById('amount');
const categoryInput = document.getElementById('category');
const noteInput = document.getElementById('note');
const expenseMessage = document.getElementById('expense-message');

expenseForm.addEventListener('submit', async (e) => {
    e.preventDefault(); 

    const amount = amountInput.value;
    const category = categoryInput.value;
    const note = noteInput.value;

    try {
        const response = await fetch('/expenses', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ amount, category, note })
        });
        
        if (response.ok) {
            expenseMessage.innerText = "Expense added successfully!";
            amountInput.value = ''; 
            noteInput.value = '';
            
            await loadExpenses(); 
            
            const expensesContainer = document.getElementById('expenses-container');
            const toggleBtn = document.getElementById('toggle-expenses-btn');
            expensesContainer.style.display = 'block';
            toggleBtn.innerText = '📂 Hide Recent Expenses';

            setTimeout(() => expenseMessage.innerText = '', 2000);
        } else {
            const data = await response.json();
            expenseMessage.innerText = data.error;
        }
    } catch (err) {
        expenseMessage.innerText = "Error saving expense.";
    }
});

// --- TOGGLE EXPENSES BUTTON ---
const toggleBtn = document.getElementById('toggle-expenses-btn');
const expensesContainer = document.getElementById('expenses-container');

toggleBtn.addEventListener('click', () => {
    if (expensesContainer.style.display === 'none') {
        expensesContainer.style.display = 'block';
        toggleBtn.innerText = '📂 Hide Recent Expenses';
    } else {
        expensesContainer.style.display = 'none';
        toggleBtn.innerText = '📂 Show Recent Expenses';
    }
});

// --- AI SPENDING ANALYZER & INSIGHT CHECKER ---
function analyzeSpending(expenses) {
    const nudgeBanner = document.getElementById('ai-nudge-banner');
    const nudgeText = document.getElementById('nudge-text');
    const insightChecker = document.getElementById('insight-checker');
    const breakdownList = document.getElementById('category-breakdown');
    const chartContainer = document.getElementById('chart-container');
    
    // 1. Calculate totals
    const categoryTotals = {};
    let foodTotal = 0;
    let shoppingTotal = 0;
    
    expenses.forEach(exp => {
        if(exp.category === 'Food') foodTotal += exp.amount;
        if(exp.category === 'Shopping') shoppingTotal += exp.amount;
        
        if (!categoryTotals[exp.category]) categoryTotals[exp.category] = 0;
        categoryTotals[exp.category] += exp.amount;
    });

    // 2. Populate Insight Checker
    if (expenses.length > 0) {
        breakdownList.innerHTML = '';
        for (const [category, total] of Object.entries(categoryTotals)) {
            breakdownList.innerHTML += `<li style="margin-bottom: 5px; display: flex; justify-content: space-between;">
                <span>${category}</span> <strong>₹${total}</strong>
            </li>`;
        }
        insightChecker.style.display = 'block';
    } else {
        insightChecker.style.display = 'none';
    }

    // 3. Trigger AI Nudge
    if (foodTotal > 1000) {
        nudgeText.innerText = "Whoa, that's a lot on takeout! Time to whip up some noodles at home? 🍜";
        nudgeBanner.style.display = 'block';
    } else if (shoppingTotal > 1500) {
        nudgeText.innerText = "Hold up! Step away from the shopping cart. Your wallet is begging you! 🛍️";
        nudgeBanner.style.display = 'block';
    } else if (expenses.length > 0) {
        nudgeText.innerText = "You're keeping your budget perfectly balanced this week. Slaying! ✨";
        nudgeBanner.style.display = 'block';
    } else {
        nudgeBanner.style.display = 'none'; 
    }

    // 4. Trigger Chart
    if (expenses.length > 0 && typeof Chart !== 'undefined') {
        if(chartContainer) chartContainer.style.display = 'block';
        renderChart(categoryTotals);
    } else {
        if(chartContainer) chartContainer.style.display = 'none';
    }
}

// --- CHART RENDERING ENGINE ---
function renderChart(categoryTotals) {
    const ctx = document.getElementById('expenseChart').getContext('2d');
    
    if (expenseChartInstance) {
        expenseChartInstance.destroy();
    }

    const labels = Object.keys(categoryTotals);
    const data = Object.values(categoryTotals);

    expenseChartInstance = new Chart(ctx, {
        type: 'doughnut', 
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: ['#00cec9', '#fdcb6e', '#ff7675', '#74b9ff', '#a29bfe', '#dfe6e9'],
                borderWidth: 0,
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { position: 'bottom', labels: { font: { size: 12 } } }
            }
        }
    });
}

// --- LOAD EXPENSES ---
// --- LOAD EXPENSES (GROUPED BY CATEGORY) ---
async function loadExpenses() {
    const list = document.getElementById('expense-list');
    if (!list) return; 
    
    list.innerHTML = 'Loading...'; 

    try {
        const response = await fetch('/expenses');
        const expenses = await response.json();

        analyzeSpending(expenses);

        list.innerHTML = '';

        if (expenses.length === 0) {
            list.innerHTML = '<li>No expenses yet.</li>';
            return;
        }
    
        // 1. Group the expenses by their category
        const groupedExpenses = {};
        expenses.forEach(exp => {
            if (!groupedExpenses[exp.category]) {
                groupedExpenses[exp.category] = [];
            }
            groupedExpenses[exp.category].push(exp);
        });

        // 2. Loop through each group and create a header + items
        for (const category in groupedExpenses) {
            
            // Set the color for this specific group
            let badgeColor = '#dfe6e9'; 
            if (category === 'Food') badgeColor = '#00cec9';
            if (category === 'Shopping') badgeColor = '#fdcb6e';
            if (category === 'Transport') badgeColor = '#ff7675';
            if (category === 'Entertainment') badgeColor = '#74b9ff';
            if (category === 'Bills') badgeColor = '#a29bfe';

            // Add the Category Header
            list.innerHTML += `
                <h4 style="margin: 20px 0 10px 0; padding-bottom: 5px; border-bottom: 2px solid ${badgeColor}; color: #2d3436; text-transform: uppercase; font-size: 14px; letter-spacing: 1px;">
                    ${category}
                </h4>
            `;

            // Add all the expenses under this header
            groupedExpenses[category].forEach(expense => {
                const noteText = expense.note ? expense.note : 'Uncategorized';

                list.innerHTML += `
                <li style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid #eee;">
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <span style="background: ${badgeColor}; color: #2d3436; padding: 4px 10px; border-radius: 20px; font-size: 12px; font-weight: bold; width: 85px; text-align: center;">
                            ${expense.category}
                        </span>
                        <span style="color: #636e72; font-size: 14px;">${noteText}</span>
                    </div>
                    <strong style="font-size: 16px; color: #2d3436;">₹${expense.amount}</strong>
                </li>`;
            });
        }
    } catch (err) {
        list.innerHTML = '<li>Error loading expenses.</li>';
    }
}
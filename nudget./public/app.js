const authSection = document.getElementById('auth-section');
const dashboardSection = document.getElementById('dashboard-section');
const authMessage = document.getElementById('auth-message');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');

let expenseChartInstance = null; 
let currentUser = null; 

// --- AUTHENTICATION ---
async function handleAuth(action) {
    const rawUsername = usernameInput.value;
    const rawPassword = passwordInput.value;

    if (!rawUsername || !rawPassword) {
        authMessage.innerText = "Please enter both.";
        return;
    }

    try {
        const response = await fetch(action, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: rawUsername, password: rawPassword })
        });
        const data = await response.json();

        if (response.ok) {
            currentUser = data.username;
            authSection.style.display = 'none';
            dashboardSection.style.display = 'block';
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

// --- LOGOUT LOGIC ---
const logoutBtn = document.getElementById('logout-btn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        currentUser = null;
        dashboardSection.style.display = 'none';
        authSection.style.display = 'flex'; 
        usernameInput.value = '';
        passwordInput.value = '';
        authMessage.innerText = '';
    });
}

// --- ADD EXPENSE LOGIC ---
const expenseForm = document.getElementById('expense-form');
const amountInput = document.getElementById('amount');
const categoryInput = document.getElementById('category');
const noteInput = document.getElementById('note');
const expenseMessage = document.getElementById('expense-message');

expenseForm.addEventListener('submit', async (e) => {
    e.preventDefault(); 
    if (!currentUser) return;

    try {
        const response = await fetch('/expenses', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                username: currentUser, 
                amount: amountInput.value, 
                category: categoryInput.value, 
                note: noteInput.value 
            })
        });
        
        if (response.ok) {
            expenseMessage.innerText = "Expense added successfully!";
            amountInput.value = ''; 
            noteInput.value = '';
            
            await loadExpenses(); 
            document.getElementById('expenses-container').style.display = 'block';
            document.getElementById('toggle-expenses-btn').innerText = '📂 Hide Recent Expenses';

            setTimeout(() => expenseMessage.innerText = '', 2000);
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

// --- CUSTOM BI-WEEKLY BUDGET SAVER & SIMULATOR ---
const saveBudgetBtn = document.getElementById('save-budget-btn');
const customBudgetInput = document.getElementById('custom-budget-input');
const resetCycleBtn = document.getElementById('reset-cycle-btn');

if (saveBudgetBtn) {
    saveBudgetBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        const newBudget = Number(customBudgetInput.value);
        if (newBudget > 0 && currentUser) {
            await fetch('/budget', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: currentUser, newBudget })
            });
            customBudgetInput.value = '';
            await loadExpenses(); 
        }
    });
}

if (resetCycleBtn) {
    resetCycleBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        if(confirm("Fast forward 2 weeks? This will clear your current cycle and start fresh.")) {
            await fetch('/reset-cycle', { 
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: currentUser })
            });
            await loadExpenses(); 
        }
    });
}

// --- AI SPENDING ANALYZER & INSIGHT CHECKER ---
async function analyzeSpending(expenses) {
    const nudgeBanner = document.getElementById('ai-nudge-banner');
    const nudgeText = document.getElementById('nudge-text');
    const insightChecker = document.getElementById('insight-checker');
    const breakdownList = document.getElementById('category-breakdown');
    const chartContainer = document.getElementById('chart-container');
    const progressBar = document.getElementById('budget-progress');
    const budgetText = document.getElementById('budget-text');
    const budgetWarning = document.getElementById('budget-warning');
    
    const categoryTotals = {};
    let totalSpent = 0; 
    let highestCategory = '';
    let highestAmount = 0;
    
    expenses.forEach(exp => {
        const amt = Number(exp.amount) || 0;
        totalSpent += amt; 
        
        if (!categoryTotals[exp.category]) categoryTotals[exp.category] = 0;
        categoryTotals[exp.category] += amt;

        if (categoryTotals[exp.category] > highestAmount) {
            highestAmount = categoryTotals[exp.category];
            highestCategory = exp.category;
        }
    });

    let budgetLimit = 5000;
    try {
        const budgetResponse = await fetch(`/budget?username=${currentUser}`);
        if(budgetResponse.ok) {
            const budgetData = await budgetResponse.json();
            budgetLimit = budgetData.budget || 5000;
        }
    } catch (e) {
        console.error("Using default budget");
    }
    
    const progressPercentage = Math.min((totalSpent / budgetLimit) * 100, 100); 

    if (budgetText && progressBar) {
        budgetText.innerText = `₹${totalSpent.toLocaleString()} / ₹${budgetLimit.toLocaleString()}`;
        progressBar.style.width = `${progressPercentage}%`;

        if (progressPercentage < 50) {
            progressBar.style.background = '#00cec9'; 
            budgetWarning.style.display = 'none';
        } else if (progressPercentage < 85) {
            progressBar.style.background = '#fdcb6e'; 
            budgetWarning.style.display = 'block';
            budgetWarning.innerText = '⚠️ Careful! You are nearing your bi-weekly limit.';
            budgetWarning.style.color = '#e1b12c';
        } else {
            progressBar.style.background = '#d63031'; 
            budgetWarning.style.display = 'block';
            budgetWarning.innerText = '🚨 Budget critical! No more spending.';
            budgetWarning.style.color = '#d63031';
        }
    }

    const globalCategoryColors = {
        'Food': '#C7B2FF', 'Shopping': '#c484c3', 'Transport': '#B8F2FF',     
        'Entertainment': '#a382f9', 'Bills': '#71DFCA', 'Uncategorized': '#9085BC'  
    };

    if (expenses.length > 0) {
        breakdownList.innerHTML = '';
        for (const [category, total] of Object.entries(categoryTotals)) {
            const dotColor = globalCategoryColors[category] || '#8E6EE6';
            breakdownList.innerHTML += `
                <li style="margin-bottom: 10px; display: flex; justify-content: space-between; align-items: center; font-size: 14px;">
                    <span style="display: flex; align-items: center; gap: 8px;">
                        <span style="width: 10px; height: 10px; background-color: ${dotColor}; border-radius: 50%; display: inline-block; box-shadow: 0 0 4px rgba(0,0,0,0.2);"></span>
                        <span style="color: #2d3436; font-weight: 500;">${category}</span>
                    </span> 
                    <strong style="color: #2d3436; font-weight: 600;">₹${total.toLocaleString()}</strong>
                </li>`;
        }
        insightChecker.style.display = 'block';
    } else {
        insightChecker.style.display = 'none';
    }

    if (totalSpent > budgetLimit && expenses.length > 0) {
        nudgeText.innerText = `🚨 Budget Exceeded! Your biggest drain is ${highestCategory} (₹${highestAmount.toLocaleString()}). You need to hold up on this!`;
        nudgeBanner.style.background = '#ff7675'; 
        nudgeBanner.style.borderLeftColor = '#d63031';
        nudgeBanner.style.display = 'block';
    } else if (highestAmount > (budgetLimit * 0.4) && expenses.length > 0) {
        nudgeText.innerText = `⚠️ Watch out: You've spent ₹${highestAmount.toLocaleString()} just on ${highestCategory}! Time to hold up on that to survive the week.`;
        nudgeBanner.style.background = '#ffeaa7'; 
        nudgeBanner.style.borderLeftColor = '#fdcb6e';
        nudgeBanner.style.display = 'block';
    } else if (expenses.length > 0) {
        nudgeText.innerText = "You're keeping your bi-weekly budget perfectly balanced! ✨";
        nudgeBanner.style.background = '#B8F2FF'; 
        nudgeBanner.style.borderLeftColor = '#8E6EE6';
        nudgeBanner.style.display = 'block';
    } else {
        nudgeBanner.style.display = 'none'; 
    }

    if (expenses.length > 0 && typeof Chart !== 'undefined') {
        if(chartContainer) chartContainer.style.display = 'block';
        renderChart(categoryTotals, globalCategoryColors);
    } else {
        if(chartContainer) chartContainer.style.display = 'none';
    }
}

function renderChart(categoryTotals, globalCategoryColors) {
    const ctx = document.getElementById('expenseChart').getContext('2d');
    if (expenseChartInstance) expenseChartInstance.destroy();

    const labels = Object.keys(categoryTotals);
    const data = Object.values(categoryTotals);
    const backgroundColors = labels.map(label => globalCategoryColors[label] || '#8E6EE6');

    expenseChartInstance = new Chart(ctx, {
        type: 'doughnut', 
        data: {
            labels: labels,
            datasets: [{ data: data, backgroundColor: backgroundColors, borderWidth: 0, hoverOffset: 4 }]
        },
        options: { responsive: true, plugins: { legend: { position: 'bottom', labels: { font: { size: 12 } } } } }
    });
}

async function loadExpenses() {
    const list = document.getElementById('expense-list');
    if (!list || !currentUser) return; 
    list.innerHTML = 'Loading...'; 

    try {
        const response = await fetch(`/expenses?username=${currentUser}`);
        const expenses = await response.json();

        await analyzeSpending(expenses);
        list.innerHTML = '';

        if (!expenses || expenses.length === 0) {
            list.innerHTML = '<li style="color:#636e72;">No expenses yet. Start adding!</li>';
            return;
        }
    
        const groupedExpenses = {};
        expenses.forEach(exp => {
            if (!groupedExpenses[exp.category]) groupedExpenses[exp.category] = [];
            groupedExpenses[exp.category].push(exp);
        });

        for (const category in groupedExpenses) {
            let badgeColor = '#ffffff'; 
            if (category === 'Food') badgeColor = '#C7B2FF'; 
            if (category === 'Shopping') badgeColor = '#c484c3'; 
            if (category === 'Transport') badgeColor = '#B8F2FF'; 
            if (category === 'Entertainment') badgeColor = '#a382f9'; 
            if (category === 'Bills') badgeColor = '#71DFCA'; 
            if (category === 'Uncategorized') badgeColor = '#9085BC'; 

            list.innerHTML += `
                <h4 style="margin: 20px 0 10px 0; padding-bottom: 5px; border-bottom: 2px solid ${badgeColor}; color: #2d3436; text-transform: uppercase; font-size: 14px; letter-spacing: 1px;">
                    ${category}
                </h4>
            `;

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
                    <strong style="font-size: 16px; color: #2d3436;">₹${expense.amount.toLocaleString()}</strong>
                </li>`;
            });
        }
    } catch (err) {
        list.innerHTML = '<li>Error loading expenses.</li>';
    }
}
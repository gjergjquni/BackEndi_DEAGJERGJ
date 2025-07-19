/**
 * @file This file contains the core JavaScript classes for handling the backend logic
 * of the reporting and planning features in a personal finance application.
 * These classes are designed to be used in a Node.js environment (e.g., with an Express server).
 */

/**
 * Represents a single financial transaction (either income or expense).
 * This is the fundamental data model for all reporting.
 */
class Transaction {
    /**
     * @param {string} id - Unique identifier for the transaction (e.g., from a database).
     * @param {number} amount - The monetary value of the transaction. Should always be positive.
     * @param {Date} date - The date and time the transaction occurred.
     * @param {'income' | 'expense'} type - The type of transaction.
     * @param {string} category - The category of the transaction (e.g., "Groceries", "Salary", "Transport").
     * @param {string} [description] - An optional description for the transaction.
     * @param {string} userId - The ID of the user this transaction belongs to.
     */
    constructor(id, amount, date, type, category, description = '', userId) {
        if (amount <= 0) {
            throw new Error('Transaction amount must be a positive number.');
        }
        this.id = id;
        this.amount = amount;
        this.date = new Date(date);
        this.type = type; // 'income' or 'expense'
        this.category = category;
        this.description = description;
        this.userId = userId;
    }
}

/**
 * NEW: Represents the user's financial profile and goals.
 * This information is used for planning and goal-tracking reports.
 */
class UserProfile {
    /**
     * @param {string} userId - The unique ID for the user.
     * @param {string} jobTitle - The user's job title.
     * @param {number} monthlySalary - The user's fixed monthly income.
     * @param {number} savingsGoalPercentage - The percentage of income the user wants to save (e.g., 20 for 20%).
     */
    constructor(userId, jobTitle, monthlySalary, savingsGoalPercentage) {
        this.userId = userId;
        this.jobTitle = jobTitle;
        this.monthlySalary = monthlySalary;
        this.savingsGoalPercentage = savingsGoalPercentage;
    }

    /**
     * Calculates the target amount to save each month based on the user's goal.
     * @returns {number} The monthly savings goal amount.
     */
    getMonthlySavingsGoalAmount() {
        return this.monthlySalary * (this.savingsGoalPercentage / 100);
    }
}


/**
 * Manages all reporting logic. It takes transactions and a user profile
 * to generate data structures suitable for frontend charts and reports.
 */
class ReportGenerator {
    /**
     * @param {Transaction[]} transactions - An array of Transaction objects for a specific user.
     * @param {UserProfile} userProfile - The profile of the user for whom the report is generated.
     */
    constructor(transactions, userProfile) {
        this.transactions = transactions.sort((a, b) => a.date - b.date);
        this.userProfile = userProfile;
    }

    /**
     * Filters transactions to include only those within a specific date range.
     * @param {Date} startDate - The start of the reporting period.
     * @param {Date} endDate - The end of the reporting period.
     * @returns {Transaction[]} - A filtered array of transactions.
     */
    _getTransactionsInDateRange(startDate, endDate) {
        return this.transactions.filter(tx => tx.date >= startDate && tx.date <= endDate);
    }

    /**
     * Generates data for a spending analysis report (e.g., for a pie chart).
     * @param {Date} startDate - The start of the reporting period.
     * @param {Date} endDate - The end of the reporting period.
     * @returns {Object[]} - An array of objects, e.g., [{ category: 'Groceries', total: 450.75 }, ...].
     */
    generateSpendingAnalysis(startDate, endDate) {
        const relevantTransactions = this._getTransactionsInDateRange(startDate, endDate);
        const spendingByCategory = {};

        for (const tx of relevantTransactions) {
            if (tx.type === 'expense') {
                if (!spendingByCategory[tx.category]) {
                    spendingByCategory[tx.category] = 0;
                }
                spendingByCategory[tx.category] += tx.amount;
            }
        }

        return Object.keys(spendingByCategory).map(category => ({
            category: category,
            total: spendingByCategory[category]
        }));
    }

    /**
     * Generates data for an Income vs. Expenses report.
     * @param {Date} startDate - The start of the reporting period.
     * @param {Date} endDate - The end of the reporting period.
     * @returns {{totalIncome: number, totalExpenses: number}} - An object containing total income and expenses.
     */
    generateIncomeVsExpenseReport(startDate, endDate) {
        const relevantTransactions = this._getTransactionsInDateRange(startDate, endDate);
        let totalIncome = 0;
        let totalExpenses = 0;

        for (const tx of relevantTransactions) {
            if (tx.type === 'income') {
                totalIncome += tx.amount;
            } else {
                totalExpenses += tx.amount;
            }
        }

        return { totalIncome, totalExpenses };
    }

    /**
     * Generates data to show savings growth over time (e.g., for a line chart).
     * @param {Date} startDate - The start of the reporting period.
     * @param {Date} endDate - The end of the reporting period.
     * @returns {Object[]} - An array of objects, e.g., [{ date: '2023-01-15', balance: 500.00 }, ...].
     */
    generateSavingsGrowth(startDate, endDate) {
        // This function remains the same as before.
        const relevantTransactions = this._getTransactionsInDateRange(startDate, endDate);
        const growthData = [];
        let currentBalance = 0;
        if (relevantTransactions.length === 0) return [];
        const dailyNetChange = new Map();
        for (const tx of relevantTransactions) {
            const day = tx.date.toISOString().split('T')[0];
            const change = tx.type === 'income' ? tx.amount : -tx.amount;
            const currentDailyTotal = dailyNetChange.get(day) || 0;
            dailyNetChange.set(day, currentDailyTotal + change);
        }
        let dayIterator = new Date(startDate);
        while (dayIterator <= endDate) {
            const dayString = dayIterator.toISOString().split('T')[0];
            if (dailyNetChange.has(dayString)) {
                currentBalance += dailyNetChange.get(dayString);
            }
            growthData.push({ date: dayString, balance: currentBalance });
            dayIterator.setDate(dayIterator.getDate() + 1);
        }
        return growthData;
    }

    /**
     * NEW: Generates a report comparing the user's savings goal to their actual performance for a period.
     * @param {Date} startDate - The start of the reporting period.
     * @param {Date} endDate - The end of the reporting period.
     * @returns {object} - An object detailing the budget vs. actual performance.
     */
    generateBudgetVsActualReport(startDate, endDate) {
        const { totalIncome, totalExpenses } = this.generateIncomeVsExpenseReport(startDate, endDate);
        const savingsGoalAmount = this.userProfile.getMonthlySavingsGoalAmount();
        const actualSavings = totalIncome - totalExpenses;

        return {
            expectedIncome: this.userProfile.monthlySalary,
            actualIncome: totalIncome,
            savingsGoal: savingsGoalAmount,
            actualSavings: actualSavings,
            // A "variance" shows if they are ahead (positive) or behind (negative) their goal.
            variance: actualSavings - savingsGoalAmount
        };
    }
}


// --- EXAMPLE USAGE ---
// In your backend, you would fetch both the user's profile and their transactions.

// 1. Fetch/create user profile data.
const userProfile = new UserProfile('user123', 'Software Developer', 2500, 20); // Goal is to save 20%

// 2. Fetch user's transactions from your database.
const dbTransactions = [
    new Transaction('1', 2500, '2023-10-01', 'income', 'Salary', 'Monthly Paycheck', 'user123'),
    new Transaction('2', 75.50, '2023-10-05', 'expense', 'Groceries', 'Weekly shopping', 'user123'),
    new Transaction('3', 30, '2023-10-07', 'expense', 'Transport', 'Bus pass', 'user123'),
    new Transaction('4', 120, '2023-10-12', 'expense', 'Bills', 'Internet bill', 'user123'),
    new Transaction('5', 50, '2023-10-15', 'expense', 'Entertainment', 'Cinema tickets', 'user123'),
    new Transaction('6', 85, '2023-10-20', 'expense', 'Groceries', 'More shopping', 'user123'),
];

// 3. Define the reporting period.
const startDate = new Date('2023-10-01');
const endDate = new Date('2023-10-31');

// 4. Create a ReportGenerator instance with both transactions and profile.
const reportGenerator = new ReportGenerator(dbTransactions, userProfile);

// 5. Generate all the reports.
const spendingReport = reportGenerator.generateSpendingAnalysis(startDate, endDate);
const incomeExpenseReport = reportGenerator.generateIncomeVsExpenseReport(startDate, endDate);
const budgetVsActualReport = reportGenerator.generateBudgetVsActualReport(startDate, endDate); // New report

// 6. Send the generated data as a JSON response to your frontend app.
console.log('--- Spending Analysis ---');
console.log(spendingReport);

console.log('\n--- Income vs. Expense Report ---');
console.log(incomeExpenseReport);

console.log('\n--- NEW: Budget vs. Actual Performance ---');
console.log(budgetVsActualReport);
/*
Expected Output:
{
  expectedIncome: 2500,
  actualIncome: 2500,
  savingsGoal: 500,      // 20% of 2500
  actualSavings: 2139.5, // 2500 (income) - 360.5 (expenses)
  variance: 1639.5       // User saved 1639.5 more than their goal
}
*/

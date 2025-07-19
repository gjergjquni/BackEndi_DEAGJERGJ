// Import the Express framework
const express = require('express');
// Import body-parser to parse JSON request bodies
const bodyParser = require('body-parser');
// Import bcrypt for password hashing
const bcrypt = require('bcrypt');
// Import the Transaction classes from Transaction.js
const { Transaction, UserProfile, ReportGenerator } = require('./Transaction.js');

// Create an instance of an Express application
const app = express();
// Define the port the server will listen on
const PORT = 3000;

// Middleware to parse incoming JSON request bodies
app.use(bodyParser.json());

// User data storage using a hash table (object) keyed by email
// Each user now has: { password: hashedPassword, userId: uniqueId, profile: UserProfile }
const users = {};

// Store user profiles and transactions (in a real app, this would be in a database)
const userProfiles = {}; // userId -> UserProfile
const userTransactions = {}; // userId -> Transaction[]

// Generate a unique user ID
function generateUserId() {
    return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// Signup endpoint to handle POST requests to /signup
app.post('/signup', async (req, res) => {
  // Extract email, password, and profile data from the request body
  const { email, password, jobTitle, monthlySalary, savingsGoalPercentage } = req.body;

  // Check if required fields are provided
  if (!email || !password) {
    return res.status(400).json({ message: 'Please provide email and password.' });
  }

  // Check if the email is already registered
  if (users[email]) {
    return res.status(409).json({ message: 'Email is already registered.' });
  }

  try {
    // Hash the password before storing
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Generate a unique user ID
    const userId = generateUserId();
    
    // Store the user with hashed password and userId
    users[email] = { 
      password: hashedPassword, 
      userId: userId 
    };

    // Create a default user profile if profile data is provided
    if (jobTitle && monthlySalary && savingsGoalPercentage) {
      const userProfile = new UserProfile(userId, jobTitle, monthlySalary, savingsGoalPercentage);
      userProfiles[userId] = userProfile;
    }

    // Initialize empty transactions array for the user
    userTransactions[userId] = [];

    // Respond with success and user ID
    res.status(201).json({ 
      message: 'Signup successful! You can now log in.',
      userId: userId
    });
  } catch (err) {
    res.status(500).json({ message: 'Error creating user.' });
  }
});

// Login endpoint to handle POST requests to /login
app.post('/login', async (req, res) => {
  // Extract email and password from the request body
  const { email, password } = req.body;

  // Find the user by email
  const user = users[email];
  if (!user) {
    // If user not found, send 401 Unauthorized response
    return res.status(401).json({ message: 'Invalid email or password' });
  }

  try {
    // Compare the provided password with the stored hashed password
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      // If password does not match, send 401 Unauthorized response
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    // If email and password are correct, send a success response with user ID
    res.json({ 
      message: 'Login successful',
      userId: user.userId
    });
  } catch (err) {
    res.status(500).json({ message: 'Error logging in.' });
  }
});

// Endpoint to create/update user profile
app.post('/profile', async (req, res) => {
  const { email, jobTitle, monthlySalary, savingsGoalPercentage } = req.body;

  // Find the user by email
  const user = users[email];
  if (!user) {
    return res.status(404).json({ message: 'User not found.' });
  }

  try {
    // Create or update user profile
    const userProfile = new UserProfile(user.userId, jobTitle, monthlySalary, savingsGoalPercentage);
    userProfiles[user.userId] = userProfile;

    res.json({ 
      message: 'Profile updated successfully',
      profile: userProfile
    });
  } catch (err) {
    res.status(500).json({ message: 'Error updating profile.' });
  }
});

// Endpoint to add a transaction
app.post('/transaction', async (req, res) => {
  const { email, amount, date, type, category, description } = req.body;

  // Find the user by email
  const user = users[email];
  if (!user) {
    return res.status(404).json({ message: 'User not found.' });
  }

  try {
    // Create a new transaction
    const transactionId = 'tx_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    const transaction = new Transaction(transactionId, amount, date, type, category, description, user.userId);
    
    // Add to user's transactions
    userTransactions[user.userId].push(transaction);

    res.json({ 
      message: 'Transaction added successfully',
      transaction: transaction
    });
  } catch (err) {
    res.status(500).json({ message: 'Error adding transaction: ' + err.message });
  }
});

// Endpoint to get user reports
app.get('/reports/:email', async (req, res) => {
  const { email } = req.params;
  const { startDate, endDate } = req.query;

  // Find the user by email
  const user = users[email];
  if (!user) {
    return res.status(404).json({ message: 'User not found.' });
  }

  try {
    const userId = user.userId;
    const userProfile = userProfiles[userId];
    const transactions = userTransactions[userId] || [];

    if (!userProfile) {
      return res.status(404).json({ message: 'User profile not found. Please create a profile first.' });
    }

    // Create report generator
    const reportGenerator = new ReportGenerator(transactions, userProfile);

    // Generate reports
    const reports = {
      spendingAnalysis: reportGenerator.generateSpendingAnalysis(new Date(startDate), new Date(endDate)),
      incomeVsExpense: reportGenerator.generateIncomeVsExpenseReport(new Date(startDate), new Date(endDate)),
      budgetVsActual: reportGenerator.generateBudgetVsActualReport(new Date(startDate), new Date(endDate)),
      savingsGrowth: reportGenerator.generateSavingsGrowth(new Date(startDate), new Date(endDate))
    };

    res.json({ reports });
  } catch (err) {
    res.status(500).json({ message: 'Error generating reports: ' + err.message });
  }
});

// Start the server and listen on the specified port
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

// Export classes for use in other files
module.exports = { Transaction, UserProfile, ReportGenerator };










// Import the Express framework
const express = require('express');
// Import body-parser to parse JSON request bodies
const bodyParser = require('body-parser');
// Import bcrypt for password hashing
const bcrypt = require('bcrypt');
// Import the Transaction classes from Transaction.js
const { Transaction, UserProfile, ReportGenerator } = require('./Transaction.js');

// Import new modules
const SessionManager = require('./sessionManager');
const AuthMiddleware = require('./authMiddleware');
const Validators = require('./validators');
const ErrorHandler = require('./errorHandler');
const config = require('./config');

// Create an instance of an Express application
const app = express();
// Define the port the server will listen on
const PORT = config.server.port;

// Initialize session manager
const sessionManager = new SessionManager();
const authMiddleware = new AuthMiddleware(sessionManager);

// Middleware to parse incoming JSON request bodies
app.use(bodyParser.json());

// CORS middleware
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', config.cors.origin);
    res.header('Access-Control-Allow-Methods', config.cors.methods.join(', '));
    res.header('Access-Control-Allow-Headers', config.cors.allowedHeaders.join(', '));
    next();
});

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
  try {
    // Extract data from request body
    const { email, password, fullName, day, month, year, employmentStatus, jobTitle, monthlySalary, savingsGoalPercentage } = req.body;

    // Validate required fields
    ErrorHandler.validateUserInput(req.body, ['email', 'password', 'fullName', 'day', 'month', 'year', 'employmentStatus']);

    // Validate email format
    if (!Validators.validateEmail(email)) {
      throw ErrorHandler.errors.VALIDATION_ERROR('Format i pavlefshëm i email-it');
    }

    // Validate password strength
    if (!Validators.validatePassword(password)) {
      throw ErrorHandler.errors.VALIDATION_ERROR('Fjalëkalimi duhet të ketë të paktën 8 karaktere, 1 shkronjë të madhe dhe 1 numër');
    }

    // Validate name
    if (!Validators.validateName(fullName)) {
      throw ErrorHandler.errors.VALIDATION_ERROR('Emri duhet të ketë të paktën 2 karaktere');
    }

    // Validate date of birth
    if (!Validators.validateDateOfBirth(parseInt(day), parseInt(month), parseInt(year))) {
      throw ErrorHandler.errors.VALIDATION_ERROR('Data e lindjes nuk është e vlefshme');
    }

    // Validate employment status
    if (!Validators.validateEmploymentStatus(employmentStatus)) {
      throw ErrorHandler.errors.VALIDATION_ERROR('Statusi i punësimit nuk është i vlefshëm');
    }

    // Check if the email is already registered
    if (users[email]) {
      throw ErrorHandler.errors.CONFLICT('Ky email është tashmë i regjistruar');
    }

    // Hash the password before storing
    const hashedPassword = await bcrypt.hash(password, config.security.bcryptRounds);
    
    // Generate a unique user ID
    const userId = generateUserId();
    
    // Store the user with hashed password and userId
    users[email] = { 
      password: hashedPassword, 
      userId: userId,
      fullName: fullName,
      dateOfBirth: new Date(parseInt(year), parseInt(month) - 1, parseInt(day)),
      employmentStatus: employmentStatus
    };

    // Create a default user profile if profile data is provided
    if (jobTitle && monthlySalary && savingsGoalPercentage) {
      const profileValidation = Validators.validateUserProfile(jobTitle, monthlySalary, savingsGoalPercentage);
      if (!profileValidation.valid) {
        throw ErrorHandler.errors.VALIDATION_ERROR(profileValidation.message);
      }
      
      const userProfile = new UserProfile(userId, jobTitle, monthlySalary, savingsGoalPercentage);
      userProfiles[userId] = userProfile;
    }

    // Initialize empty transactions array for the user
    userTransactions[userId] = [];

    // Respond with success and user ID
    res.status(201).json({ 
      success: true,
      message: config.messages.al.registerSuccess,
      userId: userId
    });
  } catch (err) {
    ErrorHandler.logError(err, req);
    if (err.statusCode) {
      res.status(err.statusCode).json({ 
        success: false,
        error: { message: err.message, code: err.errorCode }
      });
    } else {
      res.status(500).json({ 
        success: false,
        error: { message: config.messages.al.serverError }
      });
    }
  }
});

// Login endpoint to handle POST requests to /login
app.post('/login', async (req, res) => {
  try {
    // Extract email and password from the request body
    const { email, password } = req.body;

    // Validate required fields
    ErrorHandler.validateUserInput(req.body, ['email', 'password']);

    // Validate email format
    if (!Validators.validateEmail(email)) {
      throw ErrorHandler.errors.VALIDATION_ERROR('Format i pavlefshëm i email-it');
    }

    // Find the user by email
    const user = users[email];
    if (!user) {
      throw ErrorHandler.errors.UNAUTHORIZED(config.messages.al.invalidCredentials);
    }

    // Compare the provided password with the stored hashed password
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      throw ErrorHandler.errors.UNAUTHORIZED(config.messages.al.invalidCredentials);
    }

    // Create a new session for the user
    const sessionId = sessionManager.createSession(user.userId, email);

    // If email and password are correct, send a success response with session ID
    res.json({ 
      success: true,
      message: config.messages.al.loginSuccess,
      userId: user.userId,
      sessionId: sessionId,
      user: {
        fullName: user.fullName,
        email: email,
        employmentStatus: user.employmentStatus
      }
    });
  } catch (err) {
    ErrorHandler.logError(err, req);
    if (err.statusCode) {
      res.status(err.statusCode).json({ 
        success: false,
        error: { message: err.message, code: err.errorCode }
      });
    } else {
      res.status(500).json({ 
        success: false,
        error: { message: config.messages.al.serverError }
      });
    }
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

// Logout endpoint
app.post('/logout', authMiddleware.requireAuth, (req, res) => {
  try {
    const sessionId = req.headers['x-session-id'];
    sessionManager.destroySession(sessionId);
    
    res.json({ 
      success: true,
      message: config.messages.al.logoutSuccess
    });
  } catch (err) {
    ErrorHandler.logError(err, req);
    res.status(500).json({ 
      success: false,
      error: { message: config.messages.al.serverError }
    });
  }
});

// Get user profile endpoint
app.get('/user/profile', authMiddleware.requireAuth, (req, res) => {
  try {
    const user = users[req.user.email];
    const userProfile = userProfiles[req.user.userId];
    
    res.json({
      success: true,
      user: {
        fullName: user.fullName,
        email: req.user.email,
        employmentStatus: user.employmentStatus,
        dateOfBirth: user.dateOfBirth
      },
      profile: userProfile || null
    });
  } catch (err) {
    ErrorHandler.logError(err, req);
    res.status(500).json({ 
      success: false,
      error: { message: config.messages.al.serverError }
    });
  }
});

// Get transaction categories endpoint
app.get('/categories', (req, res) => {
  res.json({
    success: true,
    categories: config.transactionCategories
  });
});

// Get employment statuses endpoint
app.get('/employment-statuses', (req, res) => {
  res.json({
    success: true,
    statuses: config.employmentStatuses
  });
});

// Error handling middleware (duhet të jetë i fundit)
app.use(ErrorHandler.handleError);

// Start the server and listen on the specified port
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Environment: ${config.server.environment}`);
  
  // Cleanup expired sessions every hour
  setInterval(() => {
    sessionManager.cleanupExpiredSessions();
  }, 60 * 60 * 1000);
});

// Export classes for use in other files
module.exports = { Transaction, UserProfile, ReportGenerator };

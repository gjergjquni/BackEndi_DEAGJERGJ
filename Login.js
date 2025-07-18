// Import the Express framework
const express = require('express');

// Create an instance of an Express application
const app = express();
// Define the port the server will listen on
const PORT = 3000;

// Middleware to parse incoming JSON request bodies (no need for body-parser in modern Express)
app.use(express.json());

// Mock user data (in a real app, this would come from a database)
// Each user is identified by their email and has a password
const users = [
  // Example user for testing:
  { email: 'user1@example.com', password: 'password123' }
];

// Signup endpoint to handle POST requests to /signup
app.post('/signup', (req, res) => {
  // Extract email and password from the request body
  const { email, password } = req.body;

  // Check if all fields are provided
  if (!email || !password) {
    return res.status(400).json({ message: 'Please provide email and password.' });
  }

  // Check if the email is already registered
  const existingUser = users.find(u => u.email === email);
  if (existingUser) {
    return res.status(409).json({ message: 'Email is already registered.' });
  }

  // Add the new user to the users array
  users.push({ email, password });

  // Respond with success
  res.status(201).json({ message: 'Signup successful! You can now log in.' });
});

// Login endpoint to handle POST requests to /login
app.post('/login', (req, res) => {
  // Extract email and password from the request body
  const { email, password } = req.body;

  // Find the user in the mock data by email
  const user = users.find(u => u.email === email);
  if (!user) {
    // If user not found, send 401 Unauthorized response
    return res.status(401).json({ message: 'Invalid email or password' });
  }

  // Check if the provided password matches the stored password
  if (user.password !== password) {
    // If password does not match, send 401 Unauthorized response
    return res.status(401).json({ message: 'Invalid email or password' });
  }

  // If email and password are correct, send a success response
  res.json({ message: 'Login successful' });
});

// Start the server and listen on the specified port
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

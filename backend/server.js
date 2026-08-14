require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

// Import routes
const authRoutes = require('./routes/auth');
const transactionsRoutes = require('./routes/transactions');
const goalsRoutes = require('./routes/goals');
const investmentsRoutes = require('./routes/investments');
const incomeStreamsRoutes = require('./routes/incomeStreams');
const estateRoutes = require('./routes/estate');
const debtsRoutes = require('./routes/debts');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionsRoutes);
app.use('/api/goals', goalsRoutes);
app.use('/api/investments', investmentsRoutes);
app.use('/api/income-streams', incomeStreamsRoutes);
app.use('/api/estate', estateRoutes);
app.use('/api/debts', debtsRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`API available at http://localhost:${PORT}/api`);
});

module.exports = app;

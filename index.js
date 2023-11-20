'use strict';

const express = require('express');
const cors = require('cors');
const workshopRouter = require('./routes/workshop.js');
// const workshopRouter = require('./routes/events.js');
const app = express();

// middleware
app.use(express.json({limit: '50mb'}));
app.use(cors({
    allowedHeaders: ["Content-Type"],
    origin: ["http://localhost:5173", "https://henger.studio", "https://admin.henger.studio"]
}));

// routes
app.use('/api/workshop', workshopRouter);
// app.use('/api/events', eventRouter);
    
// start server
console.log('Starting on port 3000')
app.listen(process.env.PORT || 3000);
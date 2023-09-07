'use strict';

const express = require('express');
const workshopRouter = require('./routes/workshop.js');
const app = express();

// middleware
app.use(express.json());

// routes
app.use('/api/workshop', workshopRouter);
    
// start server
app.listen(process.env.PORT || 3000);
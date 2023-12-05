'use strict';

import "./load-env.mjs";
import express from 'express';
import cors from 'cors';
import { expressjwt } from "express-jwt";
import workshopRouter from './routes/workshop.mjs';
import userRouter from './routes/user.mjs';

const app = express();

// middleware
app.use(express.json({ limit: '50mb' }));
app.use(cors({
    allowedHeaders: ["Content-Type"],
    origin: ["http://localhost:5173", "https://henger.studio", "https://admin.henger.studio"]
}));

// routes
app.use('/api/users', userRouter);
app.use('/api/workshops', workshopRouter);

// start server
console.log('Starting on port 3000')
app.listen(process.env.PORT || 3000, () => { console.log("Server running!") });
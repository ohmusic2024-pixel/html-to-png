const express = require('express');
const puppeteer = require('puppeteer');
const app = express();

app.use(express.json({ limit: '10mb' }));
app.use(express.text({ limit: '10mb', type: '*/*' }));

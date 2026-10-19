/**
 * DevPath Route Definition
 * Responsibility: Defines the router for DevPath endpoints and binds validation middleware and controller.
 */

const express = require('express');
const router = express.Router();
const { validateDevPathInput } = require('../middleware/validateDevPath');
const { createDevPath } = require('../controllers/devpath.controller');

// POST /api/devpath/generate
router.post('/generate', validateDevPathInput, createDevPath);

module.exports = router;

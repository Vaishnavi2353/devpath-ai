/**
 * DevPath Controller
 * Responsibility: Handles incoming HTTP requests and responses only.
 * Delegates roadmap generation business logic to devpath.service.js.
 */

const devpathService = require('../services/devpath.service');

async function createDevPath(req, res, next) {
  try {
    const roadmap = await devpathService.generateDevPath(req.body);
    return res.status(200).json(roadmap);
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  createDevPath,
};

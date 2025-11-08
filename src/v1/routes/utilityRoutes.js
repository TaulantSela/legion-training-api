const express = require("express");
const utilityController = require("../../controllers/utilityController");

const router = express.Router();

/**
 * @openapi
 * /api/v1/:
 *   get:
 *     summary: Legion API overview and quick-start instructions
 *     tags:
 *       - Utilities
 *     responses:
 *       200:
 *         description: HTML introduction
 */
router.get("/", utilityController.getRootOverview);

/**
 * @openapi
 * /api/v1/healthz:
 *   get:
 *     summary: Health check for the Legion API
 *     tags:
 *       - Utilities
 *     responses:
 *       200:
 *         description: Service is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     service:
 *                       type: string
 *                       example: legion
 *                     healthy:
 *                       type: boolean
 *                       example: true
 */
router.get("/healthz", utilityController.getHealth);

/**
 * @openapi
 * /api/v1/workouts/random:
 *   get:
 *     summary: Retrieve a random workout, optionally filtered
 *     tags:
 *       - Workouts
 *     parameters:
 *       - in: query
 *         name: mode
 *         schema:
 *           type: string
 *         description: Filter by workout mode before picking randomly
 *       - in: query
 *         name: equipment
 *         schema:
 *           type: string
 *         description: Comma-separated equipment list required in the workout
 *     responses:
 *       200:
 *         description: Random workout returned
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 data:
 *                   $ref: "#/components/schemas/Workout"
 *       404:
 *         description: No workout matches the filters
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ErrorResponse"
 *       5XX:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ErrorResponse"
 */
router.get("/workouts/random", utilityController.getRandomWorkout);

module.exports = router;

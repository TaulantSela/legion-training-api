const express = require("express");
const apicache = require("apicache");
const workoutController = require("../../controllers/workoutController");
const recordController = require("../../controllers/recordController");
const authenticate = require("../../middlewares/authenticate");
const authorize = require("../../middlewares/authorize");

const router = express.Router();
const cache = apicache.middleware;

/*
// Custom made middlewares
 const authenticate = require("../../middlewares/authenticate");
const authorize = require("../../middlewares/authorize");

router.post("/", authenticate, authorize, workoutController.createNewWorkout);
 */
// cache a single route

/**
 * @openapi
 * /api/v1/workouts:
 *   get:
 *     summary: Retrieve all workouts
 *     tags:
 *       - Workouts
 *     parameters:
 *       - in: query
 *         name: mode
 *         schema:
 *           type: string
 *         description: Filter workouts by their mode (case-insensitive match)
 *       - in: query
 *         name: equipment
 *         schema:
 *           type: string
 *         description: Comma-separated list of equipment names that must all be present
 *       - in: query
 *         name: length
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Maximum number of workouts to return
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Page number to return. Defaults to 10 items per page if length is omitted.
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum:
 *             [name, -name, mode, -mode, createdAt, -createdAt, updatedAt, -updatedAt]
 *         description: Sort field. Prefix with '-' for descending order.
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: "#/components/schemas/Workout"
 *       400:
 *         description: Invalid filters
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
router.get("/", cache("2 minutes"), workoutController.getAllWorkouts);

/**
 * @openapi
 * /api/v1/workouts/{workoutId}:
 *   get:
 *     summary: Retrieve a single workout
 *     tags:
 *       - Workouts
 *     parameters:
 *       - in: path
 *         name: workoutId
 *         required: true
 *         schema:
 *           type: string
 *         description: The UUID of the workout
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 data:
 *                   $ref: "#/components/schemas/Workout"
 *       400:
 *         description: Missing workoutId parameter
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ErrorResponse"
 *       404:
 *         description: Workout not found
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
router.get("/:workoutId", workoutController.getOneWorkout);

/**
 * @openapi
 * /api/v1/workouts/{workoutId}/records:
 *   get:
 *     summary: Retrieve all records for a workout
 *     tags:
 *       - Records
 *     parameters:
 *       - in: path
 *         name: workoutId
 *         required: true
 *         schema:
 *           type: string
 *         description: The UUID of the workout
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: "#/components/schemas/Record"
 *       400:
 *         description: Missing workoutId parameter
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ErrorResponse"
 *       404:
 *         description: Records not found for workout
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
router.get("/:workoutId/records", recordController.getRecordForWorkout);

/**
 * @openapi
 * /api/v1/workouts:
 *   post:
 *     summary: Create a new workout
 *     tags:
 *       - Workouts
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: "#/components/schemas/WorkoutInput"
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Workout created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 data:
 *                   $ref: "#/components/schemas/Workout"
 *       400:
 *         description: Invalid payload
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
router.post(
  "/",
  authenticate,
  authorize(["coach", "admin"]),
  workoutController.createNewWorkout
);

/**
 * @openapi
 * /api/v1/workouts/{workoutId}:
 *   patch:
 *     summary: Update an existing workout
 *     tags:
 *       - Workouts
 *     parameters:
 *       - in: path
 *         name: workoutId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: "#/components/schemas/WorkoutUpdate"
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Workout updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 data:
 *                   $ref: "#/components/schemas/Workout"
 *       400:
 *         description: Invalid payload or parameters
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ErrorResponse"
 *       404:
 *         description: Workout not found
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
router.patch(
  "/:workoutId",
  authenticate,
  authorize(["coach", "admin"]),
  workoutController.updateOneWorkout
);

/**
 * @openapi
 * /api/v1/workouts/{workoutId}:
 *   delete:
 *     summary: Delete a workout
 *     tags:
 *       - Workouts
 *     parameters:
 *       - in: path
 *         name: workoutId
 *         required: true
 *         schema:
 *           type: string
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       204:
 *         description: Workout deleted
 *       400:
 *         description: Missing workoutId parameter
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ErrorResponse"
 *       404:
 *         description: Workout not found
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
router.delete(
  "/:workoutId",
  authenticate,
  authorize(["coach", "admin"]),
  workoutController.deleteOneWorkout
);

module.exports = router;

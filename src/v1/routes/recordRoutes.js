const express = require("express");
const recordController = require("../../controllers/recordController");
const authenticate = require("../../middlewares/authenticate");
const authorize = require("../../middlewares/authorize");

const router = express.Router();

/**
 * @openapi
 * /api/v1/records:
 *   get:
 *     summary: Retrieve all records
 *     tags:
 *       - Records
 *     parameters:
 *       - in: query
 *         name: workoutId
 *         schema:
 *           type: string
 *         description: Filter records by workout id
 *       - in: query
 *         name: memberId
 *         schema:
 *           type: string
 *         description: Filter records by member id
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
 *       5XX:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ErrorResponse"
 */
router.get("/", recordController.getAllRecords);

/**
 * @openapi
 * /api/v1/records:
 *   post:
 *     summary: Create a new record
 *     tags:
 *       - Records
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - workout
 *               - memberId
 *               - record
 *             properties:
 *               workout:
 *                 type: string
 *               memberId:
 *                 type: string
 *               record:
 *                 type: string
 *               member:
 *                 type: string
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Record created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 data:
 *                   $ref: "#/components/schemas/Record"
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
  recordController.createNewRecord
);

/**
 * @openapi
 * /api/v1/records/{recordId}:
 *   get:
 *     summary: Retrieve a single record
 *     tags:
 *       - Records
 *     parameters:
 *       - in: path
 *         name: recordId
 *         required: true
 *         schema:
 *           type: string
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
 *                   $ref: "#/components/schemas/Record"
 *       400:
 *         description: Missing recordId parameter
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ErrorResponse"
 *       404:
 *         description: Record not found
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
router.get("/:recordId", recordController.getOneRecord);

/**
 * @openapi
 * /api/v1/records/{recordId}:
 *   patch:
 *     summary: Update an existing record
 *     tags:
 *       - Records
 *     parameters:
 *       - in: path
 *         name: recordId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               workout:
 *                 type: string
 *               memberId:
 *                 type: string
 *               record:
 *                 type: string
 *               member:
 *                 type: string
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Record updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 data:
 *                   $ref: "#/components/schemas/Record"
 *       400:
 *         description: Invalid payload or parameters
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ErrorResponse"
 *       404:
 *         description: Record not found
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
  "/:recordId",
  authenticate,
  authorize(["coach", "admin"]),
  recordController.updateOneRecord
);

/**
 * @openapi
 * /api/v1/records/{recordId}:
 *   delete:
 *     summary: Delete a record
 *     tags:
 *       - Records
 *     parameters:
 *       - in: path
 *         name: recordId
 *         required: true
 *         schema:
 *           type: string
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       204:
 *         description: Record deleted
 *       400:
 *         description: Missing recordId parameter
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ErrorResponse"
 *       404:
 *         description: Record not found
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
  "/:recordId",
  authenticate,
  authorize(["coach", "admin"]),
  recordController.deleteOneRecord
);

module.exports = router;

import { Router } from "express";
import * as reportController from "../controllers/report.controller.js";
import { authenticate } from "../middleware/authenticate.js";
import { validate } from "../middleware/validate.js";
import { reportProgressQuerySchema, exerciseReportSchema } from "../validators/report.validator.js";

const router = Router();

router.use(authenticate);

router.get("/summary", reportController.getSummary);
router.get("/progress", validate(reportProgressQuerySchema), reportController.getProgress);
router.get("/exercises/:exerciseId", validate(exerciseReportSchema), reportController.getExerciseReport);

export default router;


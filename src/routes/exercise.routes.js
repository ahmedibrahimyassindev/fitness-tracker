import { Router } from "express";
import * as exerciseController from "../controllers/exercise.controller.js";
import { validate } from "../middleware/validate.js";
import { exerciseQuerySchema, exerciseIdParamSchema } from "../validators/exercise.validator.js";

const router = Router();

router.get("/", validate(exerciseQuerySchema), exerciseController.listExercises);
router.get("/:id", validate(exerciseIdParamSchema), exerciseController.getExerciseDetails);

export default router;

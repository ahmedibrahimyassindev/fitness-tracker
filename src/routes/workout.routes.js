import { Router } from "express";
import * as workoutController from "../controllers/workout.controller.js";
import { authenticate } from "../middleware/authenticate.js";
import { validate } from "../middleware/validate.js";
import {
  createWorkoutSchema,
  updateWorkoutSchema,
  workoutIdParamSchema,
  workoutQuerySchema
} from "../validators/workout.validator.js";

const router = Router();

router.use(authenticate);

router.post("/", validate(createWorkoutSchema), workoutController.createWorkout);
router.get("/", validate(workoutQuerySchema), workoutController.listWorkouts);
router.get("/:id", validate(workoutIdParamSchema), workoutController.getWorkoutById);
router.patch("/:id", validate(updateWorkoutSchema), workoutController.updateWorkout);
router.delete("/:id", validate(workoutIdParamSchema), workoutController.deleteWorkout);

export default router;

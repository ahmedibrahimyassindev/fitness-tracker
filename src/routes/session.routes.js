import { Router } from "express";
import * as sessionController from "../controllers/session.controller.js";
import { authenticate } from "../middleware/authenticate.js";
import { validate } from "../middleware/validate.js";
import {
  createSessionSchema,
  updateSessionSchema,
  completeSessionSchema,
  sessionIdParamSchema,
  sessionQuerySchema
} from "../validators/session.validator.js";

const router = Router();

router.use(authenticate);

router.post("/", validate(createSessionSchema), sessionController.createSession);
router.get("/", validate(sessionQuerySchema), sessionController.listSessions);
router.get("/:id", validate(sessionIdParamSchema), sessionController.getSessionById);
router.patch("/:id", validate(updateSessionSchema), sessionController.updateSession);
router.patch("/:id/complete", validate(completeSessionSchema), sessionController.completeSession);
router.delete("/:id", validate(sessionIdParamSchema), sessionController.deleteSession);

export default router;


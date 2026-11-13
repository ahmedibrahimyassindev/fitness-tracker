import * as sessionService from "../services/session.service.js";

export async function createSession(req, res, next) {
  try {
    const session = await sessionService.createSession(req.user.id, req.body);
    res.status(201).json({
      success: true,
      message: "Workout session started successfully",
      data: session
    });
  } catch (error) {
    next(error);
  }
}

export async function listSessions(req, res, next) {
  try {
    const result = await sessionService.getSessions(req.user.id, req.query);
    res.status(200).json({
      success: true,
      data: result.sessions,
      pagination: result.pagination
    });
  } catch (error) {
    next(error);
  }
}

export async function getSessionById(req, res, next) {
  try {
    const session = await sessionService.getSessionById(req.user.id, req.params.id);
    res.status(200).json({
      success: true,
      data: session
    });
  } catch (error) {
    next(error);
  }
}

export async function updateSession(req, res, next) {
  try {
    const session = await sessionService.updateSession(req.user.id, req.params.id, req.body);
    res.status(200).json({
      success: true,
      message: "Workout session updated successfully",
      data: session
    });
  } catch (error) {
    next(error);
  }
}

export async function completeSession(req, res, next) {
  try {
    const session = await sessionService.completeSession(req.user.id, req.params.id, req.body);
    res.status(200).json({
      success: true,
      message: "Workout session completed successfully",
      data: session
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteSession(req, res, next) {
  try {
    await sessionService.deleteSession(req.user.id, req.params.id);
    res.status(200).json({
      success: true,
      message: "Workout session deleted successfully"
    });
  } catch (error) {
    next(error);
  }
}

import * as reportService from "../services/report.service.js";

export async function getSummary(req, res, next) {
  try {
    const summary = await reportService.getSummaryReport(req.user.id);
    res.status(200).json({
      success: true,
      data: summary
    });
  } catch (error) {
    next(error);
  }
}

export async function getProgress(req, res, next) {
  try {
    const progress = await reportService.getProgressReport(req.user.id, req.query);
    res.status(200).json({
      success: true,
      data: progress
    });
  } catch (error) {
    next(error);
  }
}

export async function getExerciseReport(req, res, next) {
  try {
    const report = await reportService.getExerciseReport(
      req.user.id,
      req.params.exerciseId,
      req.query
    );
    res.status(200).json({
      success: true,
      data: report
    });
  } catch (error) {
    next(error);
  }
}

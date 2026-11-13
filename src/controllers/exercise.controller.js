import * as exerciseService from "../services/exercise.service.js";

export async function listExercises(req, res, next) {
  try {
    const result = await exerciseService.getExercises(req.query);
    res.status(200).json({
      success: true,
      data: result.exercises,
      pagination: result.pagination
    });
  } catch (error) {
    next(error);
  }
}

export async function getExerciseDetails(req, res, next) {
  try {
    const exercise = await exerciseService.getExerciseById(req.params.id);
    res.status(200).json({
      success: true,
      data: exercise
    });
  } catch (error) {
    next(error);
  }
}

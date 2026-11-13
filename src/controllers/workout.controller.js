import * as workoutService from "../services/workout.service.js";

export async function createWorkout(req, res, next) {
  try {
    const workout = await workoutService.createWorkout(req.user.id, req.body);
    res.status(201).json({
      success: true,
      message: "Workout plan created successfully",
      data: workout
    });
  } catch (error) {
    next(error);
  }
}

export async function listWorkouts(req, res, next) {
  try {
    const result = await workoutService.getWorkouts(req.user.id, req.query);
    res.status(200).json({
      success: true,
      data: result.workouts,
      pagination: result.pagination
    });
  } catch (error) {
    next(error);
  }
}

export async function getWorkoutById(req, res, next) {
  try {
    const workout = await workoutService.getWorkoutById(req.user.id, req.params.id);
    res.status(200).json({
      success: true,
      data: workout
    });
  } catch (error) {
    next(error);
  }
}

export async function updateWorkout(req, res, next) {
  try {
    const workout = await workoutService.updateWorkout(req.user.id, req.params.id, req.body);
    res.status(200).json({
      success: true,
      message: "Workout plan updated successfully",
      data: workout
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteWorkout(req, res, next) {
  try {
    await workoutService.deleteWorkout(req.user.id, req.params.id);
    res.status(200).json({
      success: true,
      message: "Workout plan deleted successfully"
    });
  } catch (error) {
    next(error);
  }
}

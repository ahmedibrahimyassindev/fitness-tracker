import { Workout } from "../models/Workout.js";
import { Exercise } from "../models/Exercise.js";
import { ApiError } from "../utils/ApiError.js";

async function validateExerciseIds(exercises) {
  if (!exercises || exercises.length === 0) return;
  const exerciseIds = [...new Set(exercises.map((e) => e.exercise.toString()))];
  const count = await Exercise.countDocuments({ _id: { $in: exerciseIds } });
  if (count !== exerciseIds.length) {
    throw new ApiError(400, "One or more exercise IDs do not exist");
  }
}

export async function createWorkout(userId, workoutData) {
  await validateExerciseIds(workoutData.exercises);

  const workout = await Workout.create({
    ...workoutData,
    user: userId
  });

  return workout.populate("exercises.exercise");
}

export async function getWorkouts(userId, { status, from, to, page = 1, limit = 10 } = {}) {
  const filter = { user: userId };

  if (status) {
    filter.status = status;
  }

  if (from || to) {
    filter.scheduledAt = {};
    if (from) filter.scheduledAt.$gte = new Date(from);
    if (to) filter.scheduledAt.$lte = new Date(to);
  }

  const skip = (page - 1) * limit;

  const [workouts, total] = await Promise.all([
    Workout.find(filter)
      .populate("exercises.exercise")
      .sort({ scheduledAt: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Workout.countDocuments(filter)
  ]);

  return {
    workouts,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  };
}

export async function getWorkoutById(userId, workoutId) {
  const workout = await Workout.findOne({ _id: workoutId, user: userId })
    .populate("exercises.exercise")
    .lean();

  if (!workout) {
    throw new ApiError(404, "Workout not found");
  }

  return workout;
}

export async function updateWorkout(userId, workoutId, updateData) {
  if (updateData.exercises) {
    await validateExerciseIds(updateData.exercises);
  }

  const workout = await Workout.findOneAndUpdate(
    { _id: workoutId, user: userId },
    { $set: updateData },
    { new: true, runValidators: true }
  ).populate("exercises.exercise");

  if (!workout) {
    throw new ApiError(404, "Workout not found");
  }

  return workout;
}

export async function deleteWorkout(userId, workoutId) {
  const workout = await Workout.findOneAndDelete({ _id: workoutId, user: userId });
  if (!workout) {
    throw new ApiError(404, "Workout not found");
  }
  return workout;
}

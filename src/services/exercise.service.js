import { Exercise } from "../models/Exercise.js";
import { ApiError } from "../utils/ApiError.js";

export async function getExercises({ category, muscleGroup, search, page = 1, limit = 20 } = {}) {
  const filter = {};

  if (category) {
    filter.category = category.toLowerCase().trim();
  }

  if (muscleGroup) {
    filter.muscleGroups = { $in: [new RegExp(`^${muscleGroup.trim()}$`, "i")] };
  }

  if (search) {
    filter.$or = [
      { name: { $regex: search.trim(), $options: "i" } },
      { description: { $regex: search.trim(), $options: "i" } }
    ];
  }

  const skip = (page - 1) * limit;

  const [exercises, total] = await Promise.all([
    Exercise.find(filter)
      .sort({ name: 1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Exercise.countDocuments(filter)
  ]);

  return {
    exercises,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  };
}

export async function getExerciseById(id) {
  const exercise = await Exercise.findById(id).lean();
  if (!exercise) {
    throw new ApiError(404, "Exercise not found");
  }
  return exercise;
}


import { WorkoutSession } from "../models/WorkoutSession.js";
import { Workout } from "../models/Workout.js";
import { Exercise } from "../models/Exercise.js";
import { ApiError } from "../utils/ApiError.js";

async function validateSessionDependencies(userId, sessionData) {
  if (sessionData.workout) {
    const workout = await Workout.findOne({ _id: sessionData.workout, user: userId });
    if (!workout) {
      throw new ApiError(404, "Referenced workout not found for this user");
    }
  }

  if (sessionData.exercises && sessionData.exercises.length > 0) {
    const exerciseIds = [...new Set(sessionData.exercises.map((e) => e.exercise.toString()))];
    const count = await Exercise.countDocuments({ _id: { $in: exerciseIds } });
    if (count !== exerciseIds.length) {
      throw new ApiError(400, "One or more exercise IDs do not exist");
    }
  }
}

export async function createSession(userId, sessionData) {
  await validateSessionDependencies(userId, sessionData);

  const session = await WorkoutSession.create({
    ...sessionData,
    user: userId,
    startedAt: sessionData.startedAt || new Date()
  });

  return session.populate([
    { path: "workout", select: "name description scheduledAt" },
    { path: "exercises.exercise" }
  ]);
}

export async function getSessions(userId, { workout, status, from, to, page = 1, limit = 10 } = {}) {
  const filter = { user: userId };

  if (workout) {
    filter.workout = workout;
  }

  if (status) {
    filter.status = status;
  }

  if (from || to) {
    filter.startedAt = {};
    if (from) filter.startedAt.$gte = new Date(from);
    if (to) filter.startedAt.$lte = new Date(to);
  }

  const skip = (page - 1) * limit;

  const [sessions, total] = await Promise.all([
    WorkoutSession.find(filter)
      .populate([
        { path: "workout", select: "name description scheduledAt" },
        { path: "exercises.exercise" }
      ])
      .sort({ startedAt: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    WorkoutSession.countDocuments(filter)
  ]);

  return {
    sessions,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  };
}

export async function getSessionById(userId, sessionId) {
  const session = await WorkoutSession.findOne({ _id: sessionId, user: userId })
    .populate([
      { path: "workout", select: "name description scheduledAt" },
      { path: "exercises.exercise" }
    ])
    .lean();

  if (!session) {
    throw new ApiError(404, "Workout session not found");
  }

  return session;
}

export async function updateSession(userId, sessionId, updateData) {
  await validateSessionDependencies(userId, updateData);

  const session = await WorkoutSession.findOneAndUpdate(
    { _id: sessionId, user: userId },
    { $set: updateData },
    { new: true, runValidators: true }
  ).populate([
    { path: "workout", select: "name description scheduledAt" },
    { path: "exercises.exercise" }
  ]);

  if (!session) {
    throw new ApiError(404, "Workout session not found");
  }

  return session;
}

export async function completeSession(userId, sessionId, { completedAt, notes } = {}) {
  const updateFields = {
    status: "completed",
    completedAt: completedAt ? new Date(completedAt) : new Date()
  };

  if (notes) {
    updateFields.notes = notes;
  }

  const session = await WorkoutSession.findOneAndUpdate(
    { _id: sessionId, user: userId },
    { $set: updateFields },
    { new: true, runValidators: true }
  ).populate([
    { path: "workout", select: "name description scheduledAt" },
    { path: "exercises.exercise" }
  ]);

  if (!session) {
    throw new ApiError(404, "Workout session not found");
  }

  // If the session was linked to a planned workout, we can also update the planned workout's status to completed
  if (session.workout) {
    await Workout.findOneAndUpdate(
      { _id: session.workout, user: userId, status: "planned" },
      { $set: { status: "completed" } }
    );
  }

  return session;
}

export async function deleteSession(userId, sessionId) {
  const session = await WorkoutSession.findOneAndDelete({ _id: sessionId, user: userId });
  if (!session) {
    throw new ApiError(404, "Workout session not found");
  }
  return session;
}


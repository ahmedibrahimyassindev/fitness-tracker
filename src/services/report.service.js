import mongoose from "mongoose";
import { WorkoutSession } from "../models/WorkoutSession.js";
import { Workout } from "../models/Workout.js";
import { Exercise } from "../models/Exercise.js";
import { ApiError } from "../utils/ApiError.js";

export async function getSummaryReport(userId) {
  const userObjectId = new mongoose.Types.ObjectId(userId);

  const [sessionStats, plannedWorkoutsCount] = await Promise.all([
    WorkoutSession.aggregate([
      { $match: { user: userObjectId } },
      {
        $group: {
          _id: null,
          totalSessions: { $sum: 1 },
          completedSessions: {
            $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] }
          }
        }
      }
    ]),
    Workout.countDocuments({ user: userId })
  ]);

  const volumeAndDays = await WorkoutSession.aggregate([
    {
      $match: {
        user: userObjectId,
        status: "completed"
      }
    },
    { $unwind: "$exercises" },
    { $unwind: "$exercises.sets" },
    {
      $group: {
        _id: null,
        totalVolume: {
          $sum: {
            $multiply: [
              { $ifNull: ["$exercises.sets.reps", 0] },
              { $ifNull: ["$exercises.sets.weight", 0] }
            ]
          }
        },
        dates: {
          $addToSet: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: { $ifNull: ["$completedAt", "$startedAt"] }
            }
          }
        }
      }
    }
  ]);

  const totalSessions = sessionStats[0]?.totalSessions || 0;
  const completedSessions = sessionStats[0]?.completedSessions || 0;
  const totalVolume = volumeAndDays[0]?.totalVolume || 0;
  const totalTrainingDays = volumeAndDays[0]?.dates?.length || 0;

  return {
    totalSessions,
    completedSessions,
    totalWorkoutsPlanned: plannedWorkoutsCount,
    totalTrainingDays,
    totalVolume
  };
}

export async function getProgressReport(userId, { from, to } = {}) {
  const userObjectId = new mongoose.Types.ObjectId(userId);

  const matchFilter = {
    user: userObjectId,
    status: "completed"
  };

  const dateFilter = {};
  if (from) dateFilter.$gte = new Date(from);
  if (to) dateFilter.$lte = new Date(to);

  if (from || to) {
    matchFilter.$or = [
      { completedAt: dateFilter },
      { completedAt: null, startedAt: dateFilter }
    ];
  }

  const sessions = await WorkoutSession.find(matchFilter)
    .populate("exercises.exercise", "name category muscleGroups")
    .sort({ completedAt: 1, startedAt: 1 })
    .lean();

  let totalVolume = 0;
  const trainingDaysSet = new Set();
  const exerciseStatsMap = new Map();

  for (const session of sessions) {
    const sessionDate = (session.completedAt || session.startedAt).toISOString().split("T")[0];
    trainingDaysSet.add(sessionDate);

    for (const exItem of session.exercises || []) {
      const exerciseId = exItem.exercise?._id?.toString() || exItem.exercise?.toString();
      const exerciseName = exItem.exercise?.name || "Unknown Exercise";

      if (!exerciseStatsMap.has(exerciseId)) {
        exerciseStatsMap.set(exerciseId, {
          exerciseId,
          exerciseName,
          totalSets: 0,
          totalReps: 0,
          totalVolume: 0,
          maxWeight: 0
        });
      }

      const stat = exerciseStatsMap.get(exerciseId);

      for (const set of exItem.sets || []) {
        const reps = set.reps || 0;
        const weight = set.weight || 0;
        const vol = reps * weight;

        stat.totalSets += 1;
        stat.totalReps += reps;
        stat.totalVolume += vol;
        if (weight > stat.maxWeight) {
          stat.maxWeight = weight;
        }

        totalVolume += vol;
      }
    }
  }

  return {
    dateRange: {
      from: from || null,
      to: to || null
    },
    totalCompletedSessions: sessions.length,
    totalTrainingDays: trainingDaysSet.size,
    totalVolume,
    exerciseBreakdown: Array.from(exerciseStatsMap.values())
  };
}

export async function getExerciseReport(userId, exerciseId, { from, to } = {}) {
  const exercise = await Exercise.findById(exerciseId).lean();
  if (!exercise) {
    throw new ApiError(404, "Exercise not found");
  }

  const userObjectId = new mongoose.Types.ObjectId(userId);
  const exerciseObjectId = new mongoose.Types.ObjectId(exerciseId);

  const matchFilter = {
    user: userObjectId,
    status: "completed",
    "exercises.exercise": exerciseObjectId
  };

  const dateFilter = {};
  if (from) dateFilter.$gte = new Date(from);
  if (to) dateFilter.$lte = new Date(to);

  if (from || to) {
    matchFilter.$or = [
      { completedAt: dateFilter },
      { completedAt: null, startedAt: dateFilter }
    ];
  }

  const sessions = await WorkoutSession.find(matchFilter)
    .sort({ completedAt: 1, startedAt: 1 })
    .lean();

  let maxWeightLifted = 0;
  let totalVolumeLifted = 0;
  let totalRepsCompleted = 0;
  let totalSetsCompleted = 0;

  const history = sessions.map((session) => {
    const exData = session.exercises.find(
      (e) => e.exercise.toString() === exerciseId
    );

    let sessionExVolume = 0;
    let sessionExReps = 0;
    let sessionExMaxWeight = 0;

    for (const set of exData?.sets || []) {
      const reps = set.reps || 0;
      const weight = set.weight || 0;
      const vol = reps * weight;

      sessionExVolume += vol;
      sessionExReps += reps;
      if (weight > sessionExMaxWeight) {
        sessionExMaxWeight = weight;
      }
    }

    totalVolumeLifted += sessionExVolume;
    totalRepsCompleted += sessionExReps;
    totalSetsCompleted += (exData?.sets?.length || 0);
    if (sessionExMaxWeight > maxWeightLifted) {
      maxWeightLifted = sessionExMaxWeight;
    }

    return {
      sessionId: session._id,
      date: session.completedAt || session.startedAt,
      setsCount: exData?.sets?.length || 0,
      repsCount: sessionExReps,
      maxWeight: sessionExMaxWeight,
      totalVolume: sessionExVolume,
      notes: exData?.notes || session.notes || ""
    };
  });

  return {
    exercise: {
      id: exercise._id,
      name: exercise.name,
      category: exercise.category,
      muscleGroups: exercise.muscleGroups
    },
    dateRange: {
      from: from || null,
      to: to || null
    },
    stats: {
      totalSessionsWithExercise: sessions.length,
      totalSetsCompleted,
      totalRepsCompleted,
      maxWeightLifted,
      totalVolumeLifted
    },
    history
  };
}


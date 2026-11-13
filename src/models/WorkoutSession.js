import mongoose from "mongoose";

const sessionSetSchema = new mongoose.Schema(
  {
    reps: {
      type: Number,
      required: [true, "Reps count is required"],
      min: [0, "Reps cannot be negative"]
    },
    weight: {
      type: Number,
      required: [true, "Weight is required"],
      min: [0, "Weight cannot be negative"],
      default: 0
    }
  },
  { _id: true }
);

const sessionExerciseSchema = new mongoose.Schema(
  {
    exercise: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Exercise",
      required: [true, "Exercise reference is required"]
    },
    sets: [sessionSetSchema],
    notes: {
      type: String,
      trim: true
    }
  },
  { _id: true }
);

const workoutSessionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User reference is required"],
      index: true
    },
    workout: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Workout",
      default: null
    },
    startedAt: {
      type: Date,
      default: Date.now
    },
    completedAt: {
      type: Date,
      default: null
    },
    status: {
      type: String,
      enum: {
        values: ["in_progress", "completed", "abandoned"],
        message: "{VALUE} is not a valid session status"
      },
      default: "in_progress"
    },
    exercises: [sessionExerciseSchema],
    notes: {
      type: String,
      trim: true
    }
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        delete ret.__v;
        return ret;
      }
    }
  }
);

workoutSessionSchema.index({ user: 1, completedAt: -1 });
workoutSessionSchema.index({ user: 1, startedAt: -1 });

export const WorkoutSession = mongoose.model("WorkoutSession", workoutSessionSchema);

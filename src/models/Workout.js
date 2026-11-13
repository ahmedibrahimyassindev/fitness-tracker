import mongoose from "mongoose";

const workoutExerciseSchema = new mongoose.Schema(
  {
    exercise: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Exercise",
      required: [true, "Exercise reference is required"]
    },
    sets: {
      type: Number,
      required: [true, "Sets count is required"],
      min: [1, "Sets must be at least 1"]
    },
    reps: {
      type: Number,
      required: [true, "Reps count is required"],
      min: [1, "Reps must be at least 1"]
    },
    targetWeight: {
      type: Number,
      min: [0, "Target weight cannot be negative"],
      default: 0
    },
    restSeconds: {
      type: Number,
      min: [0, "Rest seconds cannot be negative"],
      default: 60
    },
    notes: {
      type: String,
      trim: true
    }
  },
  { _id: true }
);

const workoutSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User reference is required"],
      index: true
    },
    name: {
      type: String,
      required: [true, "Workout name is required"],
      trim: true
    },
    description: {
      type: String,
      trim: true
    },
    scheduledAt: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: {
        values: ["planned", "completed", "cancelled"],
        message: "{VALUE} is not a valid workout status"
      },
      default: "planned"
    },
    exercises: [workoutExerciseSchema],
    comments: {
      type: [String],
      default: []
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

workoutSchema.index({ user: 1, scheduledAt: 1 });
workoutSchema.index({ user: 1, status: 1 });

export const Workout = mongoose.model("Workout", workoutSchema);

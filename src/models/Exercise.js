import mongoose from "mongoose";

const exerciseSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Exercise name is required"],
      trim: true,
      unique: true
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      enum: {
        values: ["strength", "cardio", "flexibility"],
        message: "{VALUE} is not a valid category"
      },
      lowercase: true,
      trim: true
    },
    muscleGroups: {
      type: [String],
      default: []
    },
    equipment: {
      type: [String],
      default: []
    },
    instructions: {
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

exerciseSchema.index({ category: 1 });
exerciseSchema.index({ muscleGroups: 1 });
exerciseSchema.index({ name: "text", description: "text" });

export const Exercise = mongoose.model("Exercise", exerciseSchema);

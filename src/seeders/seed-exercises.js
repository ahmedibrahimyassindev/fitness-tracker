import "dotenv/config";
import { connectToDatabase, disconnectDatabase } from "../config/database.js";
import { Exercise } from "../models/Exercise.js";
import { exercisesData } from "./exercises.data.js";

export async function seedExercises() {
  console.log("Connecting to MongoDB...");
  await connectToDatabase();

  let insertedCount = 0;
  let updatedCount = 0;

  for (const item of exercisesData) {
    const result = await Exercise.updateOne(
      { name: item.name },
      { $set: item },
      { upsert: true }
    );

    if (result.upsertedCount > 0) {
      insertedCount++;
    } else if (result.modifiedCount > 0) {
      updatedCount++;
    }
  }

  console.log(`Seeding complete: ${insertedCount} inserted, ${updatedCount} updated, ${exercisesData.length} total processed.`);
  await disconnectDatabase();
}

if (process.argv[1] && process.argv[1].endsWith("seed-exercises.js")) {
  seedExercises()
    .then(() => {
      console.log("Seeding script finished successfully.");
      process.exit(0);
    })
    .catch((err) => {
      console.error("Seeding failed:", err);
      process.exit(1);
    });
}

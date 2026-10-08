import "dotenv/config";
import { defineConfig } from "prisma/config";
import { configureDatabaseTarget } from "./scripts/database-target";

configureDatabaseTarget();

export default defineConfig({
  schema: "prisma/schema.prisma",

  migrations: {
    path: "prisma/migrations",
  },

  datasource: {
    url: process.env["DIRECT_DATABASE_URL"],
  },
});
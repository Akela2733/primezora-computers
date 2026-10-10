import "dotenv/config";
import { defineConfig } from "prisma/config";
import { configureDatabaseTarget } from "./scripts/database-target";
import { getPrismaCliConnectionString } from "./src/lib/prisma-connection";

configureDatabaseTarget();

export default defineConfig({
  schema: "prisma/schema.prisma",

  migrations: {
    path: "prisma/migrations",
  },

  datasource: {
    url: getPrismaCliConnectionString(process.env),
  },
});
import { config } from "dotenv";
import { defineConfig } from "prisma/config";

config({ path: "./.env" });

export default defineConfig({
  schema: "prisma/schema.prisma",
  engine: "classic",
  datasource: {
    url: process.env.DATABASE_URL ?? "",
  },
  migrations: {
    path: "prisma/migrations",
  },
});
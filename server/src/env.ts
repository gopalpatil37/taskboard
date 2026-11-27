// Loads and validates the server's environment configuration.
import "dotenv/config";
import { z } from "zod";

export const env = z
  .object({
    DB_HOST: z.string().min(1),
    DB_PORT: z.coerce.number().default(5432),
    DB_NAME: z.string().min(1),
    DB_USER: z.string().min(1),
    DB_PASSWORD: z.string().min(1),
    DB_SSL: z.enum(["true", "false"]).default("false"),
    JWT_SECRET: z.string().min(16),
    CLIENT_ORIGIN: z.string().min(1),
    PORT: z.coerce.number().default(3000),
    NODE_ENV: z.string().default("development"),
  })
  .parse(process.env);
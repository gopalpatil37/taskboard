
import "dotenv/config";
import { z } from "zod";

export const env = z
  .object({
    DATABASE_URL: z.string().url(),
    JWT_SECRET: z.string().min(16),
    CLIENT_ORIGIN: z.string().min(1),
    PORT: z.coerce.number().default(3000),
    NODE_ENV: z.string().default("development"),
  })
  .parse(process.env);

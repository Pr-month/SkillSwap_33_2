import { QueryFailedError } from "typeorm";

export interface PostgresError extends QueryFailedError {
  code?: string;
  detail?: string;
}
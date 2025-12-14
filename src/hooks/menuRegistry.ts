/*
  Thin re-export module so code importing from
  `src/lib/hooks/menuRegistry` continues to work,
  while `src/shared/config/menuRegistry.ts` remains the source of truth.
*/

export * from "@/layout/menuRegistry";
import { cardMap } from "@/layout/menuRegistry";
export default cardMap;

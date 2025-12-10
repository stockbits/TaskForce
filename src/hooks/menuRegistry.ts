/*
  Thin re-export module so code importing from
  `src/lib/hooks/menuRegistry` continues to work,
  while `src/shared/config/menuRegistry.ts` remains the source of truth.
*/

export * from "@/shared-config/menuRegistry";
import { cardMap } from "@/shared-config/menuRegistry";
export default cardMap;

/**
 * LEAF SS Config Store (Read-Only)
 *
 * This is a simple access layer for the master config.
 * It intentionally has:
 *  - no state
 *  - no mutations
 *  - no external dependencies
 */

import LEAF_SS_CONFIG from "./leafSSConfig";

export function getLeafSSConfig() {
  return LEAF_SS_CONFIG;
}

export default getLeafSSConfig;

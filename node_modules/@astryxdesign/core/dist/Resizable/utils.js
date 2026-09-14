// Copyright (c) Meta Platforms, Inc. and affiliates.

/**
 * @file utils.ts
 * @output Server-safe Resizable sizing helpers and public types
 * @position Subpath entry point: `@astryxdesign/core/Resizable/utils`
 */

export { pixel } from "../Table/utils.js";

/** A percentage with exactly one pixel floor or ceiling. */

/** A Resizable size: compatible atomic values or a structured size. */

/**
 * Create a literal percentage with one pixel floor or ceiling.
 *
 * The options argument is required because an unbounded percentage already has
 * the canonical `'N%'` spelling. Use Table's `pixel()` helper for the bound.
 */
export function percent(value, options) {
  return {
    type: 'percent',
    value,
    ...options
  };
}
// Copyright (c) Meta Platforms, Inc. and affiliates.

'use client';

/**
 * @file useAdaptivePresentation.ts
 * @input Uses the shared SSR-safe media-query hook
 * @output Resolves popover/bottom-sheet presentation policy
 * @position Internal overlay policy shared across component families
 */
import { useMediaQuery } from "./useMediaQuery.js";
// Width keeps desktop-class tablets and large touch displays anchored by
// default. Pointer capability, rather than `hover: none`, avoids excluding
// touch browsers that also report hover capability.
export const COMPACT_TOUCH_PRESENTATION_QUERY = '(max-width: 768px) and (pointer: coarse)';
export function useAdaptivePresentation(presentation) {
  const isCompactTouch = useMediaQuery(COMPACT_TOUCH_PRESENTATION_QUERY);
  return presentation === 'adaptive' ? isCompactTouch ? 'bottom-sheet' : 'popover' : presentation;
}
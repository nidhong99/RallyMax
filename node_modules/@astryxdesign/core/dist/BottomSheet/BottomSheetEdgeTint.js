// Copyright (c) Meta Platforms, Inc. and affiliates.

'use client';

/**
 * @file BottomSheetEdgeTint.tsx
 * @input Uses StyleX and core color tokens
 * @output Exports BottomSheetEdgeTint, an internal decorative element
 * @position Private helper rendered inside every BottomSheet dialog
 *
 * iOS 26 Safari dropped `<meta name="theme-color">` and instead derives the
 * colour it paints behind its translucent toolbars by sampling the page: it
 * hit tests a point just inside each viewport edge, walks up to the nearest
 * `fixed`/`sticky` ancestor, and extends that element's declared
 * `background-color` into the browser chrome.
 *
 * WebKit may otherwise extend either the dialog backdrop or the host page into
 * the browser chrome. Which one wins varies with dialog mode and the page's
 * own fixed or sticky edge content, so relying on the backdrop makes otherwise
 * identical BottomSheets produce different toolbar colours.
 *
 * This element gives the heuristic something unambiguous to sample: fixed,
 * full width, flush with the bottom edge, taller than WebKit's 10px minimum
 * for reading a declared colour, and painted in the sheet's own surface
 * colour. It is masked out so it never renders for the user; Safari reads the
 * computed style, not the painted pixels.
 *
 * Everywhere else it is inert decoration.
 *
 * SYNC: When modified, update these files to stay in sync:
 * - /packages/core/src/BottomSheet/BottomSheet.tsx
 * - /packages/core/src/BottomSheet/BottomSheetSwitcher.tsx
 * - /packages/core/src/BottomSheet/BottomSheetEdgeTint.test.tsx
 */
import * as stylex from '@stylexjs/stylex';
import "../theme/tokens.stylex.js";
import { colorVars } from "../theme/tokens.stylex.js";

/**
 * WebKit ignores the declared `background-color` of a sampled box thinner than
 * 10px and falls back to sampling painted pixels, which a masked element has
 * none of. 12px clears that floor with room to spare and is still far below
 * the ~40px of chrome it colours.
 */
import { jsx as _jsx } from "react/jsx-runtime";
const SAMPLE_HEIGHT_PX = 12;
/**
 * Colours the iOS Safari toolbar strip below a sheet. Renders nothing visible;
 * see the file header for why it exists.
 */
export function BottomSheetEdgeTint() {
  return /*#__PURE__*/_jsx("div", {
    ...{
      className: "xixxii4 x17y0mx6 x1ey2m1c x1kpxq89 x10xzikg xhtitgo x47corl x1cb67k9 xt2iwb0"
    },
    "data-sheet-edge-tint": "",
    "aria-hidden": "true"
  });
}
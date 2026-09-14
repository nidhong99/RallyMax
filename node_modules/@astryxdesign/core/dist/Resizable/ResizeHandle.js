// Copyright (c) Meta Platforms, Inc. and affiliates.

'use client';

/**
 * @file ResizeHandle.tsx
 * @input direction, isReversed, hasDivider, isAlwaysVisible, pillPlacement, ResizableProps
 * @output Styled drag handle with WAI-ARIA separator role and keyboard support
 * @position Between resizable panels; consumed directly by builders
 *
 * The handle element is 1px wide (the divider line itself), with an
 * absolutely-positioned wider hit area for pointer interaction.
 * Pill grip indicator can sit on either side of the divider (or centered)
 * via pillPlacement. Default 'auto' places the pill on the panel side and
 * flips when the panel collapses to 0px so it stays accessible.
 *
 * Pill placement uses a single stylex dynamic style that accepts a direction
 * multiplier (-1 or 1). The pill element has its own themeProps
 * ('resize-handle-pill') so themes can target size/shape directly.
 *
 * While the panel is collapsed, aria-valuenow is clamped to aria-valuemin
 * (a value below the minimum is invalid per WCAG 4.1.2) and a localized
 * "Collapsed" aria-valuetext announces the real state.
 *
 * Dragging takes pointer capture on the grab zone, so the rest of the gesture
 * is delivered to that element instead of being hit-tested against whatever
 * the cursor happens to be over. A resizable region that contains an embedded
 * frame otherwise loses the drag the moment the cursor crosses the frame: the
 * events go to the guest document, and a listener on the host window never
 * hears them again. Captured events are delivered to the capturing element,
 * so the move/up/cancel handlers live on the grab zone (as in Slider), not on
 * window.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import * as stylex from '@stylexjs/stylex';
import { devWarn } from "../utils/devWarning.js";
import "../theme/tokens.stylex.js";
import { colorVars, durationVars, easeVars, radiusVars, spacingVars } from "../theme/tokens.stylex.js";
import { focusOutlineProps } from "../utils/focusOutline.stylex.js";
import { mergeProps, rtlStyles } from "../utils/index.js";
import { themeProps } from "../utils/themeProps.js";
import { useTranslator } from "../i18n/index.js";
import { useMergedRefs } from "../hooks/useMergedRefs.js";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
const KEYBOARD_STEP = 10;
const KEYBOARD_LARGE_STEP = 50;
function resolveEffectiveSide(pillPlacement, isReversed, isCollapsed) {
  if (pillPlacement !== 'auto') {
    return pillPlacement;
  }
  const panelSide = isReversed ? 'end' : 'start';
  if (isCollapsed) {
    return panelSide === 'start' ? 'end' : 'start';
  }
  return panelSide;
}

/**
 * Hit-area inline bias, expressed as a fraction of the pill's per-side offset.
 *
 * The visible pill is placed by `pillOffsetX`/`pillOffsetY`: anchored at the
 * divider's inline-start edge and pushed one grip-width-plus-gap toward the
 * panel side via a PHYSICAL translate (dir −1 = start, +1 = end). Because that
 * offset is physical, the pill sits on the same physical side of the divider in
 * both LTR and RTL. The grab zone must sit OVER that pill, so it has to use the
 * exact same anchor + physical-offset construction as the pill (just wider) —
 * anchoring the hit area at the divider centre (`insetInlineStart: 50%`) and
 * biasing with a percentage translate mixes a logical anchor (which flips under
 * RTL) with a physical translate (which doesn't), leaving the grab zone stranded
 * to one side under RTL. Returning the pill's `dir` here lets the hit area reuse
 * `pillOffsetX`/`pillOffsetY` so the two elements are positioned identically.
 */
function hitAreaBiasDir(effectiveSide) {
  if (effectiveSide === 'center') {
    return null;
  }
  return effectiveSide === 'start' ? -1 : 1;
}

/**
 * Drag feedback lives on `<body>`, not on the handle: the pointer spends the
 * drag off the handle, over whatever the panels contain, and the resize cursor
 * has to hold there. Module scope so the writes stay outside the component.
 */
function applyBodyDragStyles(isHorizontal) {
  document.body.style.cursor = isHorizontal ? 'col-resize' : 'row-resize';
  document.body.style.userSelect = 'none';
}
function clearBodyDragStyles() {
  document.body.style.cursor = '';
  document.body.style.userSelect = '';
}
const styles = {
  handle: {
    kVAEAm: "x1n2onr6",
    kmuXW: "x2lah0s",
    k1xSpc: "x78zum5",
    kGNEyG: "x6s0dn4",
    kjj79g: "xl56j7k",
    kWkggS: "x1m4xfpy",
    k1ekBW: "x15406qy",
    kIyJzY: "xuedmi6",
    kAMwcw: "xlr8y92",
    $$css: true
  },
  overlay: {
    kVAEAm: "x10l6tqk",
    kY2c9j: "xhtitgo",
    kWkggS: "xjbqb8w",
    $$css: true
  },
  overlayHorizontal: {
    kt4wiu: "xtijo5x",
    k87sOh: "x13vifvy",
    krVfgx: "x1ey2m1c",
    kzqmXN: "xkhob8h",
    $$css: true
  },
  overlayVertical: {
    krVfgx: "x1ey2m1c",
    kLqNvP: "x1o0tod",
    kt4wiu: "xtijo5x",
    kZKoxP: "x5kfih4",
    $$css: true
  },
  horizontal: {
    kzqmXN: "x1i1rx1s",
    kZKoxP: "x5yr21d",
    kkrTdU: "xicojor x16khyan",
    $$css: true
  },
  vertical: {
    kZKoxP: "xjm9jq1",
    kzqmXN: "xh8yej3",
    kkrTdU: "xyozgr7 x16khyan",
    $$css: true
  },
  noDividerHorizontal: {
    kWkggS: "xjbqb8w",
    kzqmXN: "xnalus7",
    $$css: true
  },
  noDividerVertical: {
    kWkggS: "xjbqb8w",
    kZKoxP: "xqtp20y",
    $$css: true
  },
  handleHover: {
    kWkggS: "x1m4xfpy",
    $$css: true
  },
  handleActive: {
    kWkggS: "x7njt3n",
    $$css: true
  },
  disabled: {
    kkrTdU: "xt0e3qv",
    kfzvcC: "x47corl",
    $$css: true
  },
  hitArea: {
    kVAEAm: "x10l6tqk",
    kY2c9j: "x1vjfegm",
    kFalU9: "x5ve5x3",
    kfSwDN: "x87ps6o",
    $$css: true
  },
  hitAreaHorizontal: {
    kzqmXN: "x12xnipv",
    k87sOh: "x13vifvy",
    krVfgx: "x1ey2m1c",
    kkrTdU: "xicojor x16khyan",
    $$css: true
  },
  hitAreaVertical: {
    kZKoxP: "x6b6gus",
    kLqNvP: "x1o0tod",
    kt4wiu: "xtijo5x",
    kkrTdU: "xyozgr7 x16khyan",
    $$css: true
  },
  hitAreaCenteredY: {
    k87sOh: "xwa60dl",
    k3aq6I: "x1cb1t30",
    $$css: true
  },
  pill: {
    kVAEAm: "x10l6tqk",
    kY2c9j: "xhtitgo",
    kfzvcC: "x47corl",
    kaIpWk: "xjspbzw",
    kWkggS: "x1m4xfpy",
    k1ekBW: "x1wbls7o",
    kIyJzY: "xuedmi6",
    kAMwcw: "xlr8y92",
    k87sOh: "xwa60dl",
    $$css: true
  },
  pillHorizontal: {
    kzqmXN: "x1g8rjiy",
    kZKoxP: "x18to7ep",
    $$css: true
  },
  pillVertical: {
    kzqmXN: "xgc8j7m",
    kZKoxP: "xuoj239",
    $$css: true
  },
  pillHidden: {
    kSiTet: "xg01cxk",
    $$css: true
  },
  pillVisible: {
    kSiTet: "x1hc1fzr",
    $$css: true
  },
  pillHover: {
    kSiTet: "x1hc1fzr",
    kWkggS: "x1m4xfpy",
    $$css: true
  },
  pillActive: {
    kSiTet: "x1hc1fzr",
    kWkggS: "x7njt3n",
    $$css: true
  }
};

// Dynamic styles — avoids inline style overrides.
// Each axis gets its own function since StyleX requires static structure.
const _temp = {
  kLqNvP: "x1o0tod",
  k3aq6I: "x11wx31z " + "x75qhwu",
  "$$css": true
};
const _temp2 = {
  k87sOh: "x13vifvy",
  k3aq6I: "xsqj5wx",
  "$$css": true
};
const _temp3 = {
  kLqNvP: "x1o0tod",
  k3aq6I: "xsqj5wx",
  "$$css": true
};
const _temp4 = {
  k87sOh: "x13vifvy",
  k3aq6I: "xsqj5wx",
  "$$css": true
};
const dynamicStyles = {
  hitAreaOffsetX: dir => [_temp, {
    "--x-qthpiu": `translateX(calc(${dir} * (3px + ${spacingVars['--spacing-1']}) - 6.5px))` != null ? `translateX(calc(${dir} * (3px + ${spacingVars['--spacing-1']}) - 6.5px))` : undefined,
    "--x-sj6hyi": `translateX(calc(${dir} * (3px + ${spacingVars['--spacing-1']}) + 6.5px))` != null ? `translateX(calc(${dir} * (3px + ${spacingVars['--spacing-1']}) + 6.5px))` : undefined
  }],
  hitAreaOffsetY: dir => [_temp2, {
    "--x-transform": `translateY(calc(${dir} * (3px + ${spacingVars['--spacing-1']}) - 6.5px))` != null ? `translateY(calc(${dir} * (3px + ${spacingVars['--spacing-1']}) - 6.5px))` : undefined
  }],
  pillOffsetX: dir => [_temp3, {
    "--x-transform": `translate(calc(${dir} * (100% + ${spacingVars['--spacing-1']})), -50%)` != null ? `translate(calc(${dir} * (100% + ${spacingVars['--spacing-1']})), -50%)` : undefined
  }],
  pillOffsetY: dir => [_temp4, {
    "--x-transform": `translate(-50%, calc(${dir} * (100% + ${spacingVars['--spacing-1']})))` != null ? `translate(-50%, calc(${dir} * (100% + ${spacingVars['--spacing-1']})))` : undefined
  }]
};
/**
 * Draggable resize handle placed between resizable panels. Renders as a thin
 * divider line with a wider invisible hit area and optional pill grip indicator.
 * Supports keyboard resizing via arrow keys and WAI-ARIA separator role.
 *
 * The pill element uses class `astryx-resize-handle-pill` for theme targeting.
 *
 * @example
 * ```
 * <ResizeHandle
 *   resizable={sidebar.props}
 *   direction="horizontal"
 *   hasDivider />
 * ```
 */
export function ResizeHandle({
  direction = 'horizontal',
  position: positionMode = 'inline',
  isReversed = false,
  isDisabled = false,
  hasDivider = false,
  isAlwaysVisible = true,
  pillPlacement = 'auto',
  label: labelFromProps,
  resizable,
  children,
  xstyle,
  className,
  ref,
  ...props
}) {
  const t = useTranslator();
  const label = labelFromProps ?? t('@astryx.resizable.handle.label');
  const handleRef = useRef(null);
  // The pointer that owns the in-flight drag, plus the values its deltas are
  // measured against. A ref so moves don't re-render, and so unmount can tell
  // a live drag from a finished one.
  const dragRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const isHorizontal = direction === 'horizontal';
  const isOverlay = positionMode === 'overlay';
  const sign = isReversed ? -1 : 1;
  const effectiveSide = resolveEffectiveSide(pillPlacement, isReversed, resizable?._isCollapsed ?? false);
  // Physical offset direction shared by the pill and the grab zone (null =
  // centered / no bias). Keeps the two positioned identically in LTR and RTL.
  const hitBiasDir = hitAreaBiasDir(effectiveSide);
  const getRTLMultiplier = useCallback(() => {
    const el = handleRef.current;
    if (!el) {
      return 1;
    }
    return getComputedStyle(el).direction === 'rtl' ? -1 : 1;
  }, []);
  const isInteracting = isHovered || isFocused;

  // A handle whose axis disagrees with its hook drags along one axis while the
  // hook measures percentage bounds on the other. `ResizableProps` is exported,
  // so `_direction` is optional for old hand-built objects; absent means there
  // is no hook axis to compare, not that the hook is horizontal.
  const didWarnAxisRef = useRef(false);
  useEffect(() => {
    const hookDirection = resizable?._direction;
    if (hookDirection != null && hookDirection !== direction && !didWarnAxisRef.current) {
      didWarnAxisRef.current = true;
      devWarn('ResizeHandle', `direction="${direction}" but its useResizable region is ` + `"${hookDirection}". They must match: the hook measures one axis ` + 'and the handle drags the other.');
    }
  }, [direction, resizable]);

  // --- Pointer drag ---
  const clearDrag = useCallback(() => {
    dragRef.current = null;
    setIsDragging(false);
    clearBodyDragStyles();
  }, []);
  const handlePointerDown = useCallback(e => {
    if (isDisabled || !resizable || dragRef.current) {
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    // Take the pointer for the whole gesture. Without capture the browser
    // re-hit-tests every move, so a frame anywhere under the drag path
    // swallows the rest of it into the guest document.
    e.currentTarget.setPointerCapture?.(e.pointerId);
    dragRef.current = {
      pointerId: e.pointerId,
      startPos: isHorizontal ? e.clientX : e.clientY,
      rtl: isHorizontal ? getRTLMultiplier() : 1
    };
    setIsDragging(true);
    resizable._onResizeStart();
    applyBodyDragStyles(isHorizontal);
  }, [isDisabled, resizable, isHorizontal, getRTLMultiplier]);
  const handlePointerMove = useCallback(e => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== e.pointerId || !resizable) {
      return;
    }
    const currentPos = isHorizontal ? e.clientX : e.clientY;
    resizable._onResizeMove((currentPos - drag.startPos) * drag.rtl * sign);
  }, [resizable, isHorizontal, sign]);
  const handlePointerUp = useCallback(e => {
    if (dragRef.current?.pointerId !== e.pointerId) {
      return;
    }
    clearDrag();
    resizable?._onResizeEnd();
  }, [clearDrag, resizable]);

  // Serves pointercancel and lostpointercapture alike: an interrupted drag
  // ends without signalling a resize end. lostpointercapture also fires on the
  // implicit release after every pointerup/pointercancel, by which point the
  // drag is already cleared and this is a no-op.
  const cancelDrag = useCallback(e => {
    if (dragRef.current?.pointerId !== e.pointerId) {
      return;
    }
    clearDrag();
    // Not a resize end, but still the end of the gesture: the region froze
    // state for the duration of the drag and has to be told it is over.
    resizable?._onResizeCancel?.();
  }, [clearDrag, resizable]);

  // --- Keyboard ---
  const handleKeyDown = useCallback(e => {
    if (isDisabled || !resizable) {
      return;
    }
    const step = e.shiftKey ? KEYBOARD_LARGE_STEP : KEYBOARD_STEP;
    const rtl = isHorizontal ? getRTLMultiplier() : 1;
    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        {
          e.preventDefault();
          resizable._onResizeStart();
          resizable._onResizeMove(step * (isHorizontal ? rtl : 1) * sign);
          resizable._onResizeEnd();
          break;
        }
      case 'ArrowLeft':
      case 'ArrowUp':
        {
          e.preventDefault();
          resizable._onResizeStart();
          resizable._onResizeMove(-step * (isHorizontal ? rtl : 1) * sign);
          resizable._onResizeEnd();
          break;
        }
      case 'Home':
        {
          e.preventDefault();
          resizable._onResizeStart();
          resizable._onResizeMove(resizable._minSizePx - resizable._size);
          resizable._onResizeEnd();
          break;
        }
      case 'End':
        {
          e.preventDefault();
          if (resizable._maxSizePx !== Infinity) {
            resizable._onResizeStart();
            resizable._onResizeMove(resizable._maxSizePx - resizable._size);
            resizable._onResizeEnd();
          }
          break;
        }
      case 'Enter':
        {
          e.preventDefault();
          if (resizable._collapsible) {
            resizable._onResizeStart();
            resizable._onResizeMove(resizable._isCollapsed ? resizable._minSizePx : -resizable._size);
            resizable._onResizeEnd();
          }
          break;
        }
    }
  }, [isDisabled, resizable, isHorizontal, getRTLMultiplier, sign]);

  // --- Double-click collapse ---
  const handleDoubleClick = useCallback(() => {
    if (isDisabled || !resizable || !resizable._collapsible) {
      return;
    }
    resizable._onResizeStart();
    resizable._onResizeMove(resizable._isCollapsed ? resizable._minSizePx : -resizable._size);
    resizable._onResizeEnd();
  }, [isDisabled, resizable]);

  // --- Cleanup on unmount ---
  // Removing the grab zone implicitly releases its captured pointer and takes
  // its listeners with it, so an in-flight drag stops driving the region on
  // its own. The body cursor/user-select overrides are not on the element,
  // though, so they have to be released here or they stick after the handle
  // is gone — and the region, which outlives this handle, still has to hear
  // that its gesture is over.
  const cancelOnUnmountRef = useRef(undefined);
  cancelOnUnmountRef.current = resizable?._onResizeCancel;
  useEffect(() => {
    return () => {
      if (dragRef.current) {
        dragRef.current = null;
        clearBodyDragStyles();
        cancelOnUnmountRef.current?.();
      }
    };
  }, []);

  // --- ARIA ---
  // When collapsed the panel's real size (0) sits below aria-valuemin, which
  // is invalid per WCAG 4.1.2. Clamp aria-valuenow to the minimum and announce
  // the true state via aria-valuetext instead; the valuetext is removed as
  // soon as the panel expands so the numeric value reads again.
  const isCollapsed = resizable?._isCollapsed ?? false;
  const ariaValueNow = resizable ? isCollapsed ? Math.max(resizable._size, resizable._minSizePx) : resizable._size : undefined;
  const ariaValueMin = resizable ? resizable._minSizePx : undefined;
  const ariaValueMax = resizable && resizable._maxSizePx !== Infinity ? resizable._maxSizePx : undefined;
  const ariaValueText = resizable && isCollapsed ? t('@astryx.resizable.collapsed') : undefined;
  return /*#__PURE__*/_jsxs("div", {
    ref: useMergedRefs(ref, handleRef),
    role: "separator",
    "aria-orientation": isHorizontal ? 'vertical' : 'horizontal',
    "aria-valuenow": ariaValueNow,
    "aria-valuemin": ariaValueMin,
    "aria-valuemax": ariaValueMax,
    "aria-valuetext": ariaValueText,
    "aria-label": label,
    "aria-disabled": isDisabled || undefined,
    tabIndex: isDisabled ? -1 : 0,
    onDoubleClick: handleDoubleClick,
    onFocus: () => setIsFocused(true),
    onBlur: () => setIsFocused(false),
    "data-resizing": isDragging || undefined,
    ...mergeProps(themeProps('resize-handle'), focusOutlineProps.focusVisible(styles.handle, isOverlay && styles.overlay, isOverlay && (isHorizontal ? styles.overlayHorizontal : styles.overlayVertical), !isOverlay && (isHorizontal ? styles.horizontal : styles.vertical), !isOverlay && !hasDivider && (isHorizontal ? styles.noDividerHorizontal : styles.noDividerVertical), !isOverlay && hasDivider && isInteracting && !isDragging && styles.handleHover, !isOverlay && hasDivider && isDragging && styles.handleActive, isDisabled && styles.disabled, xstyle), className),
    ...props,
    // Keyboard resizing must fire from the focusable separator, not a child:
    // keydown fires on the focused element and bubbles up, so a handler on a
    // descendant never runs (per the WAI-ARIA window-splitter pattern).
    // Placed after {...props} and composed with any consumer onKeyDown so
    // this accessibility-critical handler can't be clobbered by a passed prop.
    onKeyDown: e => {
      props.onKeyDown?.(e);
      handleKeyDown(e);
    },
    children: [/*#__PURE__*/_jsx("div", {
      ...stylex.props(styles.hitArea, isHorizontal ? styles.hitAreaHorizontal : styles.hitAreaVertical,
      // Bias the grab zone to sit over the visible pill. When the pill is
      // centered (no bias) just center the hit area on the divider; when
      // it's offset to a panel side, reuse the pill's physical-offset
      // construction so the two stay aligned in LTR and RTL alike.
      hitBiasDir == null ? isHorizontal ? rtlStyles.centerInline('0px') : styles.hitAreaCenteredY : isHorizontal ? dynamicStyles.hitAreaOffsetX(hitBiasDir) : dynamicStyles.hitAreaOffsetY(hitBiasDir), isDisabled && styles.disabled),
      onPointerDown: handlePointerDown,
      onPointerMove: handlePointerMove,
      onPointerUp: handlePointerUp,
      onPointerCancel: cancelDrag,
      onLostPointerCapture: cancelDrag,
      onPointerEnter: () => setIsHovered(true),
      onPointerLeave: () => {
        if (!isDragging) {
          setIsHovered(false);
        }
      }
    }), children ?? /*#__PURE__*/_jsx("div", {
      ...mergeProps(themeProps('resize-handle-pill'), stylex.props(styles.pill, isHorizontal ? styles.pillHorizontal : styles.pillVertical, effectiveSide === 'center' ? rtlStyles.centerInline('-50%') : isHorizontal ? dynamicStyles.pillOffsetX(effectiveSide === 'start' ? -1 : 1) : dynamicStyles.pillOffsetY(effectiveSide === 'start' ? -1 : 1), isAlwaysVisible ? styles.pillVisible : styles.pillHidden, isInteracting && !isDragging && styles.pillHover, isDragging && styles.pillActive))
    })]
  });
}
ResizeHandle.displayName = 'ResizeHandle';
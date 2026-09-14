// Copyright (c) Meta Platforms, Inc. and affiliates.

'use client';

/**
 * @file SelectorBottomSheet.tsx
 * @input Uses BottomSheet, Section, and Heading
 * @output Shared mobile listbox sheet for Selector and MultiSelector
 * @position Internal presentation primitive for selection controls
 */
import { lazy, Suspense, useEffect } from 'react';
import * as stylex from '@stylexjs/stylex';
import { Heading } from "../Heading/index.js";
import { Section } from "../Section/index.js";
import "../theme/tokens.stylex.js";
import { spacingVars } from "../theme/tokens.stylex.js";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
const LazyBottomSheet = /*#__PURE__*/lazy(async () => import("../BottomSheet/BottomSheet.js").then(module => ({
  default: module.BottomSheet
})));
const styles = {
  heading: {
    k1K539: "x1p37lm5",
    kUOVxO: "xam6yil",
    $$css: true
  }
};
function SelectorBottomSheetInitialFocus({
  isOpen,
  targetRef
}) {
  useEffect(() => {
    if (!isOpen) {
      return;
    }
    const frame = requestAnimationFrame(() => {
      targetRef.current?.focus({
        preventScroll: true
      });
    });
    return () => cancelAnimationFrame(frame);
  }, [isOpen, targetRef]);
  return null;
}
export function SelectorBottomSheet({
  children,
  finalFocusRef,
  initialFocusRef,
  isOpen,
  label,
  onOpenChange
}) {
  return /*#__PURE__*/_jsx(Suspense, {
    fallback: null,
    children: /*#__PURE__*/_jsx(LazyBottomSheet, {
      isOpen: isOpen,
      onOpenChange: onOpenChange,
      finalFocusRef: finalFocusRef,
      label: label,
      height: "hug",
      purpose: "info",
      children: /*#__PURE__*/_jsx(Section, {
        paddingBlockStart: 4,
        paddingBlockEnd: 0,
        paddingInline: 1,
        children: /*#__PURE__*/_jsxs("div", {
          ...{
            className: "xh8yej3"
          },
          children: [/*#__PURE__*/_jsx(Heading, {
            level: 3,
            xstyle: styles.heading,
            children: label
          }), children, /*#__PURE__*/_jsx(SelectorBottomSheetInitialFocus, {
            isOpen: isOpen,
            targetRef: initialFocusRef
          })]
        })
      })
    })
  });
}
SelectorBottomSheet.displayName = 'SelectorBottomSheet';
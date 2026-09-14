// Copyright (c) Meta Platforms, Inc. and affiliates.

'use client';

/**
 * @file MenuBottomSheet.tsx
 * @input Uses BottomSheet and Section
 * @output Internal action-sheet host for menu content
 * @position Shared by DropdownMenu and ContextMenu adaptive presentations
 */
import { BottomSheet } from "../BottomSheet/BottomSheet.js";
import { Section } from "../Section/Section.js";
import { jsx as _jsx } from "react/jsx-runtime";
export function MenuBottomSheet({
  finalFocusRef,
  isOpen,
  onOpenChange,
  label,
  children
}) {
  return /*#__PURE__*/_jsx(BottomSheet, {
    finalFocusRef: finalFocusRef,
    isOpen: isOpen,
    onOpenChange: onOpenChange,
    label: label,
    height: "hug",
    purpose: "info",
    children: /*#__PURE__*/_jsx(Section, {
      paddingBlockStart: 4,
      paddingBlockEnd: 0,
      paddingInline: 1,
      children: children
    })
  });
}
MenuBottomSheet.displayName = 'MenuBottomSheet';
// Copyright (c) Meta Platforms, Inc. and affiliates.

'use client';

/**
 * @file NativeTimeSegment.tsx
 * @input Uses React, native picker segment styles, and shared time utilities
 * @output Exports NativeTimeSegment — the shared OS-picker time control
 * @position Internal native control used by DateTimeInput and TimeInput
 *
 * Hands time picking to the platform through `<input type="time">`. The input
 * is deliberately uncontrolled and observed through native event listeners,
 * matching NativeDateSegment's iOS-safe value ownership: external values only
 * reconcile while the picker is unfocused, and native edits do not depend on
 * React's synthetic change event.
 *
 * SYNC: When modified, update these files to stay in sync:
 * - /packages/core/src/DateTimeInput/DateTimeInput.tsx (DateTimeInput integration)
 * - /packages/core/src/TimeInput/TimeInput.tsx (TimeInput integration)
 * - /packages/core/src/DateTimeInput/NativePickerSegments.test.tsx (DateTimeInput tests)
 * - /packages/core/src/TimeInput/NativeTimeInput.test.tsx (TimeInput tests)
 * - /packages/core/src/DateTimeInput/DateTimeInput.doc.mjs (DateTimeInput prop docs)
 * - /packages/core/src/TimeInput/TimeInput.doc.mjs (TimeInput prop docs)
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import * as stylex from '@stylexjs/stylex';
import { hasEditableDateSegments } from "../DateInput/nativeDateSegments.js";
import { useMediaQuery } from "../hooks/useMediaQuery.js";
import { useMergedRefs } from "../hooks/useMergedRefs.js";
import { Icon } from "../Icon/index.js";
import { useTranslator } from "../i18n/index.js";
import { VisuallyHidden } from "../VisuallyHidden/index.js";
import { focusOutlineStyles, formatDisplayTime12h, formatDisplayTime24h, formatISOTime, isTimeInRange, parseISOTime } from "../utils/index.js";
import { nativePickerSegmentStyles as styles } from "./nativePickerSegmentStyles.js";
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
const FRACTIONAL_SECONDS = /\.\d+$/;
function normalizeNativeTime(value) {
  if (!value) {
    return undefined;
  }
  const withoutFraction = value.replace(FRACTIONAL_SECONDS, '');
  const parsed = parseISOTime(withoutFraction);
  return parsed ? formatISOTime(parsed, false) : undefined;
}
/** The shared native time control rendered inside Astryx field chrome. */
export function NativeTimeSegment({
  id,
  inputRef,
  value,
  onChange,
  placeholder,
  inputLabel,
  openPickerLabel,
  ariaLabelledBy,
  iconThemeProps,
  hasAutoFocus = false,
  min,
  max,
  hourFormat,
  isEffectivelyDisabled,
  hasDisabledMessage,
  isEffectivelyRequired,
  isBusy,
  statusType,
  ariaDescribedBy
}) {
  const t = useTranslator();
  const isTouchPointer = useMediaQuery('(pointer: coarse)');
  const internalInputRef = useRef(null);
  const mergedInputRef = useMergedRefs(inputRef, internalInputRef);
  const [rejectedValue, setRejectedValue] = useState(null);
  const [isFocused, setIsFocused] = useState(false);
  const [isSegmentEditable, setIsSegmentEditable] = useState(false);
  const valueAtFocusRef = useRef(null);
  const lastCommitRef = useRef(null);
  const prevValueRef = useRef(value);
  if (value !== prevValueRef.current) {
    prevValueRef.current = value;
    // Preserve the accepted DOM value while the OS wheel is open so an
    // optimistic rollback cannot replay that edit when the field blurs.
    if (!isFocused) {
      lastCommitRef.current = null;
    }
    if (rejectedValue !== null) {
      setRejectedValue(null);
    }
  }
  const nativeValue = normalizeNativeTime(value) ?? '';
  const isInputValid = rejectedValue === null;
  const formatDisplayTime = hourFormat === '12h' ? formatDisplayTime12h : formatDisplayTime24h;
  const overlayText = nativeValue ? formatDisplayTime(nativeValue, false) : placeholder;
  const showsOverlay = !!overlayText && !(isFocused && isSegmentEditable);
  const commitValue = useCallback(newValue => {
    if (isEffectivelyDisabled || lastCommitRef.current === newValue) {
      return;
    }
    if (!newValue) {
      lastCommitRef.current = newValue;
      setRejectedValue(null);
      if (value !== undefined) {
        onChange(undefined);
      }
      return;
    }
    const normalized = normalizeNativeTime(newValue);
    if (!normalized) {
      return;
    }
    if (!isTimeInRange(normalized, min, max)) {
      setRejectedValue(newValue);
      return;
    }
    setRejectedValue(null);
    lastCommitRef.current = newValue;
    if (normalized !== value) {
      onChange(normalized);
    }
  }, [isEffectivelyDisabled, max, min, onChange, value]);
  const handleChange = useCallback(event => {
    commitValue(event.target.value);
  }, [commitValue]);

  // React's synthetic change system does not reliably observe iOS picker edits.
  const commitRef = useRef(commitValue);
  useEffect(() => {
    commitRef.current = commitValue;
  });
  useEffect(() => {
    const input = internalInputRef.current;
    if (!input) {
      return;
    }
    const handleNative = () => commitRef.current(input.value);
    input.addEventListener('input', handleNative);
    input.addEventListener('change', handleNative);
    return () => {
      input.removeEventListener('input', handleNative);
      input.removeEventListener('change', handleNative);
    };
  }, []);

  // React touches defaultValue after mount when the prop changes. Capture it
  // once, then reconcile through the unfocused-only effect below.
  const initialValueRef = useRef(null);
  if (initialValueRef.current === null) {
    initialValueRef.current = nativeValue;
  }
  useEffect(() => {
    if (isFocused) {
      return;
    }
    const input = internalInputRef.current;
    if (input && input.value !== nativeValue) {
      input.value = nativeValue;
    }
  }, [isFocused, nativeValue]);
  const handleFocus = useCallback(() => {
    valueAtFocusRef.current = nativeValue;
    // The engine probe classifies whether WebKit/Blink exposes editable native
    // segments. Date and time controls share that engine-level behavior.
    setIsSegmentEditable(hasEditableDateSegments(isTouchPointer));
    setIsFocused(true);
  }, [isTouchPointer, nativeValue]);
  const handleBlur = useCallback(() => {
    const domValue = internalInputRef.current?.value;
    const valueChangedWhileFocused = valueAtFocusRef.current !== null && valueAtFocusRef.current !== nativeValue;
    const wasRejected = rejectedValue !== null;
    valueAtFocusRef.current = null;
    setIsFocused(false);
    setRejectedValue(null);
    if (!valueChangedWhileFocused && !wasRejected && domValue !== undefined && domValue !== nativeValue) {
      commitValue(domValue);
    }
    lastCommitRef.current = null;
  }, [commitValue, nativeValue, rejectedValue]);
  const openPicker = useCallback(() => {
    if (isEffectivelyDisabled) {
      return;
    }
    const input = internalInputRef.current;
    if (!input) {
      return;
    }
    input.focus();
    if (typeof input.showPicker === 'function') {
      try {
        input.showPicker();
      } catch {
        // Focus raises the iOS picker and is the fallback when showPicker needs
        // user activation or is unavailable.
      }
    }
  }, [isEffectivelyDisabled]);
  return /*#__PURE__*/_jsxs(_Fragment, {
    children: [/*#__PURE__*/_jsx("button", {
      type: "button",
      onClick: openPicker,
      disabled: isEffectivelyDisabled,
      "aria-label": openPickerLabel,
      tabIndex: -1,
      ...stylex.props(focusOutlineStyles.focusVisible, styles.iconButton, isEffectivelyDisabled && styles.iconButtonDisabled),
      children: /*#__PURE__*/_jsx(Icon, {
        icon: "clock",
        size: "sm",
        color: "secondary",
        ...iconThemeProps
      })
    }), /*#__PURE__*/_jsxs("span", {
      ...stylex.props(styles.slot),
      children: [/*#__PURE__*/_jsx("input", {
        ref: mergedInputRef,
        id: id,
        type: "time"
        // UNCONTROLLED on purpose; see initialValueRef and the sync effect.
        ,
        defaultValue: initialValueRef.current ?? '',
        onChange: handleChange,
        onFocus: handleFocus,
        onBlur: handleBlur,
        min: min,
        max: max,
        step: 60,
        disabled: isEffectivelyDisabled && !hasDisabledMessage,
        "aria-disabled": hasDisabledMessage ? 'true' : undefined,
        readOnly: hasDisabledMessage || undefined,
        "aria-label": ariaLabelledBy ? undefined : inputLabel,
        "aria-labelledby": ariaLabelledBy,
        "aria-describedby": ariaDescribedBy,
        autoFocus: hasAutoFocus,
        "data-autofocus": hasAutoFocus || undefined,
        "aria-required": isEffectivelyRequired ? 'true' : undefined,
        "aria-invalid": statusType === 'error' || !isInputValid ? 'true' : undefined,
        "aria-busy": isBusy || undefined,
        ...stylex.props(styles.input, showsOverlay && styles.inputTextHidden, isEffectivelyDisabled && styles.inputDisabled, !isInputValid && styles.inputInvalid)
      }), showsOverlay && /*#__PURE__*/_jsx("span", {
        "aria-hidden": "true",
        ...stylex.props(styles.overlay, nativeValue ? styles.overlayValue : styles.overlayPlaceholder, isEffectivelyDisabled && styles.inputDisabled, !isInputValid && !!nativeValue && styles.inputInvalid),
        children: overlayText
      })]
    }), /*#__PURE__*/_jsx(VisuallyHidden, {
      as: "div",
      role: "alert",
      "aria-live": "assertive",
      children: !isInputValid ? t('@astryx.timeInput.invalidTime') : ''
    })]
  });
}
NativeTimeSegment.displayName = 'NativeTimeSegment';
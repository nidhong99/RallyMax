// Copyright (c) Meta Platforms, Inc. and affiliates.

'use client';

/**
 * @file Timestamp.tsx
 * @input Uses React, Text, provider locale, and Timestamp formatters
 * @output Exports Timestamp component and related types
 * @position Core implementation; renders formatted timestamps
 *
 * SYNC: When modified, update these files to stay in sync:
 * - /packages/core/src/Timestamp/formatRelativeTime.ts
 * - /packages/core/src/Timestamp/Timestamp.doc.mjs
 * - /packages/core/src/Timestamp/Timestamp.test.tsx
 * - /packages/core/src/Timestamp/index.ts
 * - /apps/storybook/stories/Timestamp.stories.tsx
 * - /packages/cli/assets/templates/blocks/components/Timestamp/ (showcase blocks)
 */
import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import * as stylex from '@stylexjs/stylex';
import { Text } from "../Text/index.js";
import { mergeProps } from "../utils/index.js";
import { useDevWarning } from "../hooks/useDevWarning.js";
import { useTranslator } from "../i18n/index.js";
import { useLocale } from "../i18n/useLocale.js";
import { themeProps } from "../utils/themeProps.js";
import { formatInstant } from "./formatInstant.js";
import { formatRelativeTime } from "./formatRelativeTime.js";
import { formatTooltipLines } from "./tooltipEntries.js";
import { useMergedRefs } from "../hooks/useMergedRefs.js";
// Load the overlay lazily so a card-less Timestamp — the default — never
// bundles HoverCard or the copy affordance's Icon/IconButton. Mirrors the code
// split the read-only Tooltip path used before it.
import { jsx as _jsx } from "react/jsx-runtime";
const LazyTimestampHoverCard = /*#__PURE__*/lazy(async () => import("./TimestampHoverCard.js"));

// =============================================================================
// Types
// =============================================================================

// =============================================================================
// Styles
// =============================================================================

// =============================================================================
// Formatting utilities
// =============================================================================

const MINUTE = 60;
const HOUR = 3600;
const DAY = 86400;

/** Default auto threshold: 7 days in seconds */
const DEFAULT_AUTO_THRESHOLD = 7 * DAY;
function parseValue(value) {
  if (typeof value === 'number') {
    // Heuristic: if the number is less than 1e12, treat as seconds; otherwise ms.
    // Unix timestamps in seconds are < 1e12 until ~2286.
    return new Date(value < 1e12 ? value * 1000 : value);
  }
  return new Date(value);
}

/** Returns the interval (in ms) at which a relative timestamp should update. */
function getLiveInterval(diffSeconds) {
  const absDiff = Math.abs(diffSeconds);
  if (absDiff < MINUTE) {
    return 1000;
  } // every second
  if (absDiff < HOUR) {
    return 30_000;
  } // every 30s
  if (absDiff < DAY) {
    return 60_000;
  } // every minute
  return 300_000; // every 5 minutes
}

/** Whether a format is non-relative (i.e. shows a fixed date/time). */
function isAbsoluteFormat(format) {
  return format !== 'relative' && format !== 'relative_short' && format !== 'auto';
}

/**
 * Whether a format renders a relative phrase ("2 hours ago" / "2h ago") rather
 * than a fixed instant. Both the long and short relative forms share the same
 * treatment: they get the accessible full-date name, the hover tooltip, and
 * live updates.
 */
function isRelativeFormat(format) {
  return format === 'relative' || format === 'relative_short';
}

// =============================================================================
// Component
// =============================================================================

/**
 * Displays a formatted timestamp as human-readable text.
 *
 * Renders a semantic `<time>` element with an ISO 8601 `datetime` attribute,
 * styled via Text. Supports relative ("2 hours ago"), multiple absolute
 * formats, and auto formatting. Optionally shows a hover card with the full
 * absolute time (copyable) and can update live.
 *
 * @example
 * ```
 * <Timestamp value="2026-02-19T17:00:00Z" />
 * <Timestamp value={1740000000} format="date" />
 * <Timestamp value={date} format="auto" isLive />
 * <Timestamp value={event.timestamp} format="system_date_time" />
 * ```
 */
export function Timestamp({
  value,
  format = 'auto',
  autoThreshold = DEFAULT_AUTO_THRESHOLD,
  hasTooltip = true,
  tooltipEntries,
  isTimezoneShown = false,
  isLive = false,
  type = 'supporting',
  size,
  color = 'secondary',
  weight,
  xstyle,
  className,
  style,
  ref,
  'data-testid': testId,
  ...rest
}) {
  const t = useTranslator();
  const locale = useLocale();
  const timeRef = useRef(null);
  const mergedTimeRef = useMergedRefs(ref, timeRef);
  const [now, setNow] = useState(() => new Date());
  const date = parseValue(value);
  // An unparseable value (a malformed date string, or a NaN timestamp from
  // missing data) yields an Invalid Date, and formatting one throws "Invalid
  // time value" — crashing the whole tree. Compute nothing from it here and
  // bail out below (after the hooks) instead.
  const isValidDate = !Number.isNaN(date.getTime());
  const isoString = isValidDate ? date.toISOString() : '';

  // Determine effective format
  const diffSeconds = Math.round((now.getTime() - date.getTime()) / 1000);
  const effectiveFormat = format === 'auto' ? Math.abs(diffSeconds) <= autoThreshold ? 'relative' : 'date_time' : format;

  // Format the display text. No time zone is passed: the visible text always
  // reads in the viewer's own zone, and only the tooltip names others.
  const displayText = !isValidDate ? '' : effectiveFormat === 'relative' ? formatRelativeTime(date, now, locale, 'long') : effectiveFormat === 'relative_short' ? formatRelativeTime(date, now, locale, 'narrow') : isAbsoluteFormat(effectiveFormat) ? formatInstant(date, effectiveFormat, locale, {
    isTimezoneShown
  }) : '';

  // Full absolute text for the tooltip (visible — keeps the compact timezone
  // abbreviation) and for the AT-facing aria-label, which spells the timezone
  // out in full: abbreviations like "PST" or "GMT+2" are unexpanded
  // abbreviations to a screen-reader user (WCAG 3.1.4).
  const fullAbsoluteText = isValidDate ? formatInstant(date, 'full', locale) : '';
  const ariaLabelText = isValidDate ? formatInstant(date, 'full', locale, {
    timeZoneNameStyle: 'long'
  }) : '';

  // Live updates
  useEffect(() => {
    if (!isLive || !isValidDate || !isRelativeFormat(effectiveFormat)) {
      return;
    }
    const interval = getLiveInterval(diffSeconds);
    const timer = setInterval(() => {
      setNow(new Date());
    }, interval);
    return () => clearInterval(timer);
  }, [isLive, isValidDate, effectiveFormat, diffSeconds]);
  useDevWarning('Timestamp', `could not parse value ${JSON.stringify(value)} as a date. Rendering nothing.`, !isValidDate);

  // Placed after all hooks so the hook order stays stable across renders.
  if (!isValidDate) {
    return null;
  }

  // An empty array is not a second way to spell "off" — `hasTooltip` stays the
  // only on/off axis — so normalize it away before anything reads it.
  const entries = tooltipEntries !== undefined && tooltipEntries.length > 0 ? tooltipEntries : undefined;

  // Absolute formats have never carried a hover surface. Leaving that gate
  // closed when a consumer has explicitly configured tooltip lines would let
  // `format` silently suppress another prop's output, so entry presence opens
  // it too. With no entries this reduces to the original condition exactly.
  const showTooltip = hasTooltip && (isRelativeFormat(effectiveFormat) || entries !== undefined);

  // The rows the hover card renders: the configured entries, or the single
  // default absolute line shown when none are set. Either way the surface is
  // the same copyable card — the default line is a one-row card carrying the
  // full absolute time, itself copyable, just like a configured entry.
  const lines = entries === undefined ? [{
    value: fullAbsoluteText,
    isCopyable: true
  }] : formatTooltipLines(date, entries, locale);
  const timestampProps = mergeProps(themeProps('timestamp', {
    format: effectiveFormat
  }), {
    className,
    style
  });
  const timeElement = /*#__PURE__*/_jsx(Text, {
    type: type,
    size: size,
    color: color,
    weight: weight,
    xstyle: xstyle,
    ...timestampProps,
    children: /*#__PURE__*/_jsx("time", {
      ref: mergedTimeRef,
      dateTime: isoString,
      "data-testid": testId,
      ...{
        className: "xt0psk2 xjb2p0i x1j61x8r x1qlqyl8 x15bjb6t x1heor9g x1pd3egz"
      },
      ...rest,
      ...(isRelativeFormat(effectiveFormat) && ariaLabelText !== '' ? {
        'aria-label': ariaLabelText
      } : {}),
      ...(showTooltip ? {
        tabIndex: 0
      } : {}),
      children: displayText
    })
  });
  if (showTooltip) {
    // One surface for every timestamp that shows one: the copyable hover card,
    // loaded lazily so the default card-less path never bundles it. Each line
    // becomes a labelled row with its own copy button. With no configured
    // entries this is a single row carrying the full absolute time, itself
    // copyable — so hovering a relative timestamp reveals the full time and
    // lets the reader copy it. Opens on hover and on keyboard focus (the
    // <time> tab stop above), with the dashed-underline affordance signalling
    // it is interactive.
    //
    // While the chunk loads the bare <time> stays visible (the Suspense
    // fallback), so nothing disappears — the card simply attaches once ready.
    return /*#__PURE__*/_jsx(Suspense, {
      fallback: timeElement,
      children: /*#__PURE__*/_jsx(LazyTimestampHoverCard, {
        lines: lines,
        label: t('@astryx.timestamp.detailsLabel'),
        children: timeElement
      })
    });
  }
  return timeElement;
}
Timestamp.displayName = 'Timestamp';
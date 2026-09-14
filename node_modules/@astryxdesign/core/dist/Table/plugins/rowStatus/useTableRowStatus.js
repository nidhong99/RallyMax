// Copyright (c) Meta Platforms, Inc. and affiliates.

'use client';

/**
 * @file useTableRowStatus.tsx
 * @input React, StyleX, Icon, i18n, dev warnings, VisuallyHidden, Table types
 * @output Exports useTableRowStatus hook + config type
 * @position Row-status plugin; consumed by Table via plugins prop
 *
 * SYNC: When modified, update these files to stay in sync:
 * - /packages/core/src/Table/index.ts (exports)
 * - /packages/core/src/Table/useTableRowStatus.doc.mjs
 * - /packages/core/src/Table/plugins/rowStatus/useTableRowStatus.test.tsx
 * - /apps/storybook/stories/TableRowStatus.stories.tsx
 * - /packages/cli/assets/templates/blocks/components/Table/TableRowStatusTable.tsx
 */
import { useMemo } from 'react';
import * as stylex from '@stylexjs/stylex';
import { Icon } from "../../../Icon/index.js";
import { Tooltip } from "../../../Tooltip/index.js";
import { useTranslator } from "../../../i18n/index.js";
import { warnOnce } from "../../../utils/devWarning.js";
import { VisuallyHidden } from "../../../VisuallyHidden/index.js";

/**
 * Named colors supported by the custom row-status marker. These resolve to the
 * design system's icon color tokens; raw CSS colors remain an escape hatch.
 */
import { jsx as _jsx } from "react/jsx-runtime";
const NAMED_COLORS = {
  accent: 'var(--color-icon-accent)',
  success: 'var(--color-icon-green)',
  error: 'var(--color-icon-red)',
  warning: 'var(--color-icon-orange)',
  red: 'var(--color-icon-red)',
  orange: 'var(--color-icon-orange)',
  green: 'var(--color-icon-green)',
  yellow: 'var(--color-icon-yellow)',
  blue: 'var(--color-icon-blue)',
  gray: 'var(--color-icon-gray)'
};

/** Preserve the released Icon color mapping for named custom-marker colors. */
const ICON_COLOR_BY_NAMED_COLOR = {
  accent: 'accent',
  success: 'success',
  error: 'error',
  warning: 'warning',
  red: 'red',
  orange: 'warning',
  green: 'green',
  yellow: 'warning',
  blue: 'blue',
  gray: 'gray'
};

/** Configuration for {@link useTableRowStatus}. */

// The status column holds a small centered dot or icon. A fixed narrow width
// keeps every row's indicator aligned in one gutter.
const STATUS_COLUMN_WIDTH = {
  type: 'pixel',
  value: 28
};

/** Resolve a named color to a token, or pass a raw CSS color through. */
function resolveColor(color) {
  return NAMED_COLORS[color] ?? color;
}
function isTableRowSemanticStatus(value) {
  return value === 'success' || value === 'warning' || value === 'error';
}
function resolveTableRowStatus(value) {
  const untypedValue = value;
  if (isTableRowSemanticStatus(untypedValue.status)) {
    if (process.env.NODE_ENV !== 'production' && (Object.prototype.hasOwnProperty.call(untypedValue, 'color') || Object.prototype.hasOwnProperty.call(untypedValue, 'icon'))) {
      warnOnce('useTableRowStatus:semantic-custom-conflict', 'useTableRowStatus', 'status cannot be combined with color or icon. The semantic status takes precedence and the custom marker fields are ignored.');
    }
    return {
      variant: 'icon',
      icon: untypedValue.status,
      iconColor: untypedValue.status
    };
  }
  if (typeof untypedValue.color !== 'string') {
    return null;
  }
  if (typeof untypedValue.icon === 'string') {
    const namedIconColor = ICON_COLOR_BY_NAMED_COLOR[untypedValue.color];
    return namedIconColor == null ? {
      variant: 'icon',
      icon: untypedValue.icon,
      customColor: untypedValue.color
    } : {
      variant: 'icon',
      icon: untypedValue.icon,
      iconColor: namedIconColor
    };
  }
  return {
    variant: 'dot',
    color: resolveColor(untypedValue.color)
  };
}
const _temp = {
  kzqmXN: "x1xc55vz",
  kZKoxP: "xdk7pt",
  kaIpWk: "x16rqkct",
  kmuXW: "x2lah0s",
  "$$css": true
};
const styles = {
  wrap: {
    k1xSpc: "x78zum5",
    kGNEyG: "x6s0dn4",
    kjj79g: "xl56j7k",
    $$css: true
  },
  customIcon: color => [{
    kMwMTN: color != null ? "x14rh7hd" : color,
    $$css: true
  }, {
    "--x-color": color != null ? color : undefined
  }],
  dot: color => [_temp, {
    kWkggS: color != null ? "xl8spv7" : color,
    $$css: true
  }, {
    "--x-backgroundColor": color != null ? color : undefined
  }]
};

/**
 * Returns a {@link TablePlugin} that prepends a narrow column signaling per-row
 * status. A semantic `status` resolves a themed glyph and tone; a custom
 * `color` renders the stable dot unless the caller also provides an `icon`.
 *
 * @example
 * ```
 * const rowStatus = useTableRowStatus<Row>({
 *   getStatus: row =>
 *     row.state === 'error'
 *       ? {status: 'error', label: 'Error'}
 *       : {color: 'blue', icon: 'info', label: 'Informational'},
 * });
 * <Table data={data} columns={columns} idKey="id" plugins={{rowStatus}} />;
 * ```
 */
export function useTableRowStatus(config) {
  const t = useTranslator();
  const {
    getStatus
  } = config;
  return useMemo(() => {
    const statusColumn = {
      key: '__rowStatus',
      // The gutter stays visually blank, but the th needs a discernible
      // name for assistive technology (axe: empty-table-header).
      header: /*#__PURE__*/_jsx(VisuallyHidden, {
        children: t('@astryx.table.rowStatus.columnHeader')
      }),
      width: STATUS_COLUMN_WIDTH,
      resizable: false,
      renderCell: item => {
        const status = getStatus(item);
        if (!status) {
          return null;
        }
        const resolvedStatus = resolveTableRowStatus(status);
        if (!resolvedStatus) {
          return null;
        }
        const signifier = resolvedStatus.variant === 'dot' ? /*#__PURE__*/_jsx("span", {
          ...stylex.props(styles.dot(resolvedStatus.color))
        }) : /*#__PURE__*/_jsx(Icon, {
          icon: resolvedStatus.icon,
          size: "xsm",
          color: 'iconColor' in resolvedStatus ? resolvedStatus.iconColor : 'inherit'
        });
        return /*#__PURE__*/_jsx(Tooltip, {
          content: status.label,
          children: /*#__PURE__*/_jsx("span", {
            ...stylex.props(styles.wrap, resolvedStatus.variant === 'icon' && 'customColor' in resolvedStatus && styles.customIcon(resolvedStatus.customColor)),
            role: "img",
            "aria-label": status.label,
            children: signifier
          })
        });
      }
    };
    return {
      transformColumns(columns) {
        return [statusColumn, ...columns];
      }
    };
  }, [getStatus, t]);
}
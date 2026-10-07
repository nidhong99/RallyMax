import React, { useMemo } from 'react';
import { Selector } from '@astryxdesign/core/Selector';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps {
  id?: string;
  name?: string;
  value?: string | number;
  defaultValue?: string | number;
  onChange?: (e: any, value?: string) => void;
  options?: SelectOption[];
  children?: React.ReactNode;
  label?: string;
  isLabelHidden?: boolean;
  placeholder?: string;
  disabled?: boolean;
  isDisabled?: boolean;
  style?: React.CSSProperties;
  containerStyle?: React.CSSProperties;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  hasSearch?: boolean;
  placement?: 'above' | 'below' | 'start' | 'end';
  presentation?: 'popover' | 'bottom-sheet' | 'adaptive';
  width?: string | number;
  [key: string]: any;
}

function getChildText(node: React.ReactNode): string {
  if (node === null || node === undefined || typeof node === 'boolean') return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(getChildText).join('');
  if (React.isValidElement(node)) return getChildText((node.props as any).children);
  return '';
}

export const Select = React.forwardRef<any, SelectProps>((props, ref) => {
  const {
    id,
    name,
    value,
    defaultValue,
    onChange,
    options,
    children,
    label,
    isLabelHidden = true,
    placeholder,
    disabled,
    isDisabled,
    style,
    containerStyle,
    className,
    size = 'md',
    hasSearch,
    placement = 'below',
    presentation = 'popover',
    width,
    ...rest
  } = props;

  const resolvedOptions = useMemo(() => {
    if (options && options.length > 0) {
      return options;
    }
    const extracted: SelectOption[] = [];
    React.Children.toArray(children).forEach((child) => {
      if (React.isValidElement(child)) {
        const p = child.props as any;
        const val = p.value !== undefined ? String(p.value) : '';
        const optLabel = getChildText(p.children).trim() || val;
        extracted.push({
          value: val,
          label: optLabel,
          disabled: Boolean(p.disabled),
        });
      }
    });
    return extracted;
  }, [options, children]);

  // Determine current value
  let resolvedValue: string | undefined = undefined;
  if (value !== undefined && value !== null) {
    resolvedValue = String(value);
  } else if (defaultValue !== undefined && defaultValue !== null) {
    resolvedValue = String(defaultValue);
  } else if (!placeholder && resolvedOptions.length > 0) {
    resolvedValue = resolvedOptions[0]?.value;
  }

  const handleChange = (newVal: string) => {
    if (!onChange) return;
    const syntheticEvent = {
      target: { value: newVal, name: name || id || '' },
      currentTarget: { value: newVal, name: name || id || '' },
      value: newVal,
      type: 'change',
      preventDefault: () => {},
      stopPropagation: () => {},
    };
    onChange(syntheticEvent, newVal);
  };

  const resolvedLabel = label || props['aria-label'] || props.title || placeholder || 'Chọn...';
  const effectiveDisabled = Boolean(disabled || isDisabled);

  return (
    <div
      style={{
        width: width || style?.width || '100%',
        display: 'inline-block',
        ...containerStyle,
      }}
      className={className}
    >
      <Selector
        ref={ref}
        label={resolvedLabel}
        isLabelHidden={isLabelHidden}
        options={resolvedOptions}
        value={resolvedValue}
        onChange={handleChange}
        placeholder={placeholder || 'Chọn...'}
        isDisabled={effectiveDisabled}
        size={size}
        hasSearch={hasSearch}
        placement={placement}
        presentation={presentation}
        width="100%"
        style={{
          width: '100%',
          ...style,
        }}
      />
    </div>
  );
});

Select.displayName = 'Select';

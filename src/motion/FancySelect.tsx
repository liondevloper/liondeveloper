import { useEffect, useId, useRef, useState, type CSSProperties, type KeyboardEvent } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { MOTION_ENABLED } from './effects';
import './select.css';

export type SelectOption = { value: string; label: string };

export const toOption = (value: string): SelectOption => ({ value, label: value });

// Keep in sync with the .22s ld-sel-out animation in select.css.
const CLOSE_MS = 220;
// Options after this index all arrive together, so long lists still open quickly.
const MAX_STAGGER = 10;

type FancySelectProps = {
  name: string;
  value: string;
  options: SelectOption[];
  placeholder: string;
  onChange: (value: string) => void;
};

// A themed dropdown that replaces the browser's own select popup. The panel flips open in 3D with a
// colour glow and the options cascade in. A hidden input carries the value, so FormData still works.
export default function FancySelect({ name, value, options, placeholder, onChange }: FancySelectProps) {
  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const [active, setActive] = useState(0);
  const [burst, setBurst] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const listId = useId();
  const selected = options.find((option) => option.value === value);

  const close = () => {
    setOpen(false);
    if (MOTION_ENABLED) setClosing(true);
  };
  const show = () => {
    const index = options.findIndex((option) => option.value === value);
    setActive(index >= 0 ? index : 0);
    setClosing(false);
    setOpen(true);
    setBurst((count) => count + 1);
  };
  const pick = (option: SelectOption) => {
    onChange(option.value);
    close();
  };

  useEffect(() => {
    if (!closing) return;
    const timer = window.setTimeout(() => setClosing(false), CLOSE_MS);
    return () => window.clearTimeout(timer);
  }, [closing]);

  // A tap anywhere outside closes the panel.
  useEffect(() => {
    if (!open) return;
    const onDown = (event: PointerEvent) => {
      if (event.target instanceof Node && rootRef.current?.contains(event.target)) return;
      setOpen(false);
      if (MOTION_ENABLED) setClosing(true);
    };
    document.addEventListener('pointerdown', onDown);
    return () => document.removeEventListener('pointerdown', onDown);
  }, [open]);

  // Keeps the highlighted option in view while using the arrow keys.
  useEffect(() => {
    if (!open) return;
    listRef.current?.querySelector<HTMLElement>(`[data-index="${active}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [open, active]);

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (!open) {
      if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(event.key)) {
        event.preventDefault();
        show();
      }
      return;
    }
    if (event.key === 'Escape') {
      event.preventDefault();
      close();
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActive((index) => Math.min(index + 1, options.length - 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActive((index) => Math.max(index - 1, 0));
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      const option = options[active];
      if (option) pick(option);
    } else if (event.key === 'Tab') {
      close();
    }
  };

  return (
    <div className={`fancy-select ${open ? 'is-open' : ''}`} ref={rootRef}>
      <button
        type="button"
        className="fancy-trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => (open ? close() : show())}
        onKeyDown={onKeyDown}
      >
        {burst > 0 && <span className="fancy-ripple" key={burst} aria-hidden="true" />}
        <span className={`fancy-value ${value ? '' : 'is-placeholder'}`}>{selected?.label ?? placeholder}</span>
        <ChevronDown size={17} className="fancy-chevron" />
      </button>
      <input type="hidden" name={name} value={value} />
      {(open || closing) && (
        <div
          className={`fancy-panel ${closing ? 'is-closing' : ''}`}
          role="listbox"
          id={listId}
          ref={listRef}
          // The field sits inside a <label>; this stops a click in the panel from re-toggling the trigger.
          onClick={(event) => event.preventDefault()}
        >
          <span className="fancy-glow" aria-hidden="true" />
          {options.map((option, index) => (
            <button
              type="button"
              role="option"
              tabIndex={-1}
              key={option.value || 'none'}
              data-index={index}
              aria-selected={option.value === value}
              className={`fancy-option ${index === active ? 'is-active' : ''}`}
              style={{ '--i': Math.min(index, MAX_STAGGER) } as CSSProperties}
              onMouseEnter={() => setActive(index)}
              onClick={() => pick(option)}
            >
              <span>{option.label}</span>
              {option.value === value && <Check size={15} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

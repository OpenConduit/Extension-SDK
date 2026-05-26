/**
 * @openconduit/extension-sdk — CSS custom-property reference
 *
 * All `--oc-*` CSS variables injected into every sandbox document.
 * Import `CSS_VARS` for autocomplete when building dynamic styles in JS,
 * or use the variable names directly in your CSS/SCSS.
 *
 * @example
 * // In JS/TS:
 * import { CSS_VARS } from '@openconduit/extension-sdk';
 * el.style.color = `var(${CSS_VARS.text})`;
 *
 * @example
 * // In CSS (always available — no import needed):
 * .my-button { background: var(--oc-btn-bg); color: #fff; }
 */

export const CSS_VARS = {
  // ── Backgrounds ────────────────────────────────────────────────────────────
  /** Page background — matches the host app's main background. */
  bg:              '--oc-bg',
  /** Card / panel surface — slightly elevated above `bg`. */
  bgSurface:       '--oc-bg-surface',

  // ── Text ───────────────────────────────────────────────────────────────────
  /** Primary content text. */
  text:            '--oc-text',
  /** Secondary / placeholder text. */
  textMuted:       '--oc-text-muted',
  /** Heading text — higher contrast than `text`. */
  textHeading:     '--oc-text-heading',

  // ── Borders ────────────────────────────────────────────────────────────────
  /** Default border colour for cards, inputs, dividers. */
  border:          '--oc-border',

  // ── Buttons ────────────────────────────────────────────────────────────────
  /** Primary button background (blue). */
  btnBg:           '--oc-btn-bg',
  /** Primary button hover background. */
  btnHover:        '--oc-btn-hover',
  /** Disabled button background. */
  btnDisabledBg:   '--oc-btn-disabled-bg',
  /** Disabled button text colour. */
  btnDisabledText: '--oc-btn-disabled-text',

  // ── Badges ─────────────────────────────────────────────────────────────────
  /** Badge background (light violet). */
  badgeBg:         '--oc-badge-bg',
  /** Badge border. */
  badgeBorder:     '--oc-badge-border',
  /** Badge text (violet). */
  badgeText:       '--oc-badge-text',

  // ── Status ─────────────────────────────────────────────────────────────────
  /** Success / ok colour (green). */
  statusOk:        '--oc-status-ok',
  /** Error colour (red). */
  statusErr:       '--oc-status-err',

  // ── Code / pre ─────────────────────────────────────────────────────────────
  /** `<pre>` block background. */
  preBg:           '--oc-pre-bg',
  /** `<pre>` block text colour. */
  preText:         '--oc-pre-text',
  /** Inline `<code>` background. */
  codeBg:          '--oc-code-bg',
  /** Inline `<code>` text colour. */
  codeText:        '--oc-code-text',

  // ── Misc ───────────────────────────────────────────────────────────────────
  /** Section / label uppercase text colour. */
  sectionTitle:    '--oc-section-title',
  /** Card box-shadow (subtle elevation in light mode; `none` in dark mode). */
  cardShadow:      '--oc-card-shadow',
} as const;

export type CssVarName = typeof CSS_VARS[keyof typeof CSS_VARS];

/**
 * Returns a `var(--oc-*)` CSS string for use in inline styles.
 *
 * @example
 * el.style.color = cssVar('text');         // → "var(--oc-text)"
 * el.style.background = cssVar('bgSurface'); // → "var(--oc-bg-surface)"
 */
export function cssVar(name: keyof typeof CSS_VARS, fallback?: string): string {
  const prop = CSS_VARS[name];
  return fallback ? `var(${prop}, ${fallback})` : `var(${prop})`;
}

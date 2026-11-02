import type { CSSProperties } from 'react';

/**
 * One inline sprite, mounted once at the app root. Filled shapes, at most two
 * values per icon, nothing thinner than ~2.5px at a 24px render — an outline
 * icon set loses its edges at the sizes and contrasts a four-year-old is
 * looking at.
 *
 * Icons are always paired with a text label in the child app. An icon-only
 * control assumes a shared visual vocabulary a five-year-old has not built.
 */
export function IconSprite() {
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true" focusable="false">
      <defs>
        <symbol id="i-coin" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="9.5" fill="currentColor" />
          <circle cx="12" cy="12" r="6.6" fill="none" stroke="rgba(0,0,0,.22)" strokeWidth="1.7" />
          <path
            d="M12 8.4c0 2 .9 3 2.1 3.3-.2 1.5-1.2 2.4-2.4 2.4-1.4 0-2.5-1.1-2.5-2.7 0-1.8 1.2-3 2.8-3z"
            fill="rgba(0,0,0,.24)"
          />
        </symbol>

        <symbol id="i-star" viewBox="0 0 24 24">
          <path
            d="M12 2.6l2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 17.4l-5.8 3.1 1.1-6.5L2.6 9.4l6.5-.9z"
            fill="currentColor"
          />
        </symbol>

        <symbol id="i-check" viewBox="0 0 24 24">
          <path
            d="M20.3 5.6a1.9 1.9 0 010 2.7l-9.1 9.6a1.9 1.9 0 01-2.8 0L3.7 13a1.9 1.9 0 012.8-2.6l3.3 3.5 7.7-8.2a1.9 1.9 0 012.8-.1z"
            fill="currentColor"
          />
        </symbol>

        <symbol id="i-clock" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="9.4" fill="currentColor" />
          <path
            d="M12 6.6c.8 0 1.4.6 1.4 1.4v3.4l2.5 1.5a1.4 1.4 0 01-1.4 2.4l-3.2-1.9a1.4 1.4 0 01-.7-1.2V8c0-.8.6-1.4 1.4-1.4z"
            fill="var(--paper)"
          />
        </symbol>

        <symbol id="i-hourglass" viewBox="0 0 24 24">
          <path
            d="M6 2.4h12a1.6 1.6 0 010 3.2h-.4v1.1c0 1.9-1 3.6-2.7 4.6l-1 .7 1 .7a5.4 5.4 0 012.7 4.6v1.1H18a1.6 1.6 0 010 3.2H6a1.6 1.6 0 010-3.2h.4v-1.1c0-1.9 1-3.6 2.7-4.6l1-.7-1-.7A5.4 5.4 0 016.4 6.7V5.6H6a1.6 1.6 0 010-3.2z"
            fill="currentColor"
          />
          <path d="M12 12.6l2.9 4.9H9.1z" fill="rgba(0,0,0,.26)" />
        </symbol>

        <symbol id="i-home" viewBox="0 0 24 24">
          <path
            d="M11 3.1a1.7 1.7 0 012 0l7.6 5.9c.4.3.6.8.6 1.3v9a1.7 1.7 0 01-1.7 1.7h-4.8v-5.4a2.7 2.7 0 00-5.4 0V21H4.5A1.7 1.7 0 012.8 19.3v-9c0-.5.2-1 .6-1.3z"
            fill="currentColor"
          />
        </symbol>

        <symbol id="i-jobs" viewBox="0 0 24 24">
          <path
            d="M8.4 2.6h7.2c.6 0 1.1.4 1.3 1h1.7c1 0 1.8.8 1.8 1.8v14.1c0 1-.8 1.8-1.8 1.8H5.4c-1 0-1.8-.8-1.8-1.8V5.4c0-1 .8-1.8 1.8-1.8h1.7c.2-.6.7-1 1.3-1z"
            fill="currentColor"
          />
          <path
            d="M16.4 9.7a1.5 1.5 0 010 2.1l-4.6 4.8a1.5 1.5 0 01-2.2 0l-2-2.1a1.5 1.5 0 012.2-2.1l.9 1 3.5-3.7a1.5 1.5 0 012.2 0z"
            fill="var(--paper)"
          />
        </symbol>

        <symbol id="i-gift" viewBox="0 0 24 24">
          <path
            d="M2.9 9.2h18.2c.6 0 1.1.5 1.1 1.1v2c0 .6-.5 1.1-1.1 1.1H2.9c-.6 0-1.1-.5-1.1-1.1v-2c0-.6.5-1.1 1.1-1.1zM4.4 14.7h15.2v5.4c0 .9-.7 1.6-1.6 1.6H6c-.9 0-1.6-.7-1.6-1.6z"
            fill="currentColor"
          />
          <path
            d="M8.2 1.9c1.7 0 3 1.5 3.8 3.4.8-1.9 2.1-3.4 3.8-3.4a2.6 2.6 0 010 5.2h-2.2v14.9h-3.2V7.1H8.2a2.6 2.6 0 010-5.2z"
            fill="currentColor"
          />
          <path d="M10.4 9.2h3.2v12.5h-3.2z" fill="rgba(0,0,0,.2)" />
        </symbol>

        <symbol id="i-seed" viewBox="0 0 24 24">
          <path d="M11 12.4h2v9.2a1 1 0 01-2 0z" fill="currentColor" />
          <path
            d="M11.6 13.4C10 9.5 6.4 8.9 3.1 9.6c-.6 5 3.1 7.4 8.5 6.1zM12.4 12.1c1-4.2 4.4-5.6 7.8-5.6 1.3 4.8-1.7 8.1-7.3 8z"
            fill="currentColor"
          />
        </symbol>

        <symbol id="i-book" viewBox="0 0 24 24">
          <path
            d="M11.1 5.5v14.7c-2-1.4-4.6-2-7.4-2a1.4 1.4 0 01-1.4-1.4V4.9c0-.8.7-1.5 1.5-1.4 2.9.2 5.5 1 7.3 2zM12.9 5.5c1.8-1 4.4-1.8 7.3-2 .8-.1 1.5.6 1.5 1.4v11.9a1.4 1.4 0 01-1.4 1.4c-2.8 0-5.4.6-7.4 2z"
            fill="currentColor"
          />
        </symbol>

        <symbol id="i-people" viewBox="0 0 24 24">
          <circle cx="8.4" cy="7.6" r="4.2" fill="currentColor" />
          <circle cx="17" cy="8.6" r="3.3" fill="currentColor" />
          <path
            d="M8.4 13.2c3.9 0 7 2.2 7 5v1.6c0 .8-.6 1.4-1.4 1.4H2.8c-.8 0-1.4-.6-1.4-1.4v-1.6c0-2.8 3.1-5 7-5zM17 13.6c3.1 0 5.6 1.7 5.6 3.9v1.4c0 .7-.5 1.3-1.2 1.3h-4.3v-2c0-1.7-.8-3.2-2.1-4.3.6-.2 1.3-.3 2-.3z"
            fill="currentColor"
          />
        </symbol>

        <symbol id="i-chart" viewBox="0 0 24 24">
          <path
            d="M3.9 12.4h2.8c.7 0 1.3.6 1.3 1.3v6.1c0 .7-.6 1.3-1.3 1.3H3.9c-.7 0-1.3-.6-1.3-1.3v-6.1c0-.7.6-1.3 1.3-1.3zM10.6 7.6h2.8c.7 0 1.3.6 1.3 1.3v10.9c0 .7-.6 1.3-1.3 1.3h-2.8c-.7 0-1.3-.6-1.3-1.3V8.9c0-.7.6-1.3 1.3-1.3zM17.3 2.9h2.8c.7 0 1.3.6 1.3 1.3v15.6c0 .7-.6 1.3-1.3 1.3h-2.8c-.7 0-1.3-.6-1.3-1.3V4.2c0-.7.6-1.3 1.3-1.3z"
            fill="currentColor"
          />
        </symbol>

        <symbol id="i-ear" viewBox="0 0 24 24">
          <path
            d="M12.6 3.1c.6-.4 1.4 0 1.4.8v16.2c0 .8-.8 1.2-1.4.8L7.4 17H4.2c-.8 0-1.4-.6-1.4-1.4V8.4C2.8 7.6 3.4 7 4.2 7h3.2z"
            fill="currentColor"
          />
          <path
            d="M17.2 7.4a1.3 1.3 0 011.9.1 7 7 0 010 9 1.3 1.3 0 11-2-1.7 4.4 4.4 0 000-5.6 1.3 1.3 0 01.1-1.8z"
            fill="currentColor"
          />
          <path
            d="M20.4 4a1.3 1.3 0 011.9.1 11.4 11.4 0 010 15.8 1.3 1.3 0 11-1.9-1.8 8.8 8.8 0 000-12.2A1.3 1.3 0 0120.4 4z"
            fill="currentColor"
            opacity=".55"
          />
        </symbol>

        <symbol id="i-shield" viewBox="0 0 24 24">
          <path
            d="M11.4 2.2a1.6 1.6 0 011.2 0l7 2.7c.6.2 1 .8 1 1.5v5.2c0 4.4-2.9 8.4-7.2 9.9a1.6 1.6 0 01-1 0C8.1 20 5.2 16 5.2 11.6V6.4c0-.7.4-1.3 1-1.5z"
            transform="translate(-.2)"
            fill="currentColor"
          />
          <path
            d="M15.9 8.9a1.4 1.4 0 010 2l-4.2 4.3a1.4 1.4 0 01-2 0l-1.8-1.9a1.4 1.4 0 012-2l.8.8 3.2-3.2a1.4 1.4 0 012 0z"
            fill="var(--paper)"
          />
        </symbol>

        <symbol id="i-arrowr" viewBox="0 0 24 24">
          <path
            d="M13 4.5a1.7 1.7 0 012.4 0l6.1 6.3a1.7 1.7 0 010 2.4l-6.1 6.3a1.7 1.7 0 01-2.4-2.4l3.2-3.3H3.4a1.7 1.7 0 010-3.4h12.8L13 6.9a1.7 1.7 0 010-2.4z"
            fill="currentColor"
          />
        </symbol>

        <symbol id="i-arrowl" viewBox="0 0 24 24">
          <path
            d="M11 19.5a1.7 1.7 0 01-2.4 0l-6.1-6.3a1.7 1.7 0 010-2.4l6.1-6.3A1.7 1.7 0 0111 6.9L7.8 10.2h12.8a1.7 1.7 0 010 3.4H7.8L11 17.1a1.7 1.7 0 010 2.4z"
            fill="currentColor"
          />
        </symbol>

        <symbol id="i-camera" viewBox="0 0 24 24">
          <path
            d="M9.3 2.8h5.4c.6 0 1.1.3 1.4.8l.8 1.4h3a2.3 2.3 0 012.3 2.3v11a2.3 2.3 0 01-2.3 2.3H4.1a2.3 2.3 0 01-2.3-2.3v-11a2.3 2.3 0 012.3-2.3h3l.8-1.4c.3-.5.8-.8 1.4-.8z"
            fill="currentColor"
          />
          <circle cx="12" cy="13" r="4.2" fill="var(--paper)" />
        </symbol>

        <symbol id="i-mic" viewBox="0 0 24 24">
          <path
            d="M12 1.8a3.9 3.9 0 013.9 3.9v5.4a3.9 3.9 0 01-7.8 0V5.7A3.9 3.9 0 0112 1.8z"
            fill="currentColor"
          />
          <path
            d="M5.4 10a1.5 1.5 0 011.5 1.5 5.1 5.1 0 0010.2 0 1.5 1.5 0 013 0 8.1 8.1 0 01-6.6 8v1.2h2a1.5 1.5 0 010 3H8.5a1.5 1.5 0 010-3h2v-1.2a8.1 8.1 0 01-6.6-8A1.5 1.5 0 015.4 10z"
            fill="currentColor"
          />
        </symbol>

        <symbol id="i-lock" viewBox="0 0 24 24">
          <path
            d="M12 1.9a5.3 5.3 0 015.3 5.3v2.3h-3V7.2a2.3 2.3 0 00-4.6 0v2.3h-3V7.2A5.3 5.3 0 0112 1.9z"
            fill="currentColor"
          />
          <path
            d="M5.4 9.5h13.2a2 2 0 012 2v8.6a2 2 0 01-2 2H5.4a2 2 0 01-2-2v-8.6a2 2 0 012-2z"
            fill="currentColor"
          />
          <circle cx="12" cy="15.8" r="2.1" fill="var(--paper)" />
        </symbol>

        <symbol id="i-plus" viewBox="0 0 24 24">
          <path
            d="M12 2.8c1 0 1.8.8 1.8 1.8v5.6h5.6a1.8 1.8 0 010 3.6h-5.6v5.6a1.8 1.8 0 01-3.6 0v-5.6H4.6a1.8 1.8 0 010-3.6h5.6V4.6c0-1 .8-1.8 1.8-1.8z"
            fill="currentColor"
          />
        </symbol>

        <symbol id="i-talk" viewBox="0 0 24 24">
          <path
            d="M4.4 2.9h15.2a2.4 2.4 0 012.4 2.4v8.9a2.4 2.4 0 01-2.4 2.4H11l-4.6 3.9a1.1 1.1 0 01-1.8-.9v-3H4.4A2.4 2.4 0 012 13.2V5.3a2.4 2.4 0 012.4-2.4z"
            fill="currentColor"
          />
          <circle cx="8" cy="9.3" r="1.5" fill="var(--paper)" />
          <circle cx="12" cy="9.3" r="1.5" fill="var(--paper)" />
          <circle cx="16" cy="9.3" r="1.5" fill="var(--paper)" />
        </symbol>
      </defs>
    </svg>
  );
}

export type IconName =
  | 'coin'
  | 'star'
  | 'check'
  | 'clock'
  | 'hourglass'
  | 'home'
  | 'jobs'
  | 'gift'
  | 'seed'
  | 'book'
  | 'people'
  | 'chart'
  | 'ear'
  | 'shield'
  | 'arrowr'
  | 'arrowl'
  | 'camera'
  | 'mic'
  | 'lock'
  | 'plus'
  | 'talk';

export function Icon({
  name,
  className,
  style,
}: {
  name: IconName;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <svg className={className} style={style} aria-hidden="true" focusable="false">
      <use href={`#i-${name}`} />
    </svg>
  );
}

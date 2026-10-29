/**
 * Space War — SVG icon set (no emojis)
 */
(function (global) {
  const ICONS = {
    moai: `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M8 2.8h8c.7 0 1.2.5 1.2 1.2v4.4c0 .3-.1.5-.2.7l-.8 1.1v8.2c0 .9-.6 1.6-1.4 1.8l-2.5.6c-.8.2-1.6.2-2.4 0l-2.5-.6A1.8 1.8 0 0 1 7.2 18.4V10.2l-.8-1.1c-.1-.2-.2-.4-.2-.7V4c0-.7.5-1.2 1.2-1.2zm1.4 2v2.2h5.2V4.8H9.4zm.9 3.8h1.5v2H10.3v-2zm3.3 0h1.5v2h-1.5v-2zm-3.1 3.6v5.7l1.7.4c.5.1 1 .1 1.5 0l1.7-.4v-5.7h-4.9z"/></svg>`,
    trophy: `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M6.5 3.5h11v2.2h2.3v2.8a4.8 4.8 0 0 1-3.7 4.7A4.7 4.7 0 0 1 13.2 16v1.3h2.3v2.2H8.5V17.3h2.3V16a4.7 4.7 0 0 1-2.9-2.8 4.8 4.8 0 0 1-3.7-4.7V5.7h2.3V3.5zm0 4.2H6.2v1a2.8 2.8 0 0 0 2.6 2.8V7.7H6.5zm11 0h-2.6v2.8a2.8 2.8 0 0 0 2.6-2.8v-1z"/></svg>`,
    cart: `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M4 4.5h2.1l.5 2.1h12.7l-1.7 7.8H8.1L7.7 16h10.4v2H6.2L4 4.5zm4.8 14a1.4 1.4 0 1 1 0 2.8 1.4 1.4 0 0 1 0-2.8zm8.2 0a1.4 1.4 0 1 1 0 2.8 1.4 1.4 0 0 1 0-2.8z"/></svg>`,
    volume: `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M4 9v6h3l5 4V5L7 9H4zm11.5 3a3.5 3.5 0 0 0-1.8-3.1v6.2A3.5 3.5 0 0 0 15.5 12zM13.7 5.1v1.7a5.5 5.5 0 0 1 0 10.4v1.7a7.2 7.2 0 0 0 0-13.8z"/></svg>`,
    mute: `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M4 9v6h3l5 4V5L7 9H4zm12.6-2.1 1.4 1.4L16.4 10l1.6 1.7-1.4 1.4L15 11.4l-1.6 1.7-1.4-1.4L13.6 10l-1.6-1.7 1.4-1.4L15 8.6l1.6-1.7z"/></svg>`,
    sword: `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="m14.5 3 6.5 6.5-1.4 1.4-1.8-1.8-5.3 5.3 1.1 1.1-1.4 1.4-1.1-1.1-1.8 1.8L8 19.3 4.7 16 6.4 14.3l1.8-1.8-1.1-1.1 1.4-1.4 1.1 1.1 5.3-5.3-1.8-1.8L14.5 3z"/></svg>`,
    shield: `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2 4 5v6c0 5.2 3.4 9.9 8 11 4.6-1.1 8-5.8 8-11V5l-8-3zm0 2.2 6 2.2v4.6c0 4.1-2.6 7.8-6 8.9-3.4-1.1-6-4.8-6-8.9V6.4l6-2.2z"/></svg>`,
    gem: `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M6 3h12l4 6-10 12L2 9l4-6zm2.2 2L6.1 8h3.3L8.2 5zm3.3 0 1.2 3h-2.4l1.2-3zm3.3 0L14.6 8h3.3L16.8 5zM7.3 10l4.7 9.2L16.7 10H7.3z"/></svg>`,
    crown: `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M3 7l4 4 5-6 5 6 4-4v11H3V7zm2 9h14v-4.2l-2.2 2.2-4.8-5.8-4.8 5.8L5 11.8V16z"/></svg>`,
    star: `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="m12 2 2.9 6.6L22 10l-5 4.7L18.2 22 12 18.5 5.8 22 7 14.7 2 10l7.1-1.4L12 2z"/></svg>`,
    scroll: `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M6 3h9a3 3 0 0 1 3 3v11h1a2 2 0 1 1 0 4H8a3 3 0 0 1-3-3V6a3 3 0 0 1 1-5.8V3zm0 2a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h9V6a1 1 0 0 0-1-1H6z"/></svg>`,
    crystal: `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2 4 8l8 14 8-14-8-6zm0 2.5L17.2 8 12 17.2 6.8 8 12 4.5z"/></svg>`,
    mask: `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 3c5 0 9 3.2 9 8 0 4-2.5 6.5-5.5 7.5-.4.9-1.2 2.5-3.5 2.5s-3.1-1.6-3.5-2.5C5.5 17.5 3 15 3 11c0-4.8 4-8 9-8zm-3.5 7a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zm7 0a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3z"/></svg>`,
    quote: `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M7 7h5v5H9.5A2.5 2.5 0 0 0 12 14.5V17A5 5 0 0 1 7 12V7zm10 0h5v5h-2.5A2.5 2.5 0 0 0 22 14.5V17a5 5 0 0 1-5-5V7z"/></svg>`,
    science: `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M8 2h8v2h-1v3.2l4.8 8.1A3 3 0 0 1 17.2 20H6.8a3 3 0 0 1-2.6-4.7L9 7.2V4H8V2zm2 5.5L5.8 15.2A1 1 0 0 0 6.8 18h10.4a1 1 0 0 0 1-1.5L14 7.5V4h-4v3.5z"/></svg>`,
    letter: `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M3 5h18v14H3V5zm2 2v.4l7 4.4 7-4.4V7H5zm14 2.8-7 4.4-7-4.4V17h14V9.8z"/></svg>`,
    warning: `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 3 1 21h22L12 3zm0 4.5 7.2 12H4.8L12 7.5zM11 11v4h2v-4h-2zm0 5v2h2v-2h-2z"/></svg>`,
    target: `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2a10 10 0 1 1 0 20 10 10 0 0 1 0-20zm0 2a8 8 0 1 0 0 16 8 8 0 0 0 0-16zm0 2a6 6 0 1 1 0 12 6 6 0 0 1 0-12zm0 2a4 4 0 1 0 0 8 4 4 0 0 0 0-8zm0 2a2 2 0 1 1 0 4 2 2 0 0 1 0-4z"/></svg>`,
    blast: `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M11 2 9 9H3l6 4-3 9 7-6 7 6-3-9 6-4h-6L13 2h-2z"/></svg>`,
    skull: `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2a8 8 0 0 1 8 8c0 3.2-1.6 5.2-3 6.5V19H7v-2.5C5.6 15.2 4 13.2 4 10a8 8 0 0 1 8-8zM9 10a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zm6 0a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zm-4 5h2v2h-2v-2z"/></svg>`,
    fire: `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2s4 4 4 8a4 4 0 0 1-8 0c0-1.5.7-3 2-4-.2 2 1 3 2 3 0-2 0-5 0-7zm0 12a6 6 0 0 0 6-6c0 4.4-2.7 8-6 10-3.3-2-6-5.6-6-10a6 6 0 0 0 6 6z"/></svg>`,
    bolt: `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M13 2 4 14h6l-1 8 11-14h-6l-1-6z"/></svg>`,
    dragon: `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M3 12c2-4 5-7 9-8 1 2 2 4 2 6 2 0 4 1 5 3l2-1v4l-3 1c-1 3-4 5-7 5-4 0-7-3-8-7v-3zm7-1a2 2 0 1 0 0-4 2 2 0 0 0 0 4z"/></svg>`,
    meteor: `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M3 3 12 9l2-2 7 14-14-7 2-2L3 3zm11.5 9.1a2.5 2.5 0 1 0 3.5 3.5 2.5 2.5 0 0 0-3.5-3.5z"/></svg>`,
    run: `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M14 3a2 2 0 1 1 0 4 2 2 0 0 1 0-4zM8 8l4 1 2 3 3-1 2 2-4 2-1 5h-2l-1-4-3 1V13l3-1-1-2H7V8h1z"/></svg>`,
    ghost: `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2a7 7 0 0 1 7 7v11l-2.5-2-2.5 2-2.5-2L9 20l-2.5-2L4 20V9a7 7 0 0 1 8-7zM9 9a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zm6 0a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3z"/></svg>`,
    hammer: `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="m13 2 9 9-2 2-3-3-5.5 5.5 4 4-2 2-4-4L2 21l-1-1 7.5-7.5L5 9l2-2 3 3L15 5l-2-2 0-.0z"/></svg>`,
    heart: `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 21s-7.5-4.7-9.8-9.2C.5 8.2 2.2 5 5.4 5c1.8 0 3.2 1 3.9 2.2C10 6 11.4 5 13.2 5c3.2 0 4.9 3.2 3.2 6.8C14.1 16.3 12 21 12 21z"/></svg>`,
    gift: `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 7c-.8-1.5-2.4-2.5-4-2.5A3.5 3.5 0 0 0 8 11.4V12H3v9h8v-9h2v9h8v-9h-5v-.6A3.5 3.5 0 0 0 16 4.5C14.4 4.5 12.8 5.5 12 7zM8 6.5A1.5 1.5 0 1 1 8 9.5h2.1C9.5 8 8.7 7 8 6.5zm8 0c-.7.5-1.5 1.5-2.1 3H16a1.5 1.5 0 1 0 0-3zM5 14h6v5H5v-5zm8 0h6v5h-6v-5z"/></svg>`,
    capsule: `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M8.5 3.5a5 5 0 0 1 7 7l-7 7a5 5 0 1 1-7-7l7-7zm1.4 2.8-5.7 5.7a3 3 0 1 0 4.2 4.2l2.8-2.8-1.3-5.1zm3.5.7 1.3 5.1 2.7-2.7a3 3 0 1 0-4-4.2z"/></svg>`,
    leaf: `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M5 19c8 1 14-5 14-14-9 0-15 6-14 14zm4.5-4.5C8 13 8 10 10 8c0 2 1.5 4 3.5 5-2 0-3.5 1-4 1.5z"/></svg>`,
    bow: `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M3 12c0-5 4-9 9-9v2a7 7 0 0 0-7 7h-2zm18 0h-2a7 7 0 0 0-7-7V3c5 0 9 4 9 9zM12 13l9 7-1.2 1.5L12 15.2 4.2 21.5 3 20l9-7z"/></svg>`,
    coin: `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2a10 10 0 1 1 0 20 10 10 0 0 1 0-20zm0 2a8 8 0 1 0 0 16 8 8 0 0 0 0-16zm-1 3h2v2.1c1.4.3 2.5 1.2 2.5 2.9 0 1.9-1.5 2.8-3.2 3.1V18h-2v-2h-.3C8.6 15.8 7.5 14.5 7.5 12.8h2c0 .8.6 1.3 1.7 1.3 1.1 0 1.8-.5 1.8-1.2 0-.8-.7-1.2-2-1.4V7z"/></svg>`,
    blossom: `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 10a2 2 0 1 1 0 4 2 2 0 0 1 0-4zm0-7 1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3zm7 7 1.2 3.5L24 15l-3.8 1.2L19 20l-1.2-3.8L14 15l3.8-1.5L19 10zM5 10l1.2 3.5L10 15l-3.8 1.2L5 20l-1.2-3.8L0 15l3.8-1.5L5 10z"/></svg>`,
    medkit: `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M9 3h6v3h5v15H4V6h5V3zm2 2v3H6v11h12V8h-5V5h-2zm1 5h2v3h3v2h-3v3h-2v-3H9v-2h3v-3z"/></svg>`,
    chart: `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M4 19h16v2H2V3h2v16zm3-1V11h3v7H7zm5 0V6h3v12h-3zm5 0v-4h3v4h-3z"/></svg>`,
    galaxy: `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2c2 4 7 6 7 11a7 7 0 0 1-14 0c0-2 .7-3.7 2-5-1 4 1.5 7 5 7 2.5 0 4-1.5 4-3.5S14.5 9 12 9c-4 0-7 3.2-7 7 0 5.5 5 9 10 7-5 .5-9-3-9-8 0-6 5-10 10-13z"/></svg>`,
    medal: `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M7 2h3l2 5 2-5h3l-3.5 8.2A5 5 0 1 1 7.1 15L7 2zm5 10a3 3 0 1 0 0 6 3 3 0 0 0 0-6z"/></svg>`,
    egg: `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2c4.4 0 8 5.4 8 11s-3.6 9-8 9-8-3.4-8-9 3.6-11 8-11z"/></svg>`,
    rocket: `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2c3 2 5 5 6 9l2 1-2 3-2-.5C14.5 18 12 20 9 21l-1-3-3-1c1-3 3-5.5 6.5-7L12 2zm0 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM6 16l2 2-3 3-1-2 2-3z"/></svg>`,
    spark: `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 1 13.5 8 21 9.5 13.5 11 12 18l-1.5-7L3 9.5 10.5 8 12 1zm7 11 1 3 3 1-3 1-1 3-1-3-3-1 3-1 1-3zM4 14l.8 2.2L7 17l-2.2.8L4 20l-.8-2.2L1 17l2.2-.8L4 14z"/></svg>`,
    strength: `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M2 9h3v6H2V9zm17 0h3v6h-3V9zM6 10h2l1-2h6l1 2h2v4h-2l-1 2H9l-1-2H6v-4z"/></svg>`,
    all: `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M4 5h7v7H4V5zm9 0h7v7h-7V5zM4 14h7v7H4v-7zm9 0h7v7h-7v-7z"/></svg>`,
    check: `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="m9.2 16.6-4-4 1.4-1.4 2.6 2.6 8-8 1.4 1.4-9.4 9.4z"/></svg>`,
  };

  function swIcon(name, className) {
    const svg = ICONS[name] || ICONS.spark;
    const cls = className ? ` class="sw-icon ${className}"` : ' class="sw-icon"';
    return `<span${cls} data-icon="${name}">${svg}</span>`;
  }

  global.SW_ICONS = ICONS;
  global.swIcon = swIcon;
})(typeof window !== "undefined" ? window : globalThis);

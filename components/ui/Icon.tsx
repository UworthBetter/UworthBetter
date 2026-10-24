export type IconName =
  | "home"
  | "book"
  | "shelf"
  | "mail"
  | "lock"
  | "camera"
  | "check"
  | "chevron-right"
  | "chevron-down"
  | "diamond"
  | "flag"
  | "lighthouse"
  | "boat"
  | "fog"
  | "pencil"
  | "leaf"
  | "brush"
  | "city"
  | "question"
  | "link"
  | "sparkle"
  | "moon"
  | "stack";

export function IconSprite() {
  return (
    <svg style={{ position: "absolute", width: 0, height: 0 }} aria-hidden>
      <defs>
        <symbol id="i-home" viewBox="0 0 24 24"><path d="M3.5 11 12 4l8.5 7" /><path d="M5.5 10v9.5h13V10" /><path d="M10 19.5V14h4v5.5" /></symbol>
        <symbol id="i-book" viewBox="0 0 24 24"><path d="M12 6.5c-1.6-1.3-4-2-7-2v13c3 0 5.4.7 7 2 1.6-1.3 4-2 7-2V4.5c-3 0-5.4.7-7 2Z" /><path d="M12 6.5v13" /></symbol>
        <symbol id="i-shelf" viewBox="0 0 24 24"><rect x="4" y="4.5" width="4.5" height="15" /><rect x="10" y="7" width="4.5" height="12.5" /><rect x="16" y="3" width="4" height="16.5" /></symbol>
        <symbol id="i-mail" viewBox="0 0 24 24"><rect x="3.5" y="5.5" width="17" height="13" rx="1.5" /><path d="M4.5 6.5 12 13l7.5-6.5" /></symbol>
        <symbol id="i-lock" viewBox="0 0 24 24"><rect x="5" y="10.5" width="14" height="10" rx="1.5" /><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" /></symbol>
        <symbol id="i-camera" viewBox="0 0 24 24"><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M8 7l1.6-2.5h4.8L16 7" /><circle cx="12" cy="13.5" r="3.6" /></symbol>
        <symbol id="i-check" viewBox="0 0 24 24"><path d="M4.5 12.5 9.5 17.5 20 6" /></symbol>
        <symbol id="i-chevron-right" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7" /></symbol>
        <symbol id="i-chevron-down" viewBox="0 0 24 24"><path d="M5 9l7 7 7-7" /></symbol>
        <symbol id="i-diamond" viewBox="0 0 24 24"><path d="M12 3 20 12 12 21 4 12Z" /></symbol>
        <symbol id="i-flag" viewBox="0 0 24 24"><path d="M6 20V4" /><path d="M6 5c3-1.5 5 1.5 8 0 1-.5 2-.3 2 .5v7c0 .8-1 1-2 .5-3-1.5-5 1.5-8 0Z" /></symbol>
        <symbol id="i-lighthouse" viewBox="0 0 24 24"><path d="M10 21h4" /><path d="M9.5 21 11 7h2l1.5 14Z" /><path d="M10.6 7h2.8l-.6-3h-1.6Z" /><path d="M9 11h6M8.5 15h7" /></symbol>
        <symbol id="i-boat" viewBox="0 0 24 24"><path d="M4 15h16l-2 4H6Z" /><path d="M12 15V5" /><path d="M12 6l5 4H12Z" /></symbol>
        <symbol id="i-fog" viewBox="0 0 24 24"><path d="M4 9h12M3 13h16M5 17h14" /></symbol>
        <symbol id="i-pencil" viewBox="0 0 24 24"><path d="M4 20l1-4.5L15.5 5 19 8.5 8.5 19Z" /><path d="M14 6.5 17.5 10" /></symbol>
        <symbol id="i-leaf" viewBox="0 0 24 24"><path d="M5 19c-1-6 2-13 14-14-1 12-8 15-14 14Z" /><path d="M5 19c2-5 5-8 9-10" /></symbol>
        <symbol id="i-brush" viewBox="0 0 24 24"><path d="M6 18c0-5 2-9 5-12l5 5c-3 3-7 5-10 7Z" /><path d="M15 6l3-3" /></symbol>
        <symbol id="i-city" viewBox="0 0 24 24"><path d="M4 20V10l4-2v12M12 20V6l4 2v12M16 20V12l4 2v6" /><path d="M4 20h16" /></symbol>
        <symbol id="i-question" viewBox="0 0 24 24"><path d="M9 9a3 3 0 1 1 4.5 2.6c-.9.6-1.5 1.1-1.5 2.4" /><path d="M12 17.5v.1" /></symbol>
        <symbol id="i-link" viewBox="0 0 24 24"><path d="M9.5 14.5 14.5 9.5" /><path d="M11 7l1-1a3.5 3.5 0 0 1 5 5l-1 1" /><path d="M13 17l-1 1a3.5 3.5 0 0 1-5-5l1-1" /></symbol>
        <symbol id="i-sparkle" viewBox="0 0 24 24"><path d="M12 3v6M12 15v6M3 12h6M15 12h6" opacity=".55" /><path d="M12 9l1.8 1.8L12 12.6 10.2 10.8Z" /></symbol>
        <symbol id="i-moon" viewBox="0 0 24 24"><path d="M19 13.5A7.5 7.5 0 1 1 10.5 5 6 6 0 0 0 19 13.5Z" /></symbol>
        <symbol id="i-stack" viewBox="0 0 24 24"><path d="M12 3 21 8l-9 5-9-5Z" /><path d="M3 12l9 5 9-5" /><path d="M3 16l9 5 9-5" /></symbol>
      </defs>
    </svg>
  );
}

export function Icon({ name, className = "", size }: { name: IconName; className?: string; size?: "sm" | "lg" }) {
  const sizeCls = size === "sm" ? "icon-sm" : size === "lg" ? "icon-lg" : "";
  return (
    <svg className={`icon ${sizeCls} ${className}`.trim()} aria-hidden>
      <use href={`#i-${name}`} />
    </svg>
  );
}

export function LogoMark({ size = 30 }: { size?: number }) {
  return (
    <div
      className="relative grid shrink-0 place-items-center overflow-hidden rounded-[9px] bg-[#777fd7] shadow-[0_5px_16px_rgba(105,113,205,0.28)]"
      style={{ height: size, width: size }}
      aria-hidden="true"
    >
      <svg viewBox="0 0 30 30" className="h-full w-full">
        <path d="M7 8.5 15 23 23 8.5h-5.2L15 14l-2.8-5.5H7Z" fill="#f8f5ef" />
        <circle cx="22" cy="7" r="2" fill="#f2be7c" />
      </svg>
    </div>
  );
}

import { Icon, type IconName } from "@/components/ui/icon";

interface SidebarItemProps {
  icon: IconName;
  label: string;
  active?: boolean;
  badge?: string;
  collapsed?: boolean;
  onClick?: () => void;
}

export function SidebarItem({
  icon,
  label,
  active = false,
  badge,
  collapsed = false,
  onClick,
}: SidebarItemProps) {
  if (collapsed) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`group relative flex h-9 w-9 items-center justify-center rounded-lg transition-colors cursor-pointer mx-auto ${
          active
            ? "bg-white/[0.1] text-white"
            : "text-[#858680] hover:bg-white/[0.05] hover:text-[#d5d4cf]"
        }`}
        aria-current={active ? "page" : undefined}
        title={badge ? `${label} (${badge})` : label}
      >
        <Icon
          name={icon}
          size={17}
          className={active ? "text-[#aeb3ef]" : "text-[#777873] group-hover:text-[#a5a7a0]"}
        />
        {badge && Number(badge) > 0 && (
          <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-[#777fd7]" />
        )}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group flex h-9 w-full items-center gap-2.5 rounded-[10px] px-2.5 text-left text-[12px] transition-colors cursor-pointer ${
        active
          ? "bg-white/[0.08] text-[#f5f3ef]"
          : "text-[#8e8f8a] hover:bg-white/[0.045] hover:text-[#d5d4cf]"
      }`}
      aria-current={active ? "page" : undefined}
      title={label}
    >
      <Icon
        name={icon}
        size={17}
        className={active ? "text-[#aeb3ef]" : "text-[#777873] group-hover:text-[#a5a7a0]"}
      />
      <span className="flex-1 truncate">{label}</span>
      {badge && (
        <span className="rounded-full bg-white/[0.06] px-1.5 py-0.2 text-[9px] tracking-wide text-[#777873]">
          {badge}
        </span>
      )}
    </button>
  );
}

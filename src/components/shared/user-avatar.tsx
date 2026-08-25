import { cn } from "@/lib/utils";
import { AvatarIcon } from "./avatar-icon";

interface UserAvatarProps {
  iniciais: string;
  avatarId?: string | null;
  bannerColor?: string | null;
  nivel?: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const SIZE_CLASSES: Record<NonNullable<UserAvatarProps["size"]>, string> = {
  sm: "size-9 rounded-lg text-sm",
  md: "size-16 rounded-2xl text-xl",
  lg: "size-24 rounded-3xl text-3xl",
};

export function UserAvatar({ iniciais, avatarId, bannerColor, nivel, size = "md", className }: UserAvatarProps) {
  return (
    <div className={cn("relative inline-flex", className)}>
      <div
        className={cn("flex items-center justify-center bg-primary font-extrabold text-primary-foreground ring-4 ring-primary/15", SIZE_CLASSES[size])}
        style={bannerColor ? { background: bannerColor } : undefined}
      >
        {avatarId ? <AvatarIcon id={avatarId} /> : iniciais}
      </div>
      {typeof nivel === "number" && (
        <span className="absolute -bottom-1.5 -right-1.5 rounded-md bg-secondary px-1.5 py-0.5 text-[0.65rem] font-bold leading-none text-secondary-foreground shadow-sm ring-2 ring-background">
          Nv.{nivel}
        </span>
      )}
    </div>
  );
}

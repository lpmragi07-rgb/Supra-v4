import Image from "next/image";
import { cn } from "@/lib/utils";

// Logo da marca V4. Renderiza apenas o selo vermelho ou o selo + nome "Supra".
export function Logo({
  size = 36,
  withName = false,
  priority = false,
  className,
}: {
  size?: number;
  withName?: boolean;
  priority?: boolean;
  className?: string;
}) {
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <Image
        src="/v4logo.jpg"
        alt="V4"
        width={size}
        height={size}
        priority={priority}
        className="shrink-0 rounded-lg object-cover shadow-glow"
      />
      {withName && (
        <span className="font-serif text-xl font-semibold tracking-tight text-white">
          Supra
        </span>
      )}
    </span>
  );
}

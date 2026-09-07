import {
  Baby,
  Flower2,
  HeartHandshake,
  Landmark,
  Scale,
  Shield,
  Stethoscope,
  Trees,
  type LucideIcon,
} from "lucide-react";
import type { Area } from "@/lib/areas";

const map: Record<Area["icon"], LucideIcon> = {
  landmark: Landmark,
  trees: Trees,
  heart: HeartHandshake,
  stethoscope: Stethoscope,
  shield: Shield,
  baby: Baby,
  flower: Flower2,
  scale: Scale,
};

export function AreaIcon({
  name,
  className = "h-5 w-5",
}: {
  name: Area["icon"];
  className?: string;
}) {
  const Icon = map[name];
  return <Icon className={className} strokeWidth={1.5} aria-hidden />;
}

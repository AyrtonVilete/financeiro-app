import {
  Home,
  Utensils,
  Car,
  HeartPulse,
  BookOpen,
  PartyPopper,
  ShoppingBag,
  Repeat,
  PawPrint,
  MoreHorizontal,
  Wallet,
  PlusCircle,
  Circle,
  type LucideIcon,
} from "lucide-react";

const ICONS: Record<string, LucideIcon> = {
  home: Home,
  utensils: Utensils,
  car: Car,
  "heart-pulse": HeartPulse,
  "book-open": BookOpen,
  "party-popper": PartyPopper,
  "shopping-bag": ShoppingBag,
  repeat: Repeat,
  "paw-print": PawPrint,
  "more-horizontal": MoreHorizontal,
  wallet: Wallet,
  "plus-circle": PlusCircle,
};

export function getCategoryIcon(icon: string | undefined | null): LucideIcon {
  if (!icon) return Circle;
  return ICONS[icon] ?? Circle;
}

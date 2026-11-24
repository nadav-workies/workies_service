import { Square, Circle, Navigation, Triangle, Trophy, Star, Heart, Rocket, Flame, Crown, Sun, Zap, Coffee, Smile, Gem, Flower2 } from "lucide-react";

// Answer tiles: colour + shape per option (Kahoot style).
export const ANSWER_STYLES = [
  { icon: Square, cls: "eg-c0", label: "ריבוע" },
  { icon: Circle, cls: "eg-c1", label: "עיגול" },
  { icon: Navigation, cls: "eg-c2", label: "חץ" },
  { icon: Triangle, cls: "eg-c3", label: "משולש" },
];

// Participant avatar icons (keys must match the backend list).
export const AVATARS = {
  trophy: { icon: Trophy, label: "גביע" },
  star: { icon: Star, label: "כוכב" },
  heart: { icon: Heart, label: "לב" },
  rocket: { icon: Rocket, label: "טיל" },
  flame: { icon: Flame, label: "להבה" },
  crown: { icon: Crown, label: "כתר" },
  sun: { icon: Sun, label: "שמש" },
  zap: { icon: Zap, label: "ברק" },
  coffee: { icon: Coffee, label: "קפה" },
  smile: { icon: Smile, label: "חיוך" },
  gem: { icon: Gem, label: "יהלום" },
  flower: { icon: Flower2, label: "פרח" },
};
export const avatarIcon = (key) => (AVATARS[key] || AVATARS.star).icon;
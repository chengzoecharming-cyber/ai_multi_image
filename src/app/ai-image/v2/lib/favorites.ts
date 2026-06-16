const FAVORITES_KEY = "ai-image-v2-favorites";

export interface FavoriteItem {
  id: string;
  imageUrl: string;
  prompt?: string | null;
  productImageUrls?: string[];
  referenceImageUrls?: string[];
  planName?: string;
  createdAt: number;
}

export function getFavorites(): FavoriteItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    return raw ? (JSON.parse(raw) as FavoriteItem[]) : [];
  } catch {
    return [];
  }
}

export function addFavorite(item: FavoriteItem): void {
  const favorites = getFavorites();
  if (favorites.some((f) => f.imageUrl === item.imageUrl)) return;
  favorites.unshift(item);
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
}

export function removeFavorite(imageUrl: string): void {
  const favorites = getFavorites().filter((f) => f.imageUrl !== imageUrl);
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
}

export function isFavorited(imageUrl: string): boolean {
  return getFavorites().some((f) => f.imageUrl === imageUrl);
}

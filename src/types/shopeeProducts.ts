export interface ShopeeProduct {
    id: string;
    name: string;
    sku: string | null;
    /** Shopee item_status: NORMAL | UNLIST | BANNED */
    status: string;
    imageUrl: string | null;
    /** null when the product has variations (price is per variation). */
    price: number | null;
    originalPrice: number | null;
    hasVariations: boolean;
    stock: number | null;
    sold: number | null;
    views: number | null;
    likes: number | null;
    rating: number | null;
}

export interface ShopeeProductsResponse {
    connected: boolean;
    error?: string;
    lastSyncedAt: string | null;
    products: ShopeeProduct[];
}

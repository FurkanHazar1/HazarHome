import { prisma } from "@/lib/prisma";
import { MetadataRoute } from "next";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://hazarhome.com";

  // 1. Ana Sayfalar
  const routes = ["", "/contact"].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: "daily" as const,
    priority: 1,
  }));

  // 2. Kategoriler
  const categories = ["oturma-odasi", "yemek-odasi", "yatak-odasi"];
  const subCategories = [
    "koltuk-takimlari", "kose-takimlari", "berjerler", "tv-uniteleri", "sehpa",
    "yemek-masasi-takimlari", "konsol-ve-vitrinler", "yemek-masalari", "sandalyeler",
    "yatak-odalari", "baza-ve-basliklar", "gardiroplar", "sifonyer-ve-komodinler"
  ];

  const categoryRoutes = [...categories, ...subCategories].map((cat) => ({
    url: `${baseUrl}/${cat}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  // 3. Aktif Mobilyalar
  const furnitures = await prisma.furniture.findMany({
    where: { isActive: true },
    select: { furnitureId: true, updatedAt: true },
  });

  const furnitureRoutes = furnitures.map((f) => ({
    url: `${baseUrl}/product-detail-furniture/${f.furnitureId}`,
    lastModified: f.updatedAt,
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  // 4. Aktif Takımlar
  const sets = await prisma.furnitureSet.findMany({
    where: { isActive: true },
    select: { setId: true, updatedAt: true },
  });

  const setRoutes = sets.map((s) => ({
    url: `${baseUrl}/product-detail-furniture-set/${s.setId}`,
    lastModified: s.updatedAt,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  return [...routes, ...categoryRoutes, ...furnitureRoutes, ...setRoutes];
}

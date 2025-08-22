import { products1 } from "@/data/products";

// Ana kategoriler ve alt kategoriler mapping'i
export const categoryMapping = {
  // Ana kategoriler
  'oturma-odasi': {
    name: 'Oturma Odası Takımları',
    type: 'main',
    subCategories: ['oturma-odasi-takimlari', 'uclu-koltuklar', 'kose-koltuklar', 'berjerler', 'tv-uniteleri', 'sehpalar']
  },
  'yemek-odasi': {
    name: 'Yemek Odası Takımları',
    type: 'main',
    subCategories: ['yemek-odasi-takimlari', 'yemek-masalari', 'konsol-vitrin']
  },
  'yatak-odasi': {
    name: 'Yatak Odası Takımları',
    type: 'main',
    subCategories: ['yatak-odasi-takimlari', 'yataklar', 'gardıroplar', 'komodinler', 'makyaj-masalari', 'sifonyer']
  },
  
  // Alt kategoriler
  'oturma-odasi-takimlari': {
    name: 'Oturma Odası Takımları',
    type: 'sub',
    parent: 'oturma-odasi'
  },
  'uclu-koltuklar': {
    name: 'Üçlü Koltuklar',
    type: 'sub',
    parent: 'oturma-odasi'
  },
  'kose-koltuklar': {
    name: 'Köşe Koltuklar',
    type: 'sub',
    parent: 'oturma-odasi'
  },
  'berjerler': {
    name: 'Berjerler',
    type: 'sub',
    parent: 'oturma-odasi'
  },
  'tv-uniteleri': {
    name: 'TV Üniteleri',
    type: 'sub',
    parent: 'oturma-odasi'
  },
  'sehpalar': {
    name: 'Sehpalar',
    type: 'sub',
    parent: 'oturma-odasi'
  },
  
  'yemek-odasi-takimlari': {
    name: 'Yemek Odası Takımları',
    type: 'sub',
    parent: 'yemek-odasi'
  },
  'yemek-masalari': {
    name: 'Yemek Masaları',
    type: 'sub',
    parent: 'yemek-odasi'
  },
  'konsol-vitrin': {
    name: 'Konsol ve Vitrinler',
    type: 'sub',
    parent: 'yemek-odasi'
  },
  
  'yatak-odasi-takimlari': {
    name: 'Yatak Odası Takımları',
    type: 'sub',
    parent: 'yatak-odasi'
  },
  'yataklar': {
    name: 'Yataklar',
    type: 'sub',
    parent: 'yatak-odasi'
  },
  'gardıroplar': {
    name: 'Gardıroplar',
    type: 'sub',
    parent: 'yatak-odasi'
  },
  'komodinler': {
    name: 'Komodinler',
    type: 'sub',
    parent: 'yatak-odasi'
  },
  'makyaj-masalari': {
    name: 'Makyaj Masaları',
    type: 'sub',
    parent: 'yatak-odasi'
  },
  'sifonyer': {
    name: 'Şifonyer',
    type: 'sub',
    parent: 'yatak-odasi'
  }
};

// Ana kategori için ürünleri getir (sadece o kategorinin main ürünleri)
export function getProductsByCategory(category) {
  console.log('Getting products by category:', category);
  
  const categoryInfo = categoryMapping[category];
  if (!categoryInfo) {
    console.log('Category not found:', category);
    return [];
  }

  if (categoryInfo.type === 'main') {
    // Ana kategori ise, sadece o kategorinin "takımlar" alt kategorisindeki ürünleri getir
    const mainSubCategory = categoryInfo.subCategories.find(sub => sub.includes('takimlari'));
    if (mainSubCategory) {
      const filteredProducts = products1.filter(product => {
        const productCategory = product.category || product.filterCategories?.[0] || 'other';
        return productCategory === mainSubCategory;
      });
      console.log(`Found ${filteredProducts.length} products for main category ${category} (${mainSubCategory})`);
      return filteredProducts;
    }
  }

  // Alt kategori ise direkt o kategorideki ürünleri getir
  const filteredProducts = products1.filter(product => {
    const productCategory = product.category || product.filterCategories?.[0] || 'other';
    return productCategory === category;
  });
  
  console.log(`Found ${filteredProducts.length} products for category ${category}`);
  return filteredProducts;
}

// Alt kategori için ürünleri getir
export function getProductsBySubCategory(subCategory) {
  console.log('Getting products by subcategory:', subCategory);
  
  const filteredProducts = products1.filter(product => {
    const productCategory = product.category || product.filterCategories?.[0] || 'other';
    return productCategory === subCategory;
  });
  
  console.log(`Found ${filteredProducts.length} products for subcategory ${subCategory}`);
  return filteredProducts;
}

// Ana kategori için ürünleri getir (alt kategorileri dahil etmeden)
export function getProductsByMainCategory(mainCategory) {
  console.log('Getting products by main category:', mainCategory);
  
  const categoryInfo = categoryMapping[mainCategory];
  if (!categoryInfo || categoryInfo.type !== 'main') {
    console.log('Main category not found:', mainCategory);
    return [];
  }

  // Sadece ana kategoriyi temsil eden "takımlar" alt kategorisindeki ürünleri getir
  const mainSubCategory = categoryInfo.subCategories.find(sub => sub.includes('takimlari'));
  if (mainSubCategory) {
    const filteredProducts = products1.filter(product => {
      const productCategory = product.category || product.filterCategories?.[0] || 'other';
      return productCategory === mainSubCategory;
    });
    console.log(`Found ${filteredProducts.length} products for main category ${mainCategory}`);
    return filteredProducts;
  }

  return [];
}

// Kategori bilgisi getir
export function getCategoryInfo(categorySlug) {
  return categoryMapping[categorySlug] || null;
}

// Tüm ana kategorileri getir
export function getMainCategories() {
  return Object.keys(categoryMapping).filter(key => categoryMapping[key].type === 'main');
}

// Belirli bir ana kategorinin alt kategorilerini getir
export function getSubCategories(mainCategory) {
  const categoryInfo = categoryMapping[mainCategory];
  if (categoryInfo && categoryInfo.type === 'main') {
    return categoryInfo.subCategories;
  }
  return [];
}

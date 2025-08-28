import { testFurnitureProducts, products1 } from "@/data/products";

// Ana kategoriler ve alt kategoriler mapping'i
export const categoryMapping = {
  // Ana kategoriler
  'oturma-odasi': {
    name: 'Oturma Odası',
    type: 'main',
    subCategories: ['uclu-koltuklar', 'ikili-koltuklar', 'kose-koltuklar', 'berjer-koltuklar', 'tv-uniteleri', 'sehpalar']
  },
  'yemek-odasi': {
    name: 'Yemek Odası',
    type: 'main',
    subCategories: ['yemek-masalari', 'yemek-sandalyeleri', 'konsol-vitrin']
  },
  'yatak-odasi': {
    name: 'Yatak Odası',
    type: 'main',
    subCategories: ['yataklar', 'gardiroplar', 'komodinler', 'makyaj-masalari', 'sifonyerler']
  },
  
  // Alt kategoriler - Oturma Odası
  'uclu-koltuklar': {
    name: 'Üçlü Koltuklar',
    type: 'sub',
    parent: 'oturma-odasi'
  },
  'ikili-koltuklar': {
    name: 'İkili Koltuklar',
    type: 'sub',
    parent: 'oturma-odasi'
  },
  'kose-koltuklar': {
    name: 'Köşe Koltuklar',
    type: 'sub',
    parent: 'oturma-odasi'
  },
  'berjer-koltuklar': {
    name: 'Berjer Koltuklar',
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
  
  // Alt kategoriler - Yemek Odası
  'yemek-masalari': {
    name: 'Yemek Masaları',
    type: 'sub',
    parent: 'yemek-odasi'
  },
  'yemek-sandalyeleri': {
    name: 'Yemek Sandalyeleri',
    type: 'sub',
    parent: 'yemek-odasi'
  },
  'konsol-vitrin': {
    name: 'Konsol ve Vitrinler',
    type: 'sub',
    parent: 'yemek-odasi'
  },
  
  // Alt kategoriler - Yatak Odası
  'yataklar': {
    name: 'Yataklar',
    type: 'sub',
    parent: 'yatak-odasi'
  },
  'gardiroplar': {
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
  'sifonyerler': {
    name: 'Şifonyerler',
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

  // Yeni sistemde testFurnitureProducts'tan filtrele
  if (categoryInfo.type === 'main') {
    // Ana kategori ise, o kategoriye ait tüm ürünleri getir
    const filteredProducts = testFurnitureProducts.filter(product => {
      const productCategory = product.category;
      // Ana kategori slug'ı ile başlayan kategoriler
      return productCategory && productCategory.includes(category);
    });
    console.log(`Found ${filteredProducts.length} products for main category ${category}`);
    return filteredProducts;
  }

  // Alt kategori ise direkt o kategorideki ürünleri getir
  const filteredProducts = testFurnitureProducts.filter(product => {
    const productCategory = product.category;
    return productCategory === category;
  });
  
  console.log(`Found ${filteredProducts.length} products for category ${category}`);
  return filteredProducts;
}

// Alt kategori için ürünleri getir
export function getProductsBySubCategory(subCategory) {
  console.log('Getting products by subcategory:', subCategory);
  
  // Yeni sistemde testFurnitureProducts'tan filtrele
  const filteredProducts = testFurnitureProducts.filter(product => {
    const productCategory = product.category;
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

  // Yeni sistemde ana kategoriye ait tüm ürünleri getir
  const filteredProducts = testFurnitureProducts.filter(product => {
    const productCategory = product.category;
    // Ana kategori slug'ı ile başlayan kategoriler
    return productCategory && productCategory.includes(mainCategory);
  });
  console.log(`Found ${filteredProducts.length} products for main category ${mainCategory}`);
  return filteredProducts;
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

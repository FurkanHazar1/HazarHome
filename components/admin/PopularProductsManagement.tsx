'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';

interface Product {
  id: number | string;
  title: string;
  price: number;
  imgSrc: string;
  type: 'furniture' | 'furniture_set';
  furnitureType: string;
  category: string;
  popularOrder: number;
  isPopular: boolean;
}

export default function PopularProductsManagement() {
  const [popularProducts, setPopularProducts] = useState<Product[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  // Fetch popular products
  const fetchPopularProducts = async () => {
    try {
      const res = await fetch('/api/products/popular?limit=0');
      const data = await res.json();
      if (data.success) {
        // Ensure image paths are processed correctly for the existing list
        const processed = data.data.map((p: any) => ({
          ...p,
          imgSrc: getImageUrl(p.imgSrc) || '/images/products/placeholder.jpg'
        }));
        setPopularProducts(processed);
      }
    } catch (error) {
      console.error('Error fetching popular products:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch popular products on mount
  useEffect(() => {
    fetchPopularProducts();
  }, []);

  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('');

  const getImageUrl = (path?: string) => {
    if (!path) return null;
    let cleanPath = path.replace(/\\/g, '/');
    if (cleanPath.startsWith('public/')) cleanPath = cleanPath.replace('public/', '');
    if (!cleanPath.startsWith('/')) cleanPath = '/' + cleanPath;
    if (!cleanPath.startsWith('/uploads/')) cleanPath = '/uploads/' + cleanPath.replace(/^\//, '');
    return cleanPath;
  };

  // Fetch categories on mount
  useEffect(() => {
    const fetchCats = async () => {
      try {
        const res = await fetch('/api/categories?includeHierarchy=true');
        const data = await res.json();
        if (data.success) {
          setCategories(data.data);
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };
    fetchCats();
  }, []);

  // Fetch products when category changes
  const fetchProductsByCategory = async (categoryId: string) => {
    if (!categoryId) {
      setAllProducts([]);
      return;
    }
    setIsSearching(true);
    try {
      // Fetch both furniture and sets for this category
      const [furnRes, setsRes] = await Promise.all([
        fetch(`/api/furniture?categoryId=${categoryId}&includeDetails=true`),
        fetch(`/api/furniture-sets?categoryId=${categoryId}&includeDetails=true`)
      ]);
      
      const furnData = await furnRes.json();
      const setsData = await setsRes.json();

      let combined: Product[] = [];
      
      if (furnData.success) {
        combined = combined.concat(furnData.data.map((f: any) => {
          // Sort images by sortOrder and get the first one
          const sortedImages = f.images ? [...f.images].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)) : [];
          const imagePath = sortedImages[0]?.image?.filePath;
          const imgSrc = getImageUrl(imagePath) || '/images/products/placeholder.jpg';

          return {
            id: f.furnitureId,
            title: f.furnitureName,
            price: Number(f.price),
            imgSrc,
            type: 'furniture',
            furnitureType: f.furnitureType,
            category: f.category?.categoryName || '',
            popularOrder: 9999,
            isPopular: f.isPopular
          };
        }));
      }

      if (setsData.success) {
        combined = combined.concat(setsData.data.map((s: any) => {
          // Sort set images by sortOrder and get the first one
          const sortedImages = s.furnitureSetImages ? [...s.furnitureSetImages].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)) : [];
          const imagePath = sortedImages[0]?.image?.filePath;
          const imgSrc = getImageUrl(imagePath) || '/images/products/placeholder.jpg';

          return {
            id: s.setId,
            title: s.setName,
            price: Number(s.price),
            imgSrc,
            type: 'furniture_set',
            furnitureType: 'Takım',
            category: s.category?.categoryName || '',
            popularOrder: 9999,
            isPopular: s.isPopular
          };
        }));
      }

      // Filter out those already in popular list
      const filtered = combined.filter((p) => 
        !popularProducts.some(pp => pp.id === p.id && pp.type === p.type)
      );
      setAllProducts(filtered);
    } catch (error) {
      console.error('Error fetching products by category:', error);
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    if (selectedCategory) {
      fetchProductsByCategory(selectedCategory);
    } else {
      setAllProducts([]);
    }
  }, [selectedCategory, popularProducts]); // Re-fetch when popular list changes to keep filter updated

  const togglePopularStatus = async (product: Product, status: boolean) => {
    try {
      const res = await fetch('/api/products/popular', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: product.id,
          type: product.type,
          isPopular: status,
          popularOrder: status ? popularProducts.length + 1 : null
        })
      });
      if (res.ok) {
        await fetchPopularProducts();
        setSearchQuery('');
        setAllProducts([]);
      }
    } catch (error) {
      console.error('Error toggling popular status:', error);
    }
  };

  const updateOrder = async (product: Product, newOrder: number) => {
    try {
      await fetch('/api/products/popular', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: product.id,
          type: product.type,
          popularOrder: newOrder
        })
      });
      // Don't wait for re-fetch to keep UI snappy, but do it in background
      fetchPopularProducts();
    } catch (error) {
      console.error('Error updating order:', error);
    }
  };

  const moveItem = (index: number, direction: 'up' | 'down') => {
    const newItems = [...popularProducts];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (targetIndex < 0 || targetIndex >= newItems.length) return;
    
    // Swap in state for instant feedback
    [newItems[index], newItems[targetIndex]] = [newItems[targetIndex], newItems[index]];
    
    // Update orders in state
    newItems[index].popularOrder = index + 1;
    newItems[targetIndex].popularOrder = targetIndex + 1;
    
    setPopularProducts(newItems);
    
    // Send updates to server
    updateOrder(newItems[index], index + 1);
    updateOrder(newItems[targetIndex], targetIndex + 1);
  };

  // Recursive options renderer for categories
  const renderCategoryOptions = (cats: any[], level = 0) => {
    return cats.map(cat => (
      <React.Fragment key={cat.categoryId}>
        <option value={cat.categoryId}>
          {'\u00A0'.repeat(level * 4)} {level === 0 ? '📂' : '↳'} {cat.categoryName}
        </option>
        {cat.children && renderCategoryOptions(cat.children, level + 1)}
      </React.Fragment>
    ));
  };

  return (
    <div className="min-h-screen bg-slate-900 p-6 sm:p-10">
      <div className="max-w-7xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Popüler Ürünler Yönetimi</h1>
          <p className="text-slate-400 mt-1">Ana sayfada gösterilecek popüler ürünleri ve sıralamasını yönetin.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Popular List */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              <span className="text-yellow-500">⭐</span> Mevcut Popüler Ürünler ({popularProducts.length})
            </h2>
            
            {loading ? (
              <div className="bg-slate-800 p-10 rounded-2xl text-center text-slate-400">Yükleniyor...</div>
            ) : popularProducts.length === 0 ? (
              <div className="bg-slate-800 p-10 rounded-2xl text-center text-slate-400 border border-dashed border-slate-700">
                Henüz popüler ürün seçilmedi. Sağdaki panelden ürün ekleyebilirsiniz.
              </div>
            ) : (
              <div className="space-y-3">
                {popularProducts.map((product, index) => (
                  <div key={`${product.type}-${product.id}`} className="bg-slate-800 border border-slate-700 rounded-xl p-4 flex items-center gap-4 group">
                    <div className="text-slate-500 font-mono w-6 text-center">{index + 1}</div>
                    <div className="w-16 h-16 relative rounded-lg overflow-hidden flex-shrink-0 bg-slate-900">
                      <Image 
                        src={product.imgSrc} 
                        alt={product.title} 
                        fill 
                        style={{ objectFit: 'cover' }}
                      />
                    </div>
                    <div className="flex-grow min-w-0">
                      <h3 className="text-white font-medium truncate">{product.title}</h3>
                      <div className="flex gap-2 mt-1">
                        <span className="text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded">
                          {product.type === 'furniture_set' ? 'Takım' : 'Mobilya'}
                        </span>
                        <span className="text-xs text-slate-500">{product.category}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex flex-col gap-1">
                        <button 
                          onClick={() => moveItem(index, 'up')}
                          disabled={index === 0}
                          className="p-1 hover:bg-slate-700 rounded text-slate-400 disabled:opacity-30"
                        >
                          ▲
                        </button>
                        <button 
                          onClick={() => moveItem(index, 'down')}
                          disabled={index === popularProducts.length - 1}
                          className="p-1 hover:bg-slate-700 rounded text-slate-400 disabled:opacity-30"
                        >
                          ▼
                        </button>
                      </div>
                      <button 
                        onClick={() => togglePopularStatus(product, false)}
                        className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg ml-2"
                        title="Listeden Çıkar"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right: Search & Add */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-white">Ürün Ekle</h2>
            <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 space-y-4 sticky top-6">
              <div className="relative">
                <label className="text-sm text-slate-400 block mb-2">Kategori Seçin</label>
                <select 
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 outline-none focus:border-purple-500 text-white appearance-none"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                >
                  <option value="">Kategori Seçiniz...</option>
                  {renderCategoryOptions(categories)}
                </select>
                <div className="absolute right-4 top-[42px] pointer-events-none text-slate-500">▼</div>
                
                {isSearching && (
                  <div className="absolute right-10 top-[42px]">
                    <div className="animate-spin h-5 w-5 border-2 border-purple-500 border-t-transparent rounded-full"></div>
                  </div>
                )}
              </div>

              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                {allProducts.length > 0 ? (
                  allProducts.map((product) => (
                    <div key={`${product.type}-${product.id}`} className="flex items-center gap-3 p-3 bg-slate-900/50 rounded-xl hover:bg-slate-900 transition border border-transparent hover:border-slate-600 group">
                      <div className="w-12 h-12 relative rounded-md overflow-hidden flex-shrink-0 bg-slate-800">
                        <Image 
                          src={product.imgSrc} 
                          alt={product.title} 
                          fill 
                          style={{ objectFit: 'cover' }}
                        />
                      </div>
                      <div className="flex-grow min-w-0">
                        <div className="text-sm text-white font-medium truncate">{product.title}</div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className={`text-[10px] px-1.5 py-0.5 rounded ${product.type === 'furniture_set' ? 'bg-pink-500/10 text-pink-400' : 'bg-indigo-500/10 text-indigo-400'}`}>
                            {product.type === 'furniture_set' ? 'Takım' : 'Mobilya'}
                          </span>
                        </div>
                      </div>
                      <button 
                        onClick={() => togglePopularStatus(product, true)}
                        className="p-2 bg-purple-600/20 text-purple-400 hover:bg-purple-600 hover:text-white rounded-lg transition"
                        title="Popüler Yap"
                      >
                        +
                      </button>
                    </div>
                  ))
                ) : selectedCategory ? (
                  <div className="text-center py-10 text-slate-500 text-sm">Bu kategoride eklenebilecek ürün bulunamadı.</div>
                ) : (
                  <div className="text-center py-10 text-slate-500 text-sm italic">Ürünleri listelemek için bir kategori seçin.</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

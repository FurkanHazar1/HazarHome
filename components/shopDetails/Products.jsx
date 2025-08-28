"use client";

import { products1 } from "@/data/products";
import { Swiper, SwiperSlide } from "swiper/react";
import { ProductCard } from "../shopCards/ProductCard";
import { Navigation, Pagination } from "swiper/modules";
import { useEffect, useState } from "react";

export default function Products({ categoryId, productId, productType = 'furniture' }) {
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // İlişkili ürünleri getiren fonksiyon
    const fetchRelatedProducts = async () => {
      try {
        setLoading(true);
        console.log("İlişkili ürünleri arıyor... ProductID:", productId);
        
        // Tüm aktif ürünleri getir (kategori filtrelemeden)
        let apiUrl = `/api/products?active=true&limit=12&includeDetails=true`;

        console.log("API çağrısı:", apiUrl);
        const response = await fetch(apiUrl);
        const data = await response.json();
        
        console.log("API yanıtı alındı:", data);
        
        if (data && data.data && Array.isArray(data.data)) {
          // Sadece mevcut ürünü filtrele (kategoriye bakmadan)
          const filteredProducts = data.data.filter(product => 
            String(product.id) !== String(productId)
          );
          
          console.log("İlişkili ürünler bulundu:", filteredProducts.length);
          
          // API'den dönen ürünleri ProductCard bileşeni formatına dönüştür
          const formattedProducts = filteredProducts.map(product => {
            // Görsel URL'lerini doğru formatta hazırla
            let imgSrc = product.imgSrc || '/images/products/placeholder.jpg';
            if (imgSrc && !imgSrc.startsWith('http') && !imgSrc.startsWith('/')) {
              imgSrc = `/${imgSrc}`;
            }
            
            let imgHoverSrc = product.imgHoverSrc || imgSrc;
            if (imgHoverSrc && !imgHoverSrc.startsWith('http') && !imgHoverSrc.startsWith('/')) {
              imgHoverSrc = `/${imgHoverSrc}`;
            }
            
            // Fiyatı sayısal formatta olduğundan emin ol
            const price = typeof product.price === 'number' ? product.price : 
                          parseFloat(product.price) || 0;
            
            return {
              id: product.id,
              imgSrc: imgSrc,
              imgHoverSrc: imgHoverSrc,
              title: product.title || product.furnitureName || product.setName,
              price: price,
              type: product.type || 'furniture',
              category: product.category?.categoryName || '',
              colors: product.colors || [],
              sizes: product.sizes || [],
              soldOut: !product.isActive
            };
          });
          
          setRelatedProducts(formattedProducts.slice(0, 8));
        } else {
          console.log("API doğru format yanıtlamadı, demo ürünlere geçiliyor");
          // API yanıt vermezse demo ürünleri kullan
          setRelatedProducts(products1.slice(0, 8));
        }
      } catch (error) {
        console.error("İlişkili ürünleri çekerken hata:", error);
        // Hata durumunda demo ürünleri göster
        setRelatedProducts(products1.slice(0, 8));
      } finally {
        setLoading(false);
      }
    };

    fetchRelatedProducts();
  }, [categoryId, productId]);

  if (loading) {
    return (
      <section className="flat-spacing-1 pt_0">
        <div className="container">
          <div className="flat-title">
            <span className="title">İlişkili Ürünler Yükleniyor...</span>
          </div>
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Yükleniyor...</span>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (relatedProducts.length === 0) {
    return null; // İlişkili ürün yoksa bu bölümü gösterme
  }

  return (
    <section className="flat-spacing-1 pt_0">
      <div className="container">
        <div className="flat-title">
          <span className="title">İlişkili Ürünler</span>
        </div>
        <div className="hover-sw-nav hover-sw-2">
          <Swiper
            dir="ltr"
            className="swiper tf-sw-product-sell wrap-sw-over"
            slidesPerView={4} // Equivalent to data-preview={4}
            spaceBetween={30} // Equivalent to data-space-lg={30}
            breakpoints={{
              1024: {
                slidesPerView: 4, // Equivalent to data-tablet={3}
              },
              640: {
                slidesPerView: 3, // Equivalent to data-tablet={3}
              },
              0: {
                slidesPerView: 2, // Equivalent to data-mobile={2}
                spaceBetween: 15, // Equivalent to data-space-md={15}
              },
            }}
            modules={[Navigation, Pagination]}
            navigation={{
              prevEl: ".snbp3070",
              nextEl: ".snbn3070",
            }}
            pagination={{ clickable: true, el: ".spd307" }}
          >
            {relatedProducts.map((product, i) => (
              <SwiperSlide key={i} className="swiper-slide">
                <ProductCard product={product} />
              </SwiperSlide>
            ))}
          </Swiper>
          <div className="nav-sw nav-next-slider nav-next-product box-icon w_46 round snbp3070">
            <span className="icon icon-arrow-left" />
          </div>
          <div className="nav-sw nav-prev-slider nav-prev-product box-icon w_46 round snbn3070">
            <span className="icon icon-arrow-right" />
          </div>
          <div className="sw-dots style-2 sw-pagination-product justify-content-center spd307" />
        </div>
      </div>
    </section>
  );
}

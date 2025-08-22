import Footer1 from "@/components/footers/Footer1";
import Header2 from "@/components/headers/Header4";
import Topbar1 from "@/components/headers/Topbar1";
import ShopDefault from "@/components/shop/ShopDefault";
import Subcollections from "@/components/shop/Subcollections";
import React from "react";
import { 
  oturmaOdasiCategories, 
  yemekOdasiCategories, 
  yatakOdasiCategories 
} from "@/data/menu";
import { notFound } from "next/navigation";

// Kategori mapping'i
const categoryMappings = {
  'oturma-odasi': {
    title: 'Oturma Odası Takımları',
    description: 'Oturma odası için en yeni ve şık mobilyalar',
    categories: oturmaOdasiCategories,
    mainCategory: 'oturma-odasi'
  },
  'yemek-odasi': {
    title: 'Yemek Odası Takımları',
    description: 'Yemek odası için en yeni ve şık mobilyalar',
    categories: yemekOdasiCategories,
    mainCategory: 'yemek-odasi'
  },
  'yatak-odasi': {
    title: 'Yatak Odası Takımları',
    description: 'Yatak odası için en yeni ve şık mobilyalar',
    categories: yatakOdasiCategories,
    mainCategory: 'yatak-odasi'
  }
};

// Alt kategoriler için mapping
const getSubCategoryMapping = () => {
  const subCategories = {};
  
  // Oturma odası alt kategorileri
  oturmaOdasiCategories.forEach(item => {
    const slug = item.href.replace('/', '');
    subCategories[slug] = {
      title: item.name,
      description: `${item.name} kategorisindeki tüm ürünler`,
      parentCategory: 'oturma-odasi',
      categoryData: item
    };
  });
  
  // Yemek odası alt kategorileri
  yemekOdasiCategories.forEach(item => {
    const slug = item.href.replace('/', '');
    subCategories[slug] = {
      title: item.name,
      description: `${item.name} kategorisindeki tüm ürünler`,
      parentCategory: 'yemek-odasi',
      categoryData: item
    };
  });
  
  // Yatak odası alt kategorileri
  yatakOdasiCategories.forEach(item => {
    const slug = item.href.replace('/', '');
    subCategories[slug] = {
      title: item.name,
      description: `${item.name} kategorisindeki tüm ürünler`,
      parentCategory: 'yatak-odasi',
      categoryData: item
    };
  });
  
  return subCategories;
};

export async function generateMetadata({ params }) {
  const { category } = await params;
  const categoryData = categoryMappings[category];
  const subCategoryData = getSubCategoryMapping()[category];
  
  if (categoryData) {
    return {
      title: `${categoryData.title} || HazarHome`,
      description: categoryData.description,
    };
  } else if (subCategoryData) {
    return {
      title: `${subCategoryData.title} || HazarHome`,
      description: subCategoryData.description,
    };
  }
  
  return {
    title: "Kategori Bulunamadı || HazarHome",
    description: "Aradığınız kategori bulunamadı",
  };
}

export default async function CategoryPage({ params }) {
  const { category } = await params;
  const categoryData = categoryMappings[category];
  const subCategoryData = getSubCategoryMapping()[category];
  
  console.log('=== DEBUG ===');
  console.log('Category:', category);
  console.log('CategoryData:', categoryData);
  console.log('SubCategoryData:', subCategoryData);
  console.log('Categories for subcollections (main):', categoryData?.categories);
  
  if (subCategoryData) {
    let parentCategories = null;
    if (subCategoryData.parentCategory === 'oturma-odasi') {
      parentCategories = oturmaOdasiCategories;
    } else if (subCategoryData.parentCategory === 'yemek-odasi') {
      parentCategories = yemekOdasiCategories;
    } else if (subCategoryData.parentCategory === 'yatak-odasi') {
      parentCategories = yatakOdasiCategories;
    }
    console.log('Parent categories for subcategory:', parentCategories);
  }
  
  // Ana kategori kontrolü
  if (categoryData) {
    return (
      <>
        <Topbar1 />
        <Header2 />
        <div className="tf-page-title">
          <div className="container-full">
            <div className="heading text-center">{categoryData.title}</div>
            <p className="text-center text-2 text_black-2 mt_5">
              {categoryData.description}
            </p>
          </div>
        </div>
        <Subcollections categories={categoryData.categories} />
        <ShopDefault category={categoryData.mainCategory} />
        <Footer1 />
      </>
    );
  }
  
  // Alt kategori kontrolü
  if (subCategoryData) {
    // Ana kategorinin tüm alt kategorilerini al
    let parentCategories = null;
    if (subCategoryData.parentCategory === 'oturma-odasi') {
      parentCategories = oturmaOdasiCategories;
    } else if (subCategoryData.parentCategory === 'yemek-odasi') {
      parentCategories = yemekOdasiCategories;
    } else if (subCategoryData.parentCategory === 'yatak-odasi') {
      parentCategories = yatakOdasiCategories;
    }
    
    return (
      <>
        <Topbar1 />
        <Header2 />
        <div className="tf-page-title">
          <div className="container-full">
            <div className="heading text-center">{subCategoryData.title}</div>
            <p className="text-center text-2 text_black-2 mt_5">
              {subCategoryData.description}
            </p>
          </div>
        </div>
        {/* Ana kategorinin tüm alt kategorilerini göster */}
        {parentCategories && <Subcollections categories={parentCategories} />}
        <ShopDefault 
          category={subCategoryData.parentCategory} 
          subCategory={category}
        />
        <Footer1 />
      </>
    );
  }
  
  // Kategori bulunamadıysa 404
  notFound();
}

// Static generation için desteklenen kategorileri export et
export async function generateStaticParams() {
  const allCategories = [];
  
  // Ana kategoriler
  Object.keys(categoryMappings).forEach(key => {
    allCategories.push({ category: key });
  });
  
  // Alt kategoriler
  const subCategories = getSubCategoryMapping();
  Object.keys(subCategories).forEach(key => {
    allCategories.push({ category: key });
  });
  
  return allCategories;
}

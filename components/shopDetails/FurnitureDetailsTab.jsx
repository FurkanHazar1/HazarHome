"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";

const tabs = [
  { title: "Açıklama", active: true },
  { title: "Özellikler", active: false },
  { title: "Bakım Bilgileri", active: false },

];

export default function FurnitureDetailsTab({ product }) {
  const [currentTab, setCurrentTab] = useState(1);

  if (!product) return null;

  // Dinamik tab listesi - eğer furniture_set ise takım içeriği tab'ı ekle
  const dynamicTabs = [
    { title: "Açıklama", active: true },
    { title: "Özellikler", active: false },
    ...(product.type === 'furniture_set' ? [{ title: "Takım İçeriği", active: false }] : []),
    { title: "Bakım Bilgileri", active: false },
  ];

  return (
    <section
      className="flat-spacing-17 pt_0"
      style={{ maxWidth: "100vw", overflow: "clip" }}
    >
      <div className="container">
        <div className="row">
          <div className="col-12">
            <div className="widget-tabs style-has-border">
              <ul className="widget-menu-tab">
                {dynamicTabs.map((elm, i) => (
                  <li
                    key={i}
                    onClick={() => setCurrentTab(i + 1)}
                    className={`item-title ${
                      currentTab == i + 1 ? "active" : ""
                    } `}
                  >
                    <span className="inner">{elm.title}</span>
                  </li>
                ))}
              </ul>
              <div className="widget-content-tab">
                {/* Açıklama Tab */}
                <div
                  className={`widget-content-inner ${
                    currentTab == 1 ? "active" : ""
                  } `}
                >
                  <div className="">
                    <h3 className="fs-20 fw-6 mb_20">{product.title}</h3>
                    <p className="mb_30">
                      {product.description || "Bu ürün hakkında detaylı bilgi yakında eklenecektir."}
                    </p>
                    
                    {/* Ürün Özellikleri Özet */}
                    <div className="tf-product-des-demo">
                      <div className="right">
                        <h4 className="fs-16 fw-6 mb_15">Temel Özellikler</h4>
                        <ul className="mb_20">
                          {product.features?.map((feature, index) => (
                            <li key={index}>{feature}</li>
                          )) || (
                            <>
                              <li>Yüksek kalite malzeme</li>
                              <li>Dayanıklı yapı</li>
                              <li>Modern tasarım</li>
                            </>
                          )}
                        </ul>
                        
                        {/* Mevcut Renkler */}
                        {product.colors && product.colors.length > 0 && (
                          <div className="mb_20">
                            <h4 className="fs-16 fw-6 mb_15">Mevcut Renkler</h4>
                            <div className="d-flex gap-10 flex-wrap">
                              {product.colors.map((color, index) => (
                                <div key={color.id || color.value || index} className="color-option d-flex align-items-center gap-8 p-2 border rounded">
                                  {color.code && (
                                    <div 
                                      className="color-swatch"
                                      style={{
                                        width: '24px',
                                        height: '24px',
                                        backgroundColor: color.code,
                                        border: '2px solid #ddd',
                                        borderRadius: '4px'
                                      }}
                                    />
                                  )}
                                  <span className="fw-5">{color.name}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <div className="left">
                        <h4 className="fs-16 fw-6 mb_15">Hızlı Bilgiler</h4>
                        <div className="quick-info">
                          <div className="info-item mb_10">
                            <span className="label fw-6">Marka:</span>
                            <span className="value ms-2">{product.brand || "HazarHome"}</span>
                          </div>
                          <div className="info-item mb_10">
                            <span className="label fw-6">Malzeme:</span>
                            <span className="value ms-2">{product.material || "Yüksek kalite malzeme"}</span>
                          </div>
                          {product.dimensions && (
                            <div className="info-item mb_10">
                              <span className="label fw-6">Boyutlar:</span>
                              <span className="value ms-2">{product.dimensions}</span>
                            </div>
                          )}
                          <div className="info-item mb_10">
                            <span className="label fw-6">Garanti:</span>
                            <span className="value ms-2">{product.warranty || "2 Yıl Üretici Garantisi"}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Özellikler Tab */}
                <div
                  className={`widget-content-inner ${
                    currentTab == 2 ? "active" : ""
                  } `}
                >
                  <div className="tf-product-specifications">
                    <h3 className="fs-20 fw-6 mb_20">Detaylı Ürün Özellikleri</h3>
                    <table className="tf-pr-attrs">
                      <tbody>
                        {/* Kategori Bilgileri */}
                        <tr className="tf-attr-pa-category">
                          <th className="tf-attr-label">Kategori</th>
                          <td className="tf-attr-value">
                            <p>{product.category?.categoryName || product.categorySlug || 'Kategori Belirtilmemiş'}</p>
                          </td>
                        </tr>
                        
                        <tr className="tf-attr-pa-brand">
                          <th className="tf-attr-label">Marka</th>
                          <td className="tf-attr-value">
                            <p>{product.brand || "HazarHome"}</p>
                          </td>
                        </tr>
                        
                        <tr className="tf-attr-pa-type">
                          <th className="tf-attr-label">Ürün Tipi</th>
                          <td className="tf-attr-value">
                            <p>{product.type === 'furniture_set' ? 'Mobilya Takımı' : 'Tekil Mobilya'}</p>
                          </td>
                        </tr>
                        
                        {/* Mevcut Renkler */}
                        {product.colors && product.colors.length > 0 && (
                          <tr className="tf-attr-pa-colors">
                            <th className="tf-attr-label">Renkler</th>
                            <td className="tf-attr-value">
                              <div className="colors-list">
                                {product.colors.map((color, index) => (
                                  <div key={color.id || color.value || index} className="color-item d-flex align-items-center gap-10 mb_10">
                                    {color.code && (
                                      <div 
                                        className="color-preview"
                                        style={{
                                          width: '30px',
                                          height: '30px',
                                          backgroundColor: color.code,
                                          border: '2px solid #ddd',
                                          borderRadius: '6px'
                                        }}
                                      />
                                    )}
                                    <div className="color-info">
                                      <div className="color-name fw-6">{color.name}</div>
                                      
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </td>
                          </tr>
                        )}
                        
                        {/* Boyutlar */}
                        {product.sizes && product.sizes.length > 0 && (
                          <tr className="tf-attr-pa-sizes">
                            <th className="tf-attr-label">Mevcut Boyutlar</th>
                            <td className="tf-attr-value">
                              <div className="sizes-list">
                                {product.sizes.map((size, index) => (
                                  <div key={size.id || size.value || index} className="size-item p-2 border rounded mb_10 d-inline-block me-2">
                                    <span className="fw-6">{size.value}</span>
                                    <span className={`status-badge ms-2 ${size.isAvailable ? 'text-success' : 'text-danger'}`}>
                                      {size.isAvailable ? '✓' : '✗'}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </td>
                          </tr>
                        )}
                        
                        {/* Ölçüler */}
                        {product.dimensions && (
                          <tr className="tf-attr-pa-dimensions">
                            <th className="tf-attr-label">Ürün Ölçüleri</th>
                            <td className="tf-attr-value">
                              <p className="fw-6">{product.dimensions}</p>
                            </td>
                          </tr>
                        )}
                        
                        {/* Malzeme */}
                        {product.material && (
                          <tr className="tf-attr-pa-material">
                            <th className="tf-attr-label">Malzeme Bilgisi</th>
                            <td className="tf-attr-value">
                              <p>{product.material}</p>
                            </td>
                          </tr>
                        )}
                        
                        {/* Detaylı Özellikler - Veritabanından */}
                        {((product.properties && product.properties.length > 0) || 
                          (product.propertiesByType && Object.keys(product.propertiesByType).length > 0)) && (
                          <>
                            {/* Eğer properties array varsa onu kullan */}
                            {product.properties && product.properties.length > 0 ? (
                              product.properties.map((property, index) => (
                                <tr key={`property-${property.name || property.propertyName}-${index}`} className="tf-attr-pa-property">
                                  <th className="tf-attr-label">{property.name || property.propertyName}</th>
                                  <td className="tf-attr-value">
                                    <p>{property.value || property.propertyValue}</p>
                                  </td>
                                </tr>
                              ))
                            ) : (
                              /* Eğer propertiesByType varsa onu kullan */
                              product.propertiesByType && Object.entries(product.propertiesByType).map(([type, properties]) => 
                                properties.map((property, index) => (
                                  <tr key={`${type}-${property.propertyName}-${index}`} className="tf-attr-pa-property">
                                    <th className="tf-attr-label">{property.propertyName}</th>
                                    <td className="tf-attr-value">
                                      <p>{property.propertyValue}</p>
                                    </td>
                                  </tr>
                                ))
                              )
                            )}
                          </>
                        )}
                        
                        {/* Detaylı Özellikler */}
                        {product.properties && product.properties.length > 0 && (
                          product.properties.map((property, index) => (
                            <tr key={`property-${property.name}-${index}`} className="tf-attr-pa-property">
                              <th className="tf-attr-label">{property.name}</th>
                              <td className="tf-attr-value">
                                <p>{property.value}</p>
                              </td>
                            </tr>
                          ))
                        )}
                        
                        {/* Garanti */}
                        <tr className="tf-attr-pa-warranty">
                          <th className="tf-attr-label">Garanti Süresi</th>
                          <td className="tf-attr-value">
                            <p className="fw-6 text-success">{product.warranty || "2 Yıl Üretici Garantisi"}</p>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Takım İçeriği Tab (sadece furniture_set için) */}
                {product.type === 'furniture_set' && (
                  <div
                    className={`widget-content-inner ${
                      currentTab == 3 ? "active" : ""
                    } `}
                  >
                    <div className="furniture-set-items">
                      <h3 className="fs-20 fw-6 mb_20">Takım İçindeki Mobilyalar</h3>
                      
                      {product.setItems && product.setItems.length > 0 ? (
                        <>
                          <div className="set-overview mb_30">
                            <div className="row">
                              <div className="col-md-6">
                                <div className="info-card bg-light p-3 rounded">
                                  <h4 className="fs-16 fw-6 mb-2">Takım Bilgileri</h4>
                                  <p><strong>Toplam Parça:</strong> {product.setItems.length} adet</p>
                                  {/* Price and total value removed */}
                                </div>
                              </div>
                              {/* Advantage card removed */}
                            </div>
                          </div>
                          
                          <div className="set-items-detailed">
                            {product.setItems.map((item, index) => (
                              <div key={item.furnitureId || item.name || index} className="set-item-card border rounded p-4 mb-4">
                                <div className="row">
import Image from "next/image"; // Add import at the top if missing, but it is better to be safe. Since I cannot see imports easily in one go, I will assume Image is not imported or import it. Wait, checking file content again. Image is NOT imported.

// ... rest of imports

// Inside the component:
                                  <div className="col-md-3">
                                    {item.image && (
                                      <div style={{ position: 'relative', width: '100%', height: '150px' }}>
                                        <Image 
                                          src={item.image} 
                                          alt={item.name}
                                          fill
                                          className="rounded"
                                          style={{ objectFit: 'cover' }}
                                          unoptimized={true}
                                        />
                                      </div>
                                    )}
                                  </div>
                                  <div className="col-md-9">
                                    <div className="item-details">
                                      <div className="d-flex justify-content-between align-items-start mb-3">
                                        <div>
                                          <h4 className="fs-18 fw-6 mb-1">{item.name}</h4>
                                          <div className="item-meta">
                                            <span className="badge bg-primary me-2">x{item.quantity} Adet</span>
                                            {/* Item price information removed */}
                                          </div>
                                        </div>
                                        {item.individualLink && (
                                          <a href={item.individualLink} className="btn btn-outline-primary btn-sm">
                                            <i className="icon-eye me-1"></i>
                                            Detayları Gör
                                          </a>
                                        )}
                                      </div>
                                      
                                      {item.description && (
                                        <p className="item-description text-muted mb-3">{item.description}</p>
                                      )}
                                      
                                      {item.properties && item.properties.length > 0 && (
                                        <div className="item-properties">
                                          <h5 className="fs-14 fw-6 mb-2">Özellikler:</h5>
                                          <div className="row">
                                            {item.properties.map((prop, propIndex) => (
                                              <div key={`${item.furnitureId || item.name}-${prop.name}-${propIndex}`} className="col-md-6 mb-2">
                                                <div className="property-item">
                                                  <span className="property-label fw-6">{prop.name}:</span>
                                                  <span className="property-value ms-2">{prop.value}</span>
                                                </div>
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                          
                          <div className="set-benefits bg-light p-4 rounded">
                            <h4 className="fs-16 fw-6 mb-3">Takım Satın Almanın Avantajları</h4>
                            <div className="row">
                              <div className="col-md-6">
                                <ul className="benefits-list">
                                  <li><i className="icon-check text-success me-2"></i>Uyumlu tasarım garantisi</li>
                                  <li><i className="icon-check text-success me-2"></i>Önemli maliyet avantajı</li>
                                  <li><i className="icon-check text-success me-2"></i>Tek seferde teslim</li>
                                </ul>
                              </div>
                              <div className="col-md-6">
                                <ul className="benefits-list">
                                  <li><i className="icon-check text-success me-2"></i>Profesyonel kurulum hizmeti</li>
                                  <li><i className="icon-check text-success me-2"></i>Tüm parçalar için tek garanti</li>
                                  <li><i className="icon-check text-success me-2"></i>Ücretsiz kargo</li>
                                </ul>
                              </div>
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="no-items text-center py-5">
                          <i className="icon-package display-1 text-muted mb-3"></i>
                          <h4>Takım İçeriği Bilgisi Bulunamadı</h4>
                          <p className="text-muted">Bu takımın içeriği hakkında detaylı bilgi yakında eklenecektir.</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Bakım Bilgileri Tab */}
                <div
                  className={`widget-content-inner ${
                    currentTab == (product.type === 'furniture_set' ? 4 : 3) ? "active" : ""
                  } `}
                >
                  <div className="care-instructions">
                    <h3 className="fs-20 fw-6 mb_20">Bakım ve Kullanım Talimatları</h3>
                    
                    <div className="care-content">
                      <div className="care-main mb_30">
                        <h4 className="fs-16 fw-6 mb_15">Genel Bakım Bilgisi</h4>
                        <p className="mb_20">{product.care || "Ürününüzün uzun ömürlü olması için düzenli bakım yapınız."}</p>
                      </div>
                      
                      <div className="care-instructions-list">
                        <h4 className="fs-16 fw-6 mb_15">Detaylı Bakım Adımları</h4>
                        {product.careInstructions?.map((instruction, index) => (
                          <div key={`care-${index}-${instruction.substring(0, 20)}`} className="care-step d-flex gap-15 mb_20 align-items-start">
                            <div className="step-number bg-primary text-white rounded-circle d-flex align-items-center justify-content-center" style={{minWidth: '30px', height: '30px', fontSize: '14px', fontWeight: '600'}}>
                              {index + 1}
                            </div>
                            <div className="step-content">
                              <p className="mb-0">{instruction}</p>
                            </div>
                          </div>
                        )) || (
                          <>
                            <div className="care-step d-flex gap-15 mb_20 align-items-start">
                              <div className="step-icon">
                                <i className="icon-machine text-primary" style={{fontSize: '24px'}} />
                              </div>
                              <div className="step-content">
                                <h5 className="fs-14 fw-6">Düzenli Temizlik</h5>
                                <p>Haftada bir kez yumuşak bez ile temizleyiniz.</p>
                              </div>
                            </div>
                            <div className="care-step d-flex gap-15 mb_20 align-items-start">
                              <div className="step-icon">
                                <i className="icon-sun text-warning" style={{fontSize: '24px'}} />
                              </div>
                              <div className="step-content">
                                <h5 className="fs-14 fw-6">Güneş Koruması</h5>
                                <p>Doğrudan güneş ışığından koruyunuz.</p>
                              </div>
                            </div>
                            <div className="care-step d-flex gap-15 mb_20 align-items-start">
                              <div className="step-icon">
                                <i className="icon-droplet text-info" style={{fontSize: '24px'}} />
                              </div>
                              <div className="step-content">
                                <h5 className="fs-14 fw-6">Nem Koruması</h5>
                                <p>Aşırı nemli ortamlardan uzak tutunuz.</p>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                      
                      <div className="warranty-info bg-light p-3 rounded mt_30">
                        <h4 className="fs-16 fw-6 mb_10">Garanti Bilgileri</h4>
                        <p className="mb_10"><strong>Garanti Süresi:</strong> {product.warranty || "2 Yıl Üretici Garantisi"}</p>
                        <p className="mb-0 text-muted">Garanti kapsamında olmayan durumlar: Yanlış kullanım, dış etkenler ve normal aşınma.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

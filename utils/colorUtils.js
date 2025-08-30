// Renk adlarını hex kodlara çeviren mapping
export const colorNameToHex = {
  'Beyaz': '#FFFFFF',
  'Siyah': '#000000',
  'Kırmızı': '#FF0000',
  'Mavi': '#0000FF',
  'Yeşil': '#008000',
  'Sarı': '#FFFF00',
  'Turuncu': '#FFA500',
  'Mor': '#800080',
  'Pembe': '#FFC0CB',
  'Gri': '#808080',
  'Kahverengi': '#A52A2A',
  'Lacivert': '#000080',
  'Bej': '#F5F5DC',
  'Krem': '#F5F5DC',
  'Açık Gri': '#D3D3D3',
  'Koyu Gri': '#696969',
  'Turkuaz': '#40E0D0',
  'Bordo': '#800020',
  'Füme': '#6C6C6C'
};

/**
 * Renk objesinden hex kod değeri döndürür
 * @param {Object} color - Renk objesi (code, name, value alanları olabilir)
 * @returns {string} - Hex renk kodu
 */
export const getColorHex = (color) => {
  if (!color) return '#CCCCCC';
  
  // Öncelik sırası: code -> name mapping -> value mapping -> varsayılan
  return color.code || 
         colorNameToHex[color.name] || 
         colorNameToHex[color.value] || 
         '#CCCCCC';
};

/**
 * Renk adından hex kod döndürür
 * @param {string} colorName - Renk adı
 * @returns {string} - Hex renk kodu
 */
export const getColorHexByName = (colorName) => {
  return colorNameToHex[colorName] || '#CCCCCC';
};

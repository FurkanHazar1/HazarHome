import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { productName, category, type, properties, setContent, color } = body;

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: 'API Key eksik.' },
        { status: 500 }
      );
    }

    // Prompt'u tek bir metin bloğu olarak birleştiriyoruz (En güvenli yöntem)
    const prompt = `
    Sen profesyonel bir mobilya satış ve pazarlama uzmanısın. Aşağıdaki bilgilere dayanarak bu ürün için SEO uyumlu, dikkat çekici, müşteriyi satın almaya teşvik eden ve duygusal bağ kuran Türkçe bir ürün açıklaması yaz.

    Ürün Bilgileri:
    - Ürün Adı: ${productName}
    - Kategori: ${category}
    - Ürün Tipi: ${type === 'furniture_set' ? 'Mobilya Takımı' : 'Tekil Mobilya'}
    ${color ? `- Renk: ${color}` : ''}
    ${properties && properties.length > 0 ? `- Özellikler: ${properties.join(', ')}` : ''}
    ${setContent ? `- Takım İçeriği: ${setContent}` : ''}

    İstekler:
    1. Açıklama 3 cümleden oluşsun.
    2. Yazım dili samimi, kaliteli ve güven verici olsun.
    3. Ürünün özelliklerini faydaya dönüştürerek anlat.
    `;

    const genAI = new GoogleGenerativeAI(apiKey);

    // 'gemini-1.5-flash' en kararlı modeldir. Önce bununla test edelim.
    const model = genAI.getGenerativeModel({ model: 'gemini-3-flash-preview' });

    console.log('Gemini API isteği gönderiliyor...');
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
      
    // Temizlik
    const cleanText = text.replace(/```html|```/g, '').trim();
    
    return NextResponse.json({ success: true, description: cleanText });

  } catch (error: any) {
    console.error('Gemini API Hatası:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Bir hata oluştu',
        details: 'Lütfen aistudio.google.com adresinden yeni bir API anahtarı alıp .env dosyasına ekleyin.'
      },
      { status: 500 }
    );
  }
}
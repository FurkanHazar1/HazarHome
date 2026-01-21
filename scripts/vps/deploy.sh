#!/bin/bash

# Hata durumunda dur
set -e

echo "=== HazarHome Dağıtım Başlatılıyor ==="

# 1. En son değişiklikleri çek
echo "Git pull yapılıyor..."
git pull

# 2. Bağımlılıkları yükle
echo "Paketler yükleniyor..."
npm ci

# 3. Prisma Client'ı oluştur
echo "Veritabanı şeması güncelleniyor..."
npx prisma generate

# 4. Projeyi derle
echo "Next.js projesi derleniyor..."
npm run build

# 5. Uygulamayı yeniden başlat (Sıfır kesinti için reload, eğer olmuyorsa restart)
echo "PM2 yeniden başlatılıyor..."
pm2 reload hazarhome || pm2 restart hazarhome

echo "=== Dağıtım Başarıyla Tamamlandı! ==="

#!/bin/bash

# Renkler
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== HazarHome VPS Kurulum Sihirbazı Başlıyor ===${NC}"

# 1. Sistemi Güncelle
echo -e "${YELLOW}[1/6] Sistem paketleri güncelleniyor...${NC}"
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git unzip ufw build-essential libssl-dev

# 2. Node.js Kurulumu (LTS v20)
echo -e "${YELLOW}[2/6] Node.js v20 kuruluyor...${NC}"
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm install -g pm2

# 3. Nginx Kurulumu
echo -e "${YELLOW}[3/6] Nginx Web Sunucusu kuruluyor...${NC}"
sudo apt install -y nginx

# 4. Güvenlik Duvarı (Firewall) Ayarları
echo -e "${YELLOW}[4/6] Firewall ayarlanıyor (SSH, HTTP, HTTPS)...${NC}"
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
echo "y" | sudo ufw enable

# 5. Proje Bağımlılıkları
echo -e "${YELLOW}[5/6] Proje bağımlılıkları yükleniyor...${NC}"
# Scriptin çalıştırıldığı yer proje kök dizini varsayılır
npm install --legacy-peer-deps
npx prisma generate
npm run build

# 6. PM2 Başlatma
echo -e "${YELLOW}[6/6] Uygulama başlatılıyor...${NC}"
pm2 start npm --name "hazarhome" -- start
pm2 save
pm2 startup

echo -e "${GREEN}=== Kurulum Tamamlandı! ===${NC}"
echo -e "${YELLOW}Şimdi Nginx ayarını yapmak için şu komutu çalıştırın:${NC}"
echo "sudo nano /etc/nginx/sites-available/default"

# 📖 OKUTTUR — Modern Light Novel Okuma Platformu

OKUTTUR, hafif roman (Light Novel) tutkunları için tasarlanmış, hız ve kullanıcı deneyimi odaklı, modern ve karanlık tema tabanlı bir okuma platformudur.

![Version](https://img.shields.io/badge/version-2.3.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)
![Tailwind](https://img.shields.io/badge/Tailwind-v4-38B2AC?logo=tailwind-css)

## ✨ Özellikler

- **🚀 Üstün Performans:** JSON API önbellekleme sistemi sayesinde veriler anında yüklenir.
- **🌙 Göz Dostu Tasarım:** Varsayılan olarak gelen derin karanlık tema ve özelleştirilebilir renk paleti.
- **📱 Her Cihazda Kusursuz:** Mobil, tablet ve masaüstü sistemlere tam uyumlu responsive arayüz.
- **🔄 Bulut Senkronizasyonu:** Supabase entegrasyonu ile okuma geçmişiniz tüm cihazlarınızda senkronize.
- **🛠️ Kişiselleştirilebilir Okuyucu:** Yazı boyutu ve yazı tipi (Lexend, Inter, Serif, Mono) seçenekleri.
- **💬 Giscus Tartışma Sistemi:** Her bölüm için GitHub tabanlı yorum ve tartışma alanı.
- **🤖 AI Destekli Altyapı:** Google AI Studio üzerinde geliştirilmiş optimize kod yapısı.

## 🛠️ Teknolojiler

- **Frontend:** React 19, TypeScript, Vite
- **Styling:** Tailwind CSS v4, Motion (Animasyonlar)
- **Backend/Auth:** Supabase
- **Hosting:** Firebase Hosting
- **CI/CD:** GitHub Actions (Otomatik Deploy)
- **İkonlar:** Lucide React

## 🚀 Başlangıç

Projeyi yerel ortamınızda çalıştırmak için:

1. Bağımlılıkları yükleyin:
   ```bash
   npm install
   ```

2. Geliştirme sunucusunu başlatın:
   ```bash
   npm run dev
   ```

3. Üretim (production) derlemesi oluşturun:
   ```bash
   npm run build
   ```

## 🔐 Ortam Değişkenleri

Senkronizasyon özelliğinin çalışması için aşağıdaki değişkenlerin `.env` dosyasında tanımlanması gerekir:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 📦 Dağıtım (Deployment)

Proje, ana branch'e (`main`) yapılan her push işleminde otomatik olarak Firebase Hosting'e (`okuttur`) dağıtılır. Bu işlem GitHub Actions kullanılarak gerçekleştirilir.

---

&copy; 2026 OKUTTUR • Made with ❤️ by AI DeepMind

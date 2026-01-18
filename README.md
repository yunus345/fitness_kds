# fitness_kds
# Fitness Karar Destek Sistemi (KDS)

Bu proje, bir spor salonunun operasyonel süreçlerini yönetmek ve yöneticilere veriye dayalı karar destek mekanizmaları sunmak amacıyla geliştirilmiş, **Node.js Express** tabanlı bir web uygulamasıdır. Proje, katı bir **MVC (Model-View-Controller)** mimarisi üzerine inşa edilmiştir.

## 🚀 Proje Özellikleri ve KDS Senaryoları
1. **Salon Yoğunluk Yönetimi:** Sistem, aktif katılım kayıtlarını anlık olarak analiz eder. Eğer salon kapasitesi (%100) dolmuşsa, yöneticileri uyarır ve yeni giriş kayıtlarını bu doluluk oranına göre raporlar.
2. **Müşteri Kayıp (Churn) ve İptal Analizi:** Üyelik sözleşmeleri üzerinde iptal nedeni analizi yaparak, hangi paketlerin neden daha fazla iptal edildiğini raporlar. İptal nedeni belirtilmemiş pasif sözleşmeleri "Analiz Bekliyor" olarak işaretler.

## 📂 Klasör Yapısı (MVC)
Proje, modülerlik ve sürdürülebilirlik için aşağıdaki yapıda düzenlenmiştir:
- `controllers/`: İş mantığının ve SQL sorgu sonuçlarının işlendiği katman.
- `models/`: Veritabanı bağlantısı ve şemaların bulunduğu katman.
- `routers/`: API uç noktalarının (endpoints) tanımlandığı katman.
- `public/`: Frontend dosyaları (HTML, CSS, istemci tarafı JS).
- `server.js`: Uygulamanın giriş noktası ve konfigürasyonu.

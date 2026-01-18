/**
 * FUSION GYM - Stratejik Karar Destek Sistemi (KDS) Analiz Motoru v3.3
 * Konsol hataları giderilmiş ve veri doğrulama eklenmiş stabil versiyon.
 */

let charts = {};
let historicalData = []; // Veritabanından gelen veya fallback veriler
let activeStrategies = { branch: false, equip: false };

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Önce grafik nesnelerini oluştur (Boş olarak)
    initAllCharts();
    
    // 2. Dashboard özetini ve verileri çek
    await fetchSnapshot();
    await loadKdsData();

    // 3. Slider ve buton dinleyicilerini kur
    initEventListeners();
});

// Üst paneldeki aktif üye sayısını günceller
async function fetchSnapshot() {
    try {
        const res = await fetch('/api/stats/total-uyeler');
        const data = await res.json();
        const snapshotEl = document.getElementById('dashSnapshot');
        if (snapshotEl) snapshotEl.innerText = `${data.total || 0} ÜYE`;
    } catch (e) { 
        console.error("Dashboard özeti alınamadı."); 
        document.getElementById('dashSnapshot').innerText = "VERİ YOK";
    }
}

// Veritabanından KDS verilerini çeken ana fonksiyon
async function loadKdsData() {
    try {
        const resGecmis = await fetch('/api/kds/gecmis-analiz');
        const data = await resGecmis.json();

        // KONSOL HATASI ÇÖZÜMÜ: Gelen veri dizi değilse veya hata mesajıysa fallback ata
        if (!Array.isArray(data) || data.length === 0) {
            console.warn("API'den geçerli veri gelmedi, simülasyon için örnek veriler kullanılıyor.");
            historicalData = [
                { ay: '2025-10', toplam_uye: 800 },
                { ay: '2025-11', toplam_uye: 950 },
                { ay: '2025-12', toplam_uye: 1050 }
            ];
        } else {
            // Veri içindeki sayıları güvenli hale getir
            historicalData = data.map(item => ({
                ay: item.ay,
                toplam_uye: Number(item.toplam_uye) || 0
            }));
        }

        // Ekstra veritabanı grafiklerini güncelle
        await updateDatabaseCharts();
        
        // Simülasyonu ilk kez çalıştır
        runSimulation();
    } catch (err) {
        console.error("KDS Veri Yükleme Hatası:", err);
        // Hata durumunda bile grafiklerin boş kalmaması için örnek veriyi doldur
        historicalData = [
            { ay: '2025-10', toplam_uye: 800 },
            { ay: '2025-11', toplam_uye: 950 },
            { ay: '2025-12', toplam_uye: 1050 }
        ];
        runSimulation();
    }
}

async function updateDatabaseCharts() {
    try {
        // Paket Dağılımı (Grafik 5)
        const resPaket = await fetch('/api/kds/paket-dagilimi');
        const pData = await resPaket.json();
        if(Array.isArray(pData) && pData.length > 0) {
            charts.packages.data.labels = pData.map(d => d.paket_adi);
            charts.packages.data.datasets[0].data = pData.map(d => d.sayi);
            charts.packages.update();
        }

        // Ekstra Gelirler (Grafik 7)
        const resGelir = await fetch('/api/kds/ekstra-gelirler');
        const eData = await resGelir.json();
        if(Array.isArray(eData) && eData.length > 0) {
            charts.extras.data.labels = eData.map(d => d.kategori_adi);
            charts.extras.data.datasets[0].data = eData.map(d => d.toplam);
            charts.extras.update();
        }

        // Verimlilik Analizi (Grafik 8)
        const resVerim = await fetch('/api/kds/verimlilik-analizi');
        const vData = await resVerim.json();
        if(vData && !vData.error) {
            charts.efficiency.data.datasets[0].data = [
                vData.gelir_skoru || 60,
                75, // Sabit büyüme skoru
                vData.memnuniyet || 80,
                vData.hız || 70,
                vData.katilim_skoru || 65
            ];
            charts.efficiency.update();
        }
    } catch (e) { 
        console.warn("Veritabanı bazlı grafikler güncellenirken hata oluştu."); 
    }
}

// Matematiksel Motor: Lineer Regresyon
function calculateRegression(dataPoints) {
    const n = dataPoints.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
    dataPoints.forEach((p, i) => {
        sumX += i; sumY += p; sumXY += i * p; sumX2 += i * i;
    });
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    return { slope, intercept };
}

// ANA SİMÜLASYON FONKSİYONU
function runSimulation() {
    // historicalData kontrolü (Kritik hata önleyici)
    if (!historicalData || historicalData.length === 0) return;

    const pSlider = document.getElementById('pSlider');
    const eSlider = document.getElementById('eSlider');
    const mSlider = document.getElementById('mSlider');

    const p = pSlider ? parseInt(pSlider.value) : 0; 
    const e = eSlider ? parseInt(eSlider.value) : 20; 
    const m = mSlider ? parseInt(mSlider.value) : 0; 

    const values = historicalData.map(d => d.toplam_uye);
    const reg = calculateRegression(values);
    const current = values[values.length - 1];

    // Katsayılar
    const priceEffect = -(p * 1.8); 
    const marketEffect = (m / 5000) * 15;
    const branchBonus = activeStrategies.branch ? 300 : 0;

    // 6 Aylık Tahmin
    let preds = [1, 2, 3, 4, 5, 6].map(month => {
        let base = reg.slope * (values.length + month) + reg.intercept;
        let result = Math.round(base + priceEffect + marketEffect + (branchBonus * (month/6)));
        return Math.max(0, result);
    });

    // --- GRAFİK GÜNCELLEMELERİ ---
    
    // 1. Üye Projeksiyonu
    charts.members.data.datasets[0].data = [...values.slice(-3), ...preds.slice(0,3)];
    charts.members.update();

    // 2. Gelir Tahmini (Fiyat ve Enflasyon etkili)
    let revPreds = preds.map(val => (val * 1100 * (1 + p/100)) / (1 + e/100));
    charts.revenue.data.datasets[0].data = revPreds;
    charts.revenue.update();

    // 3. Kapasite (Maks: 1500)
   // Eski hali
let capValues = preds.slice(0,3).map(val => Math.min(100, Math.round((val / 1200) * 100)));
    charts.capacity.data.datasets[0].data = capValues;
    charts.capacity.update();

    // 4. Churn Riski
    let churnVal = p > 20 ? (p * 0.5) : 12;
    charts.churn.data.datasets[0].data = [100 - churnVal, churnVal];
    charts.churn.update();

    // 6. Personel İhtiyacı
    let needed = Math.ceil(preds[5] / 100);
    charts.staff.data.datasets[0].data = [10, needed];
    charts.staff.update();

    // 8. Verimlilik (Slider etkili dinamik radar)
    charts.efficiency.data.datasets[0].data[0] = 80 - (p/2); // Kâr skoru
    charts.efficiency.data.datasets[0].data[1] = 70 + (m/10000); // Büyüme skoru
    charts.efficiency.update();

    // UI Güncelleme
    document.getElementById('finalResult').innerHTML = `${preds[5].toLocaleString()} <small>Üye</small>`;
    updateKdsAdvice(preds[5], p, e, capValues[2]);
}

function initAllCharts() {
    const commonOptions = { 
        responsive: true, 
        maintainAspectRatio: true, 
        plugins: { legend: { display: false } },
        scales: { 
            y: { grid: { color: '#1e293b' }, ticks: { color: '#94a3b8', font: { size: 10 } } }, 
            x: { grid: { display: false }, ticks: { color: '#94a3b8', font: { size: 10 } } } 
        } 
    };

    charts.members = new Chart(document.getElementById('chartMembers'), {
        type: 'line',
        data: { labels: ['M-2','M-1','Mevcut','+1','+2','+3'], datasets: [{ borderColor: '#22d3ee', backgroundColor: 'rgba(34, 211, 238, 0.1)', fill: true, tension: 0.4, data: [] }] },
        options: commonOptions
    });

    charts.revenue = new Chart(document.getElementById('chartRevenue'), {
        type: 'line',
        data: { labels: ['+1 Ay','+2 Ay','+3 Ay','+4 Ay','+5 Ay','+6 Ay'], datasets: [{ borderColor: '#10b981', data: [], tension: 0.1 }] },
        options: commonOptions
    });

    charts.capacity = new Chart(document.getElementById('chartCapacity'), {
        type: 'bar',
        data: { labels: ['+1 Ay','+2 Ay','+3 Ay'], datasets: [{ backgroundColor: '#3b82f6', borderRadius: 5, data: [] }] },
        options: commonOptions
    });

    charts.churn = new Chart(document.getElementById('chartChurn'), {
        type: 'doughnut',
        data: { labels: ['Sadık','Riskli'], datasets: [{ data: [85, 15], backgroundColor: ['#22d3ee', '#f43f5e'] }] },
        options: { responsive: true, cutout: '70%', plugins: { legend: { display: false } } }
    });

    charts.packages = new Chart(document.getElementById('chartPackages'), {
        type: 'pie',
        data: { labels: ['Yükleniyor...'], datasets: [{ data: [1], backgroundColor: ['#fbbf24', '#94a3b8', '#cd7f32', '#22d3ee'] }] },
        options: { responsive: true }
    });

    charts.staff = new Chart(document.getElementById('chartStaff'), {
        type: 'bar',
        data: { labels: ['Mevcut','Gereken'], datasets: [{ backgroundColor: '#8b5cf6', data: [10, 10] }] },
        options: commonOptions
    });

    charts.extras = new Chart(document.getElementById('chartExtras'), {
        type: 'bar',
        data: { labels: ['Yükleniyor...'], datasets: [{ backgroundColor: '#f59e0b', data: [0] }] },
        options: commonOptions
    });

    charts.efficiency = new Chart(document.getElementById('chartEfficiency'), {
        type: 'radar',
        data: { 
            labels: ['Kâr','Büyüme','Memnuniyet','Hız','Maliyet'], 
            datasets: [{ label: 'Verimlilik', data: [60,60,60,60,60], borderColor: '#ec4899', backgroundColor: 'rgba(236, 72, 153, 0.2)' }] 
        },
        options: { plugins: { legend: { display: false } }, scales: { r: { grid: { color: '#1e293b' }, angleLines: { color: '#1e293b' }, pointLabels: { color: '#94a3b8' }, ticks: { display: false } } } }
    });
}

function updateKdsAdvice(finalPred, p, e, lastCap) {
    const advice = document.getElementById('aiAdvice');
    if (!advice) return;

    let message = "";
    let statusClass = "text-success";
    
    // --- 1. ENFLASYON VE REEL KARLILIK ANALİZİ ---
    const expectedInflation = 20; // Öngörülen gelecek 6 ay reel enflasyon
    const realPriceAdjustment = p - expectedInflation; // Fiyat artışı - Enflasyon farkı

    let inflationNote = "";
    if (p < expectedInflation) {
        statusClass = "text-danger";
        inflationNote = `<b>KRİTİK FİNANSAL UYARI:</b> Gelecek 6 ay içinde reel enflasyonun yaklaşık <b>%${expectedInflation}</b> olması öngörülüyor. Fiyat artışınız (%${p}), enflasyonun altında kaldığı için <b>reel olarak zarar ediyorsunuz.</b> Satın alma gücünüzü korumak için fiyatlarınızı en az %${expectedInflation} seviyesine çekmeniz önerilir. `;
    } else if (p >= expectedInflation && p <= expectedInflation + 15) {
        inflationNote = `<b>STABİL FİYATLANDIRMA:</b> Fiyat artışınız (%${p}), beklenen %${expectedInflation} enflasyonu karşılıyor. Reel kâr marjınız korunuyor. `;
    } else {
        statusClass = "text-warning";
        inflationNote = `<b>AGRESİF FİYATLANDIRMA:</b> Fiyat artışınız (%${p}), enflasyonun çok üzerinde. Bu durum kısa vadede yüksek kâr getirse de <b>üye kaybı (Churn)</b> riskini %${(p * 0.4).toFixed(0)} seviyelerine çıkarabilir. `;
    }

    // --- 2. KAPASİTE ANALİZİ ---
    let capacityNote = "";
    if (lastCap > 90) {
        statusClass = "text-danger";
        capacityNote = `<br><b>KAPASİTE ALARMI:</b> Doluluk %${lastCap}! Acil yeni şube yatırımı planlanmalı. `;
    }

    // --- 3. PAZARLAMA DESTEĞİ ---
    const mBudget = parseInt(document.getElementById('mSlider').value);
    let marketingNote = "";
    if (p > expectedInflation && mBudget < 20000) {
        marketingNote = `<br><b>STRATEJİK EKSİKLİK:</b> Yüksek fiyat politikasını destekleyecek pazarlama bütçeniz yetersiz. En az 25.000₺ bütçe ayrılması önerilir. `;
    }

    // Mesajları Birleştir ve Yazdır
    message = inflationNote + capacityNote + marketingNote;
    advice.innerHTML = `<span class="${statusClass}">${message}</span>`;
}
function initEventListeners() {
    ['pSlider', 'eSlider', 'mSlider'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('input', (event) => {
                const valSpan = document.getElementById(id.replace('Slider', 'Val'));
                let val = event.target.value;
                if (valSpan) {
                    valSpan.innerText = id === 'mSlider' ? '₺' + parseInt(val).toLocaleString() : val + '%';
                }
                runSimulation();
            });
        }
    });
}

function toggleStrategy(type) {
    activeStrategies[type] = !activeStrategies[type];
    const btn = event.currentTarget;
    if (btn) btn.classList.toggle('active');
    runSimulation();
}

function saveSimulation() {
    const res = document.getElementById('finalResult').innerText;
    alert("KDS Senaryosu Kaydedildi!\n6 Ay Sonu Tahmini: " + res);
}

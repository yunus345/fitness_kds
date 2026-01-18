// Sayfa yüklendiğinde verileri çek
document.addEventListener('DOMContentLoaded', () => {
    fetchSummaryStats();
    updateMonthlyAttendanceChart();
    updateRevenueDistributionChart();
    updateRadarChart();
    updateHourlyBarChart(); // <--- BU SATIR EKSİKTİ, EKLEDİK
    if (typeof renderActivityChart === "function") renderActivityChart();
});

async function fetchSummaryStats() {
    try {
        // 1. Toplam Üye Sayısı
        const resUyeler = await fetch('/api/stats/total-uyeler');
        const dataUyeler = await resUyeler.json();
        if (resUyeler.ok) {
            document.getElementById('totalMembersCount').innerText = Number(dataUyeler.total).toLocaleString('tr-TR');
        }

        // 2. Net Aylık Gelir
        const resGelir = await fetch('/api/stats/aylik-gelir');
        const dataGelir = await resGelir.json();
        if (resGelir.ok) {
            const element = document.getElementById('totalRevenue');
            if(element) {
                element.innerText = '₺' + Number(dataGelir.gelir).toLocaleString('tr-TR');
            }
        }

        // 3. Aktif Sözleşmeler
        const resSozlesme = await fetch('/api/stats/aktif-sozlesmeler');
        const dataSozlesme = await resSozlesme.json();
        if (resSozlesme.ok) {
            const element = document.getElementById('activeContractsCount');
            if(element) {
                element.innerText = dataSozlesme.aktif_sayisi;
            }
        }

        // 4. Anlık Salon Yoğunluğu (Fonksiyon içine taşındı ve hata kontrolü eklendi)
        const resYogunluk = await fetch('/api/stats/salon-yogunlugu');
        if (resYogunluk.ok) {
            const dataYogunluk = await resYogunluk.json();
            const valElement = document.getElementById('occupancyValue');
            const barElement = document.getElementById('occupancyBar');
            
            if(valElement) valElement.innerText = `%${dataYogunluk.yuzde}`;
            if(barElement) barElement.style.width = `${dataYogunluk.yuzde}%`;
        }

    } catch (err) {
        console.error("Dashboard verileri yüklenirken kritik hata:", err);
    }
}

async function updateMonthlyAttendanceChart() {
    try {
        const response = await fetch('/api/stats/aylik-katilim');
        const data = await response.json();
        
        const labels = data.map(item => item.ay_yil); // X ekseni (Aylar)
        const values = data.map(item => item.katilim_sayisi); // Y ekseni (Sayılar)

        const ctx = document.getElementById('monthlyAttendance').getContext('2d');
        
        // Eğer sayfa içinde Chart.js tanımlıysa yeni veriyi bas
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{ 
                    label: 'Toplam Giriş Sayısı', 
                    data: values, 
                    borderColor: '#22d3ee', 
                    backgroundColor: 'rgba(34, 211, 238, 0.1)', 
                    fill: true, 
                    tension: 0.4 
                }]
            },
            options: {
                responsive: true,
                plugins: { legend: { display: false } },
                scales: {
                    y: { beginAtZero: true, grid: { color: 'rgba(255, 255, 255, 0.1)' } },
                    x: { grid: { display: false } }
                }
            }
        });
    } catch (err) {
        console.error("Grafik yüklenemedi:", err);
    }
}


async function updateRevenueDistributionChart() {
    try {
        const response = await fetch('/api/stats/gelir-dagilimi');
        const data = await response.json();
        
        const labels = data.map(item => item.kategori_adi);
        const values = data.map(item => item.toplam);

        const ctx = document.getElementById('revenueDoughnut').getContext('2d');
        
        new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{ 
                    data: values, 
                    backgroundColor: ['#22d3ee', '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b'], 
                    borderWidth: 0 
                }]
            },
            options: { 
                cutout: '75%', 
                plugins: { 
                    legend: { position: 'bottom', labels: { color: '#94a3b8' } } 
                } 
            }
        });
    } catch (err) {
        console.error("Gelir grafiği yüklenemedi:", err);
    }
}

async function updateHourlyBarChart() {
    try {
        const response = await fetch('/api/stats/saatlik-doluluk');
        const data = await response.json();
        
        // Veritabanından gelen saatleri etiketlere dönüştür
        const labels = data.map(item => `${item.saat}:00`);
        const values = data.map(item => item.miktar);

        const ctx = document.getElementById('hourlyBarChart');
        if (!ctx) return;

        new Chart(ctx.getContext('2d'), {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{ 
                    label: 'Toplam Giriş Sayısı', 
                    data: values, 
                    backgroundColor: 'rgba(34, 211, 238, 0.6)', 
                    borderColor: '#22d3ee',
                    borderWidth: 1,
                    borderRadius: 5 
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: { beginAtZero: true, grid: { color: '#334155' } },
                    x: { grid: { display: false } }
                }
            }
        });
    } catch (err) {
        console.error("Saatlik grafik yükleme hatası:", err);
    }
}

async function updateRadarChart() {
    try {
        const response = await fetch('/api/stats/profil-analizi');
        const d = await response.json();

        const ctx = document.getElementById('radarChart').getContext('2d');
        new Chart(ctx, {
            type: 'radar',
            data: {
                labels: ['Devamlılık', 'Ek Harcama', 'Sözleşme', 'Dersler', 'Sosyal'],
                datasets: [{ 
                    label: 'Genel Ortalama', 
                    data: [d.devamlılık, d.harcama, d.sadakat, d.dersler, d.sosyal], 
                    borderColor: '#22d3ee', 
                    backgroundColor: 'rgba(34, 211, 238, 0.2)' 
                }]
            },
            options: { 
                scales: { r: { angleLines: { color: '#334155' }, grid: { color: '#334155' }, pointLabels: { color: '#94a3b8' }, ticks: { display: false } } }
            }
        });
    } catch (err) { console.error("Radar grafik hatası:", err); }
}
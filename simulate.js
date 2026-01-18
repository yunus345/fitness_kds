import { faker } from '@faker-js/faker';
import mysql from 'mysql';

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root', 
    password: 'root', 
    database: 'fitness_kds',
    port: 8889 
});

// --- AYARLAR ---
const TOTAL_MEMBERS = 1000;
const BASE_DATE = new Date('2024-01-01'); // 2 yıllık geçmiş başlangıcı
const END_DATE = new Date('2026-01-31');   // Gelecek ay sonu

const PACKAGE_IDS = [1, 2, 3, 4, 5];
const PACKAGE_PRICES = {
    1: 2000, 2: 4000, 3: 6000, 4: 8000, 5: 10000
};

const PACKAGE_DURATIONS = {
    1: 1, 2: 3, 3: 6, 4: 9, 5: 12
};
// --- /AYARLAR ---

const randomDate = (start, end) => {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
};

const generateMembers = () => {
    const members = [];
    for (let i = 0; i < TOTAL_MEMBERS; i++) {
        const registrationDate = randomDate(BASE_DATE, END_DATE);
        members.push({
            ad: faker.person.firstName(),
            soyad: faker.person.lastName(),
            dogum_tarihi: faker.date.birthdate(),
            cinsiyet: faker.person.sex(),
            kayit_tarihi: registrationDate
        });
    }
    return members;
};

const generateContracts = (memberIds) => {
    const contracts = [];
    memberIds.forEach(memberId => {
        const packageId = faker.helpers.arrayElement(PACKAGE_IDS);
        const startDate = randomDate(BASE_DATE, new Date()); // Kayıtlar bugüne kadar yayılır
        const durationMonths = PACKAGE_DURATIONS[packageId]; 
        const endDate = new Date(startDate);
        endDate.setMonth(endDate.getMonth() + durationMonths);

        contracts.push({
            uye_id: memberId,
            paket_id: packageId,
            baslangic_tarihi: startDate,
            bitis_tarihi: endDate,
            indirimli_fiyat: PACKAGE_PRICES[packageId],
            iptal_nedeni: faker.helpers.arrayElement([null, null, null, 'Kalabalıktı', 'Taşınma', 'Maliyet Yüksek']) 
        });
    });
    return contracts;
};

// --- YENİ: GELİRLER ÜRETİM FONKSİYONU ---
const generateGelirler = (memberIds, contracts) => {
    const records = [];
    memberIds.forEach((memberId, index) => {
        // 1. Üyelik Geliri (Her sözleşme bir gelirdir)
        records.push({
            uye_id: memberId,
            kategori_id: 1, // Üyelik
            tutar: contracts[index].indirimli_fiyat,
            odeme_tarihi: contracts[index].baslangic_tarihi,
            odeme_yontemi: faker.helpers.arrayElement(['Nakit', 'Kredi Kartı', 'Havale']),
            aciklama: 'Üyelik Paketi Tahsilatı'
        });

        // 2. Ekstra Gelirler (Kantin, PT, Suplement)
        const extraCount = faker.number.int({ min: 2, max: 7 });
        for (let i = 0; i < extraCount; i++) {
            records.push({
                uye_id: memberId,
                kategori_id: faker.helpers.arrayElement([2, 3, 4]), 
                tutar: faker.number.int({ min: 100, max: 2500 }),
                odeme_tarihi: randomDate(contracts[index].baslangic_tarihi, contracts[index].bitis_tarihi > END_DATE ? END_DATE : contracts[index].bitis_tarihi),
                odeme_yontemi: faker.helpers.arrayElement(['Nakit', 'Kredi Kartı']),
                aciklama: faker.helpers.arrayElement(['Protein Bar', 'Özel Ders', 'Kreatin', 'Su', 'Spor İçeceği'])
            });
        }
    });
    return records;
};

const generateAttendance = (memberIds, allContracts) => {
    const records = [];
    const OPENING_HOUR = 9;
    const CLOSING_HOUR = 23;

    memberIds.forEach(memberId => {
        const memberContracts = allContracts.filter(c => c.uye_id === memberId);
        if (memberContracts.length === 0) return; 
        
        const activeContract = memberContracts[0]; 
        const contractStartDate = activeContract.baslangic_tarihi;
        const contractEndDate = activeContract.bitis_tarihi;
        
        for (let i = 0; i < faker.number.int({ min: 30, max: 100 }); i++) {
            const randomDay = faker.date.between({ from: contractStartDate, to: contractEndDate > END_DATE ? END_DATE : contractEndDate });
            randomDay.setHours(0, 0, 0, 0);

            let entryHour;
            if (faker.number.float() < 0.7) {
                entryHour = faker.helpers.arrayElement([19, 20]); 
            } else {
                do {
                    entryHour = faker.number.int({ min: OPENING_HOUR, max: CLOSING_HOUR - 1 }); 
                } while (entryHour >= 19 && entryHour <= 20); 
            }

            const entryTime = new Date(randomDay);
            entryTime.setHours(entryHour, 0, 0, 0); 
            
            const durationSteps = faker.number.int({ min: 2, max: 6 }); 
            const duration = durationSteps * 30; 

            let exitTime = new Date(entryTime.getTime() + duration * 60000); 
            
            if (exitTime.getHours() >= CLOSING_HOUR && exitTime.getMinutes() > 0) {
                exitTime.setHours(CLOSING_HOUR, 0, 0, 0); 
            }
            
            records.push({
                uye_id: memberId,
                giris_saati: entryTime,
                cikis_saati: exitTime
            });
        }
    });
    return records;
};

const runSimulation = async () => {
    console.log("--- KDS Geniş Kapsamlı Veri Simülasyonu Başlatılıyor ---");
    db.connect();

    const insertData = (tableName, data) => {
        return new Promise((resolve, reject) => {
            if (data.length === 0) return resolve();
            const columns = Object.keys(data[0]);
            const values = data.map(obj => Object.values(obj));
            const sql = `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES ?`;
            db.query(sql, [values], (error, results) => {
                if (error) return reject(error);
                resolve(results.insertId);
            });
        });
    };
    
    try {
        await insertData('uyeler', generateMembers());
        
        const memberIdsResults = await new Promise((resolve, reject) => {
            db.query('SELECT uye_id FROM uyeler ORDER BY uye_id DESC LIMIT ?', [TOTAL_MEMBERS], (err, res) => {
                if (err) return reject(err); resolve(res.map(r => r.uye_id));
            });
        });

        const contracts = generateContracts(memberIdsResults);
        await insertData('uyelik_sozlesmeleri', contracts);
        
        // Gelirler tablosuna veri ekleme
        const gelirler = generateGelirler(memberIdsResults, contracts);
        await insertData('gelirler', gelirler);

        const attendanceRecords = generateAttendance(memberIdsResults, contracts);
        await insertData('katilim_kayitlari', attendanceRecords);
        
        console.log("--- Simülasyon Başarıyla Tamamlandı! ---");
    } catch (e) {
        console.error("Hata:", e);
    } finally {
        db.end();
    }
};

runSimulation();
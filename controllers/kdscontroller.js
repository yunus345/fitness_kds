import db from '../models/db.js';

// LOGIN API
export const login = (req, res) => {
    const { username, password } = req.body;
    const query = "SELECT * FROM yoneticiler WHERE kullanici_adi = ? AND sifre = ?";
    db.query(query, [username, password], (err, results) => {
        if (err) return res.status(500).json({ success: false, message: "Sunucu hatası!" });
        if (results.length > 0) {
            res.status(200).json({ success: true, message: "Giriş başarılı" });
        } else {
            res.status(401).json({ success: false, message: "Geçersiz kullanıcı adı veya şifre!" });
        }
    });
};

// İSTATİSTİK APILERİ
export const getTotalMembers = (req, res) => {
    const query = "SELECT COUNT(*) AS total FROM uyeler";
    db.query(query, (err, results) => {
        if (err) return res.status(500).json({ error: "Veritabanı hatası" });
        res.json({ total: results[0].total });
    });
};

export const getAylikGelir = (req, res) => {
    const query = `SELECT SUM(tutar) AS toplam_gelir FROM gelirler WHERE MONTH(odeme_tarihi) = MONTH(CURRENT_DATE()) AND YEAR(odeme_tarihi) = YEAR(CURRENT_DATE())`;
    db.query(query, (err, results) => {
        if (err) return res.status(500).json({ error: "Veritabanı hatası" });
        res.json({ gelir: results[0].toplam_gelir || 0 });
    });
};

export const getSalonDensity = (req, res) => {
    const query = `SELECT COUNT(*) AS icerideki_sayisi FROM katilim_kayitlari WHERE giris_saati <= CURRENT_TIMESTAMP AND cikis_saati >= CURRENT_TIMESTAMP`;
    db.query(query, (err, results) => {
        if (err) return res.status(500).json({ error: "Veritabanı hatası" });
        const iceridekiler = results[0].icerideki_sayisi;
        res.json({ iceridekiler, yuzde: Math.round((iceridekiler / 100) * 100) });
    });
};

// KDS ANALİZ APILERİ
export const getGecmisAnaliz = (req, res) => {
    const query = `SELECT DATE_FORMAT(kayit_tarihi, '%Y-%m') AS ay, COUNT(*) AS yeni_uye_sayisi FROM uyeler GROUP BY ay ORDER BY ay ASC`;
    db.query(query, (err, results) => {
        if (err) return res.status(500).json([]);
        let kumulatifToplam = 0;
        const formattedResults = results.map(row => {
            kumulatifToplam += row.yeni_uye_sayisi;
            return { ay: row.ay, yeni_uye_sayisi: row.yeni_uye_sayisi, toplam_uye: kumulatifToplam };
        });
        res.json(formattedResults);
    });
};

export const getChurnAnalysis = (req, res) => {
    const query = `SELECT (SELECT COUNT(*) FROM uyelik_sozlesmeleri WHERE iptal_nedeni IS NOT NULL) AS iptal_edenler, (SELECT COUNT(*) FROM uyelik_sozlesmeleri) AS toplam_sozlesme`;
    db.query(query, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results[0]);
    });
};
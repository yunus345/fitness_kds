import mysql from 'mysql';
import dotenv from 'dotenv';

dotenv.config();

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 8889 
});

db.connect(err => {
    if (err) {
        console.error('Veritabanı bağlantısı başarısız:', err.stack);
        return;
    }
    console.log('MySQL Veritabanına başarıyla bağlanıldı.');
});

export default db;
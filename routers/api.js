import express from 'express';
import * as kdsController from '../controllers/kdscontroller.js';

const router = express.Router();

// Rotaları Eşleştir
router.post('/login', kdsController.login);
router.get('/stats/total-uyeler', kdsController.getTotalMembers);
router.get('/stats/aylik-gelir', kdsController.getAylikGelir);
router.get('/stats/salon-yogunlugu', kdsController.getSalonDensity);
router.get('/kds/gecmis-analiz', kdsController.getGecmisAnaliz);
router.get('/kds/churn-analizi', kdsController.getChurnAnalysis);

export default router;
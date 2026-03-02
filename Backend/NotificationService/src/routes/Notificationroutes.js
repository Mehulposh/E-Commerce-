import express from 'express';
const router = express.Router();
import {
    markAllAsRead,
    markAsRead, 
    getNotifications,
    getUnreadCount
}  from '../controller/NotificationController.js';
import { protect } from '../middleware/authMiddleware.js';

router.use(protect);

router.get('/', getNotifications);
router.get('/unread-count', getUnreadCount);
router.patch('/read-all', markAllAsRead);
router.patch('/:id/read', markAsRead);

export default router;
import Notification from '../models/Notification.js';

// GET /api/notifications  (user sees own; admin sees all)
const getNotifications = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, type, event, status } = req.query;
    const query = {};

    if (req.user.role !== 'admin') {
      query.userId = req.user._id.toString();
    }
    if (type) query.type = type;
    if (event) query.event = event;
    if (status) query.status = status;

    const skip = (Number(page) - 1) * Number(limit);
    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(query)
        .skip(skip)
        .limit(Number(limit))
        .sort({ createdAt: -1 }),
      Notification.countDocuments(query),
      Notification.countDocuments({
        ...query,
        type: 'in_app',
        status: 'sent',
        readAt: null,
      }),
    ]);

    res.json({
      notifications,
      unreadCount,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/notifications/unread-count
const getUnreadCount = async (req, res, next) => {
  try {
    const count = await Notification.countDocuments({
      userId: req.user._id.toString(),
      type: 'in_app',
      status: 'sent',
      readAt: null,
    });
    res.json({ unreadCount: count });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/notifications/:id/read
const markAsRead = async (req, res, next) => {
  try {
    const notification = await Notification.findById(req.params.id);
    if (!notification) return res.status(404).json({ message: 'Notification not found' });

    if (notification.userId !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    notification.readAt = new Date();
    await notification.save();

    res.json({ message: 'Marked as read', notification });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/notifications/read-all
const markAllAsRead = async (req, res, next) => {
  try {
    await Notification.updateMany(
      { userId: req.user._id.toString(), type: 'in_app', readAt: null },
      { readAt: new Date() }
    );
    res.json({ message: 'All notifications marked as read' });
  } catch (err) {
    next(err);
  }
};


export {
    markAllAsRead,
    markAsRead, 
    getNotifications,
    getUnreadCount
}
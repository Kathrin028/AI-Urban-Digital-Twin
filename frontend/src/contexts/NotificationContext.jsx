import { createContext, useContext, useState, useCallback } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { Bell } from 'lucide-react';

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  const addNotification = useCallback((type, message, description = '') => {
    const newNotif = {
      id: Date.now(),
      type,
      message,
      description,
      timestamp: new Date(),
      read: false
    };

    setNotifications(prev => [newNotif, ...prev]);

    // Trigger toast based on type
    if (type === 'success') toast.success(message);
    else if (type === 'error') toast.error(message);
    else if (type === 'warning') toast(message, { icon: '⚠️', duration: 4000 });
    else toast(message);

  }, []);

  const markAsRead = useCallback((id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  return (
    <NotificationContext.Provider value={{ notifications, addNotification, markAsRead, markAllAsRead }}>
      {children}
      <Toaster position="top-right" />
    </NotificationContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) throw new Error("useNotifications must be used within NotificationProvider");
  return context;
};

// Notification Dropdown Component
export const NotificationBell = () => {
  const { notifications, markAllAsRead, markAsRead } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-slate-500 hover:text-slate-800 transition rounded-full hover:bg-slate-100"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white"></span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl shadow-slate-900/10 border border-slate-200 z-[9999] overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50">
            <h3 className="text-[14px] font-bold text-slate-800 tracking-tight">Notifications</h3>
            {unreadCount > 0 && (
              <button 
                onClick={markAllAsRead}
                className="text-[12px] font-semibold text-blue-600 hover:text-blue-800 transition"
              >
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-[13px] text-slate-500 font-medium">
                No notifications yet this session.
              </div>
            ) : (
              notifications.map(n => (
                <div 
                  key={n.id} 
                  onClick={() => markAsRead(n.id)}
                  className={`p-4 border-b border-slate-50 cursor-pointer transition hover:bg-slate-50 ${!n.read ? 'bg-blue-50/30' : ''}`}
                >
                  <div className="flex gap-3">
                    <div className="mt-1">
                      {n.type === 'success' && <div className="w-2 h-2 rounded-full bg-emerald-500"></div>}
                      {n.type === 'error' && <div className="w-2 h-2 rounded-full bg-rose-500"></div>}
                      {n.type === 'warning' && <div className="w-2 h-2 rounded-full bg-amber-500"></div>}
                      {n.type === 'info' && <div className="w-2 h-2 rounded-full bg-blue-500"></div>}
                    </div>
                    <div>
                      <p className={`text-[13px] ${!n.read ? 'font-bold text-slate-900' : 'font-medium text-slate-700'}`}>
                        {n.message}
                      </p>
                      {n.description && <p className="text-[12px] text-slate-500 mt-1">{n.description}</p>}
                      <p className="text-[10px] text-slate-400 font-medium mt-2">
                        {n.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

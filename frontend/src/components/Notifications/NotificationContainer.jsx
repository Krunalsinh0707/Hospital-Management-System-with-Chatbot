import React from 'react';
import { useNotification } from '../../context/NotificationContext';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';
import './NotificationContainer.css';

const NotificationContainer = () => {
    const { notifications, removeNotification } = useNotification();

    return (
        <div className="notification-container">
            {notifications.map(({ id, message, type }) => (
                <div key={id} className={`notification-toast alert-${type}`}>
                    <div className="toast-icon">
                        {type === 'success' && <CheckCircle size={20} />}
                        {type === 'error' && <AlertCircle size={20} />}
                        {type === 'info' && <Info size={20} />}
                    </div>
                    <div className="toast-content">
                        {message}
                    </div>
                    <button className="toast-close" onClick={() => removeNotification(id)}>
                        <X size={16} />
                    </button>
                </div>
            ))}
        </div>
    );
};

export default NotificationContainer;

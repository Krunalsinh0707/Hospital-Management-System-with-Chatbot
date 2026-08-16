from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from src.database import get_db
from src.models import Notification
from src.auth import get_current_user

router = APIRouter(prefix="/notifications", tags=["In-App Notifications"])

@router.get("/my")
def get_my_notifications(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    notifs = db.query(Notification).filter(Notification.user_id == current_user.user_id).order_by(Notification.created_at.desc()).limit(30).all()
    unread_count = db.query(Notification).filter(Notification.user_id == current_user.user_id, Notification.is_read == False).count()
    return {
        "unread_count": unread_count,
        "notifications": [
            {
                "id": n.id,
                "title": n.title,
                "message": n.message,
                "type": n.type,
                "is_read": n.is_read,
                "created_at": n.created_at.strftime("%Y-%m-%d %H:%M")
            }
            for n in notifs
        ]
    }

@router.put("/{notification_id}/read")
def mark_read(notification_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    notif = db.query(Notification).filter(Notification.id == notification_id, Notification.user_id == current_user.user_id).first()
    if notif:
        notif.is_read = True
        db.commit()
    return {"message": "Notification marked read"}

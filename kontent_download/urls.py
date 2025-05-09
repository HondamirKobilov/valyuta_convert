from django.urls import path
from shazam.views import (
    index,
    CheckOrCreateContentView,
    telegram_auth,
    send_message_to_bot,       # ✅ BU QATORNI QO‘SH!
)

urlpatterns = [
    path('', index, name='shazam_home'),
    path('content/', CheckOrCreateContentView.as_view(), name='check_or_create_content'),
    path('api/send_message_to_bot/', send_message_to_bot, name='send_message_to_bot'),
    path('api/telegram_auth/', telegram_auth, name='telegram_auth'),
]

from celery import shared_task
from django.utils import timezone
from .models import ConsentRequest


@shared_task
def expire_old_consents():
    """
    Runs every hour via Celery Beat.
    Marks PENDING and APPROVED consents as EXPIRED once expires_at passes.
    """
    expired_count = ConsentRequest.objects.filter(
        status__in=['PENDING', 'APPROVED'],
        expires_at__lte=timezone.now()
    ).update(status='EXPIRED')

    return f"{expired_count} consents marked EXPIRED"
from django.db.models.signals import post_save
from django.dispatch import receiver

from apps.records.models import MedicalRecord
from apps.audit.models import AuditLog


@receiver(post_save, sender=MedicalRecord)
def create_audit_log(sender, instance, created, **kwargs):

    if created:

        AuditLog.objects.create(
            actor=None,
            patient=instance.patient,
            action=AuditLog.Action.ADD_RECORD,
            metadata={
                "record_id": instance.id,
                "title": instance.title
            }
        )
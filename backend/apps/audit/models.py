# TODO: Person responsible for 'audit' fills this in.
from django.db import models


class AuditLog(models.Model):

    class Action(models.TextChoices):
        ADD_RECORD = "ADD_RECORD", "Add Record"
        VIEW_RECORD = "VIEW_RECORD", "View Record"
        UPDATE_RECORD = "UPDATE_RECORD", "Update Record"
        DELETE_RECORD = "DELETE_RECORD", "Delete Record"

    actor = models.ForeignKey(
        "accounts.User",
        on_delete=models.SET_NULL,
        null=True,
        related_name="audit_logs"
    )

    patient = models.ForeignKey(
        "accounts.PatientProfile",
        on_delete=models.CASCADE,
        related_name="audit_logs"
    )

    action = models.CharField(
        max_length=30,
        choices=Action.choices
    )

    timestamp = models.DateTimeField(
        auto_now_add=True
    )

    ip_address = models.GenericIPAddressField(
        blank=True,
        null=True
    )

    metadata = models.JSONField(
        blank=True,
        null=True
    )

    def __str__(self):
        return f"{self.action}"
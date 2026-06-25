# TODO: Person responsible for 'records' fills this in.
from django.db import models


class MedicalRecord(models.Model):

    class RecordType(models.TextChoices):
        PRESCRIPTION = "PRESCRIPTION", "Prescription"
        LAB_REPORT = "LAB_REPORT", "Lab Report"
        DIAGNOSIS = "DIAGNOSIS", "Diagnosis"
        DISCHARGE_SUMMARY = "DISCHARGE_SUMMARY", "Discharge Summary"
        OTHER = "OTHER", "Other"

    patient = models.ForeignKey(
        "accounts.PatientProfile",
        on_delete=models.CASCADE,
        related_name="medical_records"
    )

    # TODO (Person 2):
    # Replace if Hospital model structure changes.
    hospital = models.ForeignKey(
        "hospitals.Hospital",
        on_delete=models.CASCADE,
        related_name="medical_records"
    )

    # TODO (Person 2):
    # Replace if DoctorProfile model structure changes.
    created_by = models.ForeignKey(
        "hospitals.DoctorProfile",
        on_delete=models.SET_NULL,
        null=True,
        related_name="created_records"
    )

    record_type = models.CharField(
        max_length=30,
        choices=RecordType.choices
    )

    title = models.CharField(max_length=255)

    details = models.JSONField()

    attachment_url = models.URLField(
        blank=True,
        null=True
    )

    source = models.CharField(
        max_length=50,
        default="manual"
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    def __str__(self):
        return self.title


class PrescriptionItem(models.Model):

    record = models.ForeignKey(
        MedicalRecord,
        on_delete=models.CASCADE,
        related_name="prescription_items"
    )

    tablet_name = models.CharField(max_length=255)

    dosage = models.CharField(max_length=100)

    frequency = models.CharField(max_length=100)

    duration = models.CharField(max_length=100)

    notes = models.TextField(
        blank=True,
        null=True
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    def __str__(self):
        return self.tablet_name
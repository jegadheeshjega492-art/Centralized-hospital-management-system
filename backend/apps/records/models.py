# TODO: Person responsible for 'records' fills this in.

from django.db import models


class MedicalRecord(models.Model):

    class RecordType(models.TextChoices):
        ALLERGY = "ALLERGY", "Allergy"
        IMMUNIZATION = "IMMUNIZATION", "Immunization"
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
    # Update if Hospital model changes.
    hospital = models.ForeignKey(
        "hospitals.Hospital",
        on_delete=models.CASCADE,
        related_name="medical_records"
    )

    # TODO (Person 2):
    # Update if DoctorProfile model changes.
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

    title = models.CharField(
        max_length=255
    )

    # Allergy:
    # {
    #   "allergen": "Penicillin",
    #   "reaction": "Skin Rash",
    #   "severity": "High"
    # }
    #
    # Immunization:
    # {
    #   "vaccine": "COVID-19 Booster",
    #   "dose": "3",
    #   "date": "2026-06-29"
    # }
    #
    # Diagnosis:
    # {
    #   "diagnosis": "Typhoid",
    #   "doctor_notes": "Admit for observation"
    # }
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

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.record_type} - {self.title}"


class PrescriptionItem(models.Model):

    record = models.ForeignKey(
        MedicalRecord,
        on_delete=models.CASCADE,
        related_name="prescription_items"
    )

    tablet_name = models.CharField(
        max_length=255
    )

    dosage = models.CharField(
        max_length=100
    )

    frequency = models.CharField(
        max_length=100
    )

    duration = models.CharField(
        max_length=100
    )

    notes = models.TextField(
        blank=True,
        null=True
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    class Meta:
        ordering = ["tablet_name"]

    def __str__(self):
        return self.tablet_name
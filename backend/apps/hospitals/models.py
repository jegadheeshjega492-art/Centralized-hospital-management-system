# TODO: Person responsible for 'hospitals' fills this in.
from django.db import models

# ==================================================
# TEMPORARY PLACEHOLDER MODELS
# Created by Person 4 to unblock MedicalRecord work.
#
# TODO (Person 2):
# Replace with final Hospital and DoctorProfile models.
# ==================================================

class Hospital(models.Model):
    name = models.CharField(max_length=255)

    def __str__(self):
        return self.name


class DoctorProfile(models.Model):
    name = models.CharField(max_length=255)

    hospital = models.ForeignKey(
        Hospital,
        on_delete=models.CASCADE,
        related_name="doctors"
    )

    def __str__(self):
        return self.name
    
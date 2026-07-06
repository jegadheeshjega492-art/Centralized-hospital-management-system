from django.db import models
from django.conf import settings


class ConsentRequest(models.Model):
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('APPROVED', 'Approved'),
        ('DENIED', 'Denied'),
        ('EXPIRED', 'Expired'),
    ]

    CONSENT_METHOD_CHOICES = [
        ('PATIENT_OTP', 'Patient OTP'),
        ('RECEPTIONIST_OTP', 'Receptionist OTP'),
        ('RECEPTIONIST_MANUAL', 'Receptionist Manual'),
        ('PATIENT_SELF', 'Patient Self Approved'),
    ]

    patient = models.ForeignKey(
        'accounts.PatientProfile',
        on_delete=models.CASCADE,
        related_name='consent_requests'
    )
    hospital = models.ForeignKey(
        'hospitals.Hospital',
        on_delete=models.CASCADE,
        related_name='consent_requests'
    )
    requested_by = models.ForeignKey(
        'accounts.DoctorProfile',
        on_delete=models.CASCADE,
        related_name='consent_requests_made'
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    consent_method = models.CharField(
        max_length=25, choices=CONSENT_METHOD_CHOICES, null=True, blank=True
    )
    appointment = models.ForeignKey(
        'Appointment',
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='consent_requests'
    )
    requested_at = models.DateTimeField(auto_now_add=True)
    resolved_at = models.DateTimeField(null=True, blank=True)
    expires_at = models.DateTimeField()

    class Meta:
        ordering = ['-requested_at']

    def __str__(self):
        return f"{self.requested_by} → {self.patient} [{self.status}]"


class Appointment(models.Model):
    ACCESS_METHOD_CHOICES = [
        ('OTP', 'OTP Verification'),
        ('MANUAL', 'Manual Verification'),
    ]

    STATUS_CHOICES = [
        ('SCHEDULED', 'Scheduled'),
        ('ACTIVE', 'Active'),
        ('COMPLETED', 'Completed'),
        ('CANCELLED', 'Cancelled'),
    ]

    patient = models.ForeignKey(
        'accounts.PatientProfile',
        on_delete=models.CASCADE,
        related_name='appointments'
    )
    hospital = models.ForeignKey(
        'hospitals.Hospital',
        on_delete=models.CASCADE,
        related_name='appointments'
    )
    doctor = models.ForeignKey(
        'accounts.DoctorProfile',
        on_delete=models.CASCADE,
        related_name='appointments'
    )
    appointment_date = models.DateField()
    start_time = models.TimeField()
    end_time = models.TimeField()
    access_method = models.CharField(max_length=10, choices=ACCESS_METHOD_CHOICES)
    otp_hash = models.CharField(max_length=256, null=True, blank=True)
    otp_verified = models.BooleanField(default=False)
    verified_by_staff = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='verified_appointments'
    )
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default='SCHEDULED')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-appointment_date', '-start_time']

    def __str__(self):
        return f"{self.patient} - {self.doctor} [{self.appointment_date}]"
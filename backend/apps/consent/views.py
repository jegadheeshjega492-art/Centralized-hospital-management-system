from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from django.utils import timezone
from datetime import timedelta, datetime

from apps.accounts.permissions import IsPatient, IsHospitalAdmin
from .models import ConsentRequest, Appointment
from .serializers import (
    ConsentRequestSerializer, ConsentRespondSerializer,
    AppointmentSerializer, OTPVerifySerializer
)
from .permissions import IsVerifiedDoctor, IsPatientOwner
from .utils import hash_otp
from .tasks import send_otp_task


class ConsentRequestView(APIView):

    def get_permissions(self):
        if self.request.method == 'GET':
            return [IsAuthenticated()]
        return [IsAuthenticated(), IsVerifiedDoctor()]

    def get(self, request):
        patient_profile = getattr(request.user, 'patient_profile', None)
        if not patient_profile:
            return Response([], status=status.HTTP_200_OK)

        # Only show OTP or manual verified active consents
        # Patient cannot approve/deny these — they are read-only
        consents = ConsentRequest.objects.filter(
            patient=patient_profile,
            status='APPROVED',
            consent_method__in=['RECEPTIONIST_OTP', 'RECEPTIONIST_MANUAL'],
            expires_at__gt=timezone.now()
        )
        return Response(ConsentRequestSerializer(consents, many=True).data)

    def post(self, request):
        serializer = ConsentRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        consent = serializer.save(
            requested_by=request.user.doctor_profile,
            hospital=request.user.doctor_profile.hospital,
            status='PENDING'
        )
        return Response(ConsentRequestSerializer(consent).data, status=status.HTTP_201_CREATED)


class ConsentApproveView(APIView):
    permission_classes = [IsAuthenticated, IsPatient, IsPatientOwner]

    def patch(self, request, pk):
        consent = get_object_or_404(ConsentRequest, pk=pk)
        self.check_object_permissions(request, consent)

        if consent.status != 'PENDING':
            return Response(
                {"detail": f"Cannot approve — consent is {consent.status}"},
                status=status.HTTP_400_BAD_REQUEST
            )

        if consent.appointment:
            appt = consent.appointment
            expires_at = datetime.combine(
                appt.appointment_date, appt.end_time,
                tzinfo=timezone.get_current_timezone()
            )
        else:
            expires_at = timezone.now() + timedelta(hours=24)

        consent.status = 'APPROVED'
        consent.consent_method = 'PATIENT_SELF'
        consent.resolved_at = timezone.now()
        consent.expires_at = expires_at
        consent.save()

        return Response(ConsentRequestSerializer(consent).data, status=status.HTTP_200_OK)


class ConsentDenyView(APIView):
    permission_classes = [IsAuthenticated, IsPatient, IsPatientOwner]

    def patch(self, request, pk):
        consent = get_object_or_404(ConsentRequest, pk=pk)
        self.check_object_permissions(request, consent)

        if consent.status != 'PENDING':
            return Response(
                {"detail": f"Cannot deny — consent is {consent.status}"},
                status=status.HTTP_400_BAD_REQUEST
            )

        consent.status = 'DENIED'
        consent.resolved_at = timezone.now()
        consent.save()

        return Response(ConsentRequestSerializer(consent).data, status=status.HTTP_200_OK)


class AppointmentCreateView(APIView):
    permission_classes = [IsAuthenticated, IsHospitalAdmin]

    def post(self, request):
        serializer = AppointmentSerializer(data=request.data)
        if serializer.is_valid():
            appointment = serializer.save(status='SCHEDULED')
            if appointment.access_method == 'OTP':
                send_otp_task.delay(appointment.id)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class OTPVerifyView(APIView):
    permission_classes = [IsAuthenticated, IsHospitalAdmin]
    def post(self, request, pk):
        appointment = get_object_or_404(Appointment, pk=pk)
        if appointment.status == 'ACTIVE':
            return Response({'error': 'Appointment already verified.'}, status=status.HTTP_400_BAD_REQUEST)

        serializer = OTPVerifySerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        submitted_hash = hash_otp(serializer.validated_data['otp'])
        if submitted_hash != appointment.otp_hash:
            return Response({'error': 'Invalid OTP'}, status=status.HTTP_400_BAD_REQUEST)

        appointment.otp_verified = True
        appointment.status = 'ACTIVE'
        appointment.save()

        expires_at = datetime.combine(
            appointment.appointment_date, appointment.end_time,
            tzinfo=timezone.get_current_timezone()
        )
        consent = ConsentRequest.objects.create(
            patient=appointment.patient,
            hospital=appointment.hospital,
            requested_by=appointment.doctor,
            status='APPROVED',
            resolved_at=timezone.now(),
            expires_at=expires_at,
            appointment=appointment,
            consent_method='RECEPTIONIST_OTP',
        )
        return Response({'message': 'OTP verified, access granted', 'consent_id': consent.id})


class ManualVerifyView(APIView):
    permission_classes = [IsAuthenticated, IsHospitalAdmin]

    def post(self, request, pk):
        appointment = get_object_or_404(Appointment, pk=pk)
        if appointment.status == 'ACTIVE':
            return Response({'error': 'Appointment already verified.'}, status=status.HTTP_400_BAD_REQUEST)
        appointment.verified_by_staff = request.user
        appointment.status = 'ACTIVE'
        appointment.save()

        expires_at = datetime.combine(
            appointment.appointment_date, appointment.end_time,
            tzinfo=timezone.get_current_timezone()
        )
        consent = ConsentRequest.objects.create(
            patient=appointment.patient,
            hospital=appointment.hospital,
            requested_by=appointment.doctor,
            status='APPROVED',
            resolved_at=timezone.now(),
            expires_at=expires_at,
            appointment=appointment,
            consent_method='RECEPTIONIST_MANUAL',
        )
        return Response({'message': 'Manual verification done, access granted', 'consent_id': consent.id})

class CheckConsentView(APIView):
    """
    GET /api/consent/check/?patient_uid=UID3F2A...
    Doctor checks if active consent exists for a patient at their hospital.
    """
    permission_classes = [IsAuthenticated, IsVerifiedDoctor]

    def get(self, request):
        patient_uid = request.query_params.get('patient_uid')
        if not patient_uid:
            return Response({'has_consent': False})

        from apps.accounts.models import PatientProfile
        try:
            patient = PatientProfile.objects.get(patient_uid=patient_uid)
        except PatientProfile.DoesNotExist:
            return Response({'has_consent': False, 'error': 'Patient not found'})

        hospital = request.user.doctor_profile.hospital
        has_consent = ConsentRequest.objects.filter(
            patient=patient,
            hospital=hospital,
            status='APPROVED',
            expires_at__gt=timezone.now()
        ).exists()

        return Response({'has_consent': has_consent})

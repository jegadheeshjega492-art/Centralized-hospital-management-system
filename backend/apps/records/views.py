from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from django.db import transaction
from django.utils import timezone

from .models import MedicalRecord, PrescriptionItem
from .serializers import MedicalRecordSerializer, PrescriptionItemSerializer, PatientRecordSerializer
from apps.audit.models import AuditLog
from apps.consent.models import ConsentRequest


class MedicalRecordViewSet(viewsets.ModelViewSet):
    queryset = MedicalRecord.objects.all()
    serializer_class = MedicalRecordSerializer
    permission_classes = [IsAuthenticated]
    http_method_names = ['get', 'post', 'head', 'options']  # blocks PUT/PATCH/DELETE

    def get_queryset(self):
        # Patients see only their own records, doctors see records they created
        user = self.request.user
        if hasattr(user, 'patient_profile'):
            return MedicalRecord.objects.filter(patient=user.patient_profile)
        if hasattr(user, 'doctor_profile'):
            return MedicalRecord.objects.filter(created_by=user.doctor_profile)
        return MedicalRecord.objects.none()

    def create(self, request, *args, **kwargs):
        user = request.user

        if not hasattr(user, 'doctor_profile'):
            return Response(
                {"error": "Only doctors can create medical records."},
                status=status.HTTP_403_FORBIDDEN
            )

        doctor = user.doctor_profile
        hospital = doctor.hospital

        # ── Resolve patient from patient_uid or patient ID ──
        from apps.accounts.models import PatientProfile
        patient_uid = request.data.get('patient_uid')
        patient_id = request.data.get('patient')

        try:
            if patient_uid:
                patient = PatientProfile.objects.get(patient_uid=patient_uid)
            elif patient_id:
                patient = PatientProfile.objects.get(id=patient_id)
            else:
                return Response(
                    {"error": "patient or patient_uid is required."},
                    status=status.HTTP_400_BAD_REQUEST
                )
        except PatientProfile.DoesNotExist:
            return Response(
                {"error": "Patient not found."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # ── Consent check ───────────────────────────────────
        has_consent = ConsentRequest.objects.filter(
            patient=patient,
            hospital=hospital,
            status='APPROVED',
            expires_at__gt=timezone.now()
        ).exists()

        if not has_consent:
            return Response(
                {"error": "No active approved consent for this patient at your hospital."},
                status=status.HTTP_403_FORBIDDEN
            )

        prescription_items_data = request.data.get('prescription_items', [])

        # Inject patient into request data for serializer
        data = request.data.copy()
        data['patient'] = patient.id
        # Auto-populate hospital_address from hospital model
        data['hospital_address'] = hospital.address

        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)

        with transaction.atomic():
            record = serializer.save(created_by=doctor, hospital=hospital)

            if record.record_type == 'PRESCRIPTION' and prescription_items_data:
                PrescriptionItem.objects.bulk_create([
                    PrescriptionItem(record=record, **item)
                    for item in prescription_items_data
                ])

            AuditLog.objects.create(
                actor=request.user,
                patient=record.patient,
                hospital=record.hospital,
                action=AuditLog.Action.ADD_RECORD,
                ip_address=request.META.get("REMOTE_ADDR"),
                metadata={"record_id": record.id, "record_type": record.record_type}
            )

        return Response(self.get_serializer(record).data, status=status.HTTP_201_CREATED)

    def retrieve(self, request, *args, **kwargs):
        record = self.get_object()

        AuditLog.objects.create(
            actor=request.user,
            patient=record.patient,
            hospital=record.hospital,
            action=AuditLog.Action.VIEW_RECORD,
            ip_address=request.META.get("REMOTE_ADDR"),
            metadata={"record_id": record.id}
        )

        serializer = self.get_serializer(record)
        return Response(serializer.data)


class PrescriptionItemViewSet(viewsets.ReadOnlyModelViewSet):
    """
    GET /api/records/{record_id}/prescriptions/
    List/retrieve prescription items for a specific record.
    """
    serializer_class = PrescriptionItemSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        record_id = self.kwargs.get('record_pk')
        return PrescriptionItem.objects.filter(record_id=record_id)

class PatientRecordListView(APIView):
    """
    GET /api/records/patient/
    Returns all records for the logged-in patient including prescription items.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        patient_profile = getattr(request.user, 'patient_profile', None)
        if not patient_profile:
            return Response([], status=200)
        records = MedicalRecord.objects.filter(
            patient=patient_profile
        ).prefetch_related('prescription_items').order_by('-created_at')
        return Response(PatientRecordSerializer(records, many=True).data)

class DoctorPatientRecordView(APIView):
    """
    GET /api/records/patient-history/?patient_uid=UID3F2A...
    Doctor views a specific patient's records.
    Requires active consent for this patient at the doctor's hospital.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not hasattr(request.user, 'doctor_profile'):
            return Response({"error": "Only doctors can view patient records."}, status=403)

        from apps.accounts.models import PatientProfile
        patient_uid = request.query_params.get('patient_uid')
        if not patient_uid:
            return Response({"error": "patient_uid is required."}, status=400)

        try:
            patient = PatientProfile.objects.get(patient_uid=patient_uid)
        except PatientProfile.DoesNotExist:
            return Response({"error": "Patient not found."}, status=404)

        hospital = request.user.doctor_profile.hospital

        # Must have active consent
        has_consent = ConsentRequest.objects.filter(
            patient=patient,
            hospital=hospital,
            status='APPROVED',
            expires_at__gt=timezone.now()
        ).exists()

        if not has_consent:
            return Response({"error": "No active consent for this patient."}, status=403)

        records = MedicalRecord.objects.filter(
            patient=patient
        ).prefetch_related('prescription_items').order_by('-created_at')

        return Response(PatientRecordSerializer(records, many=True).data)

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
        patient_id = request.data.get('patient')

        # ── Consent check ──────────────────────────────
        has_consent = ConsentRequest.objects.filter(
            patient_id=patient_id,
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

        serializer = self.get_serializer(data=request.data)
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
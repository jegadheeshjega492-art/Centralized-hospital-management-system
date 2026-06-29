from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from .models import MedicalRecord
from .serializers import MedicalRecordSerializer
from apps.audit.models import AuditLog


class MedicalRecordViewSet(viewsets.ModelViewSet):

    queryset = MedicalRecord.objects.all()
    serializer_class = MedicalRecordSerializer
    permission_classes = [IsAuthenticated]

    def create(self, request, *args, **kwargs):
        """
        Create a Medical Record.
        Also create an AuditLog entry.
        """

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        record = serializer.save()

        AuditLog.objects.create(
            actor=request.user,
            patient=record.patient,
            hospital=record.hospital,
            action=AuditLog.Action.ADD_RECORD,
            ip_address=request.META.get("REMOTE_ADDR"),
            metadata={
                "record_id": record.id,
                "record_type": record.record_type,
            }
        )

        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def retrieve(self, request, *args, **kwargs):
        """
        Retrieve one Medical Record.
        Also log that the record was viewed.
        """

        record = self.get_object()

        AuditLog.objects.create(
            actor=request.user,
            patient=record.patient,
            hospital=record.hospital,
            action=AuditLog.Action.VIEW_RECORD,
            ip_address=request.META.get("REMOTE_ADDR"),
            metadata={
                "record_id": record.id,
            }
        )

        serializer = self.get_serializer(record)

        return Response(serializer.data)
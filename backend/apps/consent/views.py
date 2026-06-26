from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from django.utils import timezone
from datetime import timedelta
from datetime import datetime
from apps.accounts.permissions import IsPatient
from .models import ConsentRequest
from .serializers import ConsentRequestSerializer, ConsentRespondSerializer
from .permissions import IsVerifiedDoctor, IsPatientOwner


class ConsentRequestView(APIView):
    permission_classes = [IsAuthenticated, IsVerifiedDoctor]

    def post(self, request):
        serializer = ConsentRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        consent = serializer.save(
            requested_by=request.user.doctor_profile,
            hospital=request.user.doctor_profile.hospital,
            status='PENDING'
        )
        return Response(
            ConsentRequestSerializer(consent).data,
            status=status.HTTP_201_CREATED
        )


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
                appt.appointment_date,
                appt.end_time,
                tzinfo=timezone.get_current_timezone()
            )
        else:
            expires_at = timezone.now() + timedelta(hours=24)

        consent.status = 'APPROVED'
        consent.consent_method = 'PATIENT_SELF'
        consent.resolved_at = timezone.now()
        consent.expires_at = expires_at
        consent.save()

        return Response(
            ConsentRequestSerializer(consent).data,
            status=status.HTTP_200_OK
        )


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

        return Response(
            ConsentRequestSerializer(consent).data,
            status=status.HTTP_200_OK
        )
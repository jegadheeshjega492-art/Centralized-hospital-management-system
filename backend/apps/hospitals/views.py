from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from .models import Hospital, DoctorProfile
from .serializers import HospitalSerializer, DoctorCreateSerializer, DoctorProfileSerializer
from apps.accounts.permissions import IsHospitalAdmin

class HospitalRegisterView(generics.CreateAPIView):
    """
    POST /api/hospitals/register/
    Anyone can register a hospital. It starts unverified.
    Admin must verify it from the admin panel.
    """
    serializer_class = HospitalSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        hospital = serializer.save(verified=False)
        return Response(
            {
                "message": "Hospital registered successfully. Awaiting admin verification.",
                "hospital": HospitalSerializer(hospital).data
            },
            status=status.HTTP_201_CREATED
        )


class DoctorCreateView(generics.CreateAPIView):
    """
    POST /api/hospitals/doctors/create/
    Only a verified hospital admin can create doctor accounts.
    The doctor is automatically linked to the admin's hospital.
    """
    serializer_class = DoctorCreateSerializer
    permission_classes = [IsAuthenticated, IsHospitalAdmin]

    def create(self, request, *args, **kwargs):
        user = request.user

        # Get the hospital from the doctor profile or a separate field
        # For now, require hospital_id in the request body
        hospital_id = request.data.get('hospital_id')
        try:
            hospital = Hospital.objects.get(id=hospital_id)
        except Hospital.DoesNotExist:
            return Response(
                {"error": "Hospital not found."},
                status=status.HTTP_404_NOT_FOUND
            )

        if not hospital.verified:
            return Response(
                {"error": "Your hospital is not verified yet."},
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = self.get_serializer(data=request.data, context={'hospital': hospital})
        serializer.is_valid(raise_exception=True)
        doctor = serializer.save()

        return Response(
            {
                "message": "Doctor account created successfully.",
                "doctor": DoctorProfileSerializer(doctor).data
            },
            status=status.HTTP_201_CREATED
        )
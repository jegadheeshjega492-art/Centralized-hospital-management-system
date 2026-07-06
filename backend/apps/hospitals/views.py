from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.contrib.auth import get_user_model
from .models import Hospital, DoctorProfile, HospitalAdminProfile
from .serializers import HospitalSerializer, DoctorCreateSerializer, DoctorProfileSerializer
from apps.accounts.permissions import IsHospitalAdmin, IsDoctor
from rest_framework.views import APIView

User = get_user_model()

class HospitalDashboardView(APIView):
    """
    GET /api/hospitals/dashboard/
    Returns logged-in hospital admin's hospital info + doctors list.
    """
    permission_classes = [IsAuthenticated, IsHospitalAdmin]

    def get(self, request):
        hospital = request.user.hospital_admin_profile.hospital
        doctors  = hospital.doctors.select_related('user').all()
        return Response({
            "hospital": HospitalSerializer(hospital).data,
            "doctors":  DoctorProfileSerializer(doctors, many=True).data,
        })


class DoctorDashboardView(APIView):
    """
    GET /api/hospitals/doctor-profile/
    Returns logged-in doctor's own profile info.
    """
    permission_classes = [IsAuthenticated, IsDoctor]

    def get(self, request):
        try:
            doctor = request.user.doctor_profile
        except Exception:
            return Response({"error": "Doctor profile not found."}, status=404)
        return Response(DoctorProfileSerializer(doctor).data)


class HospitalRegisterView(generics.CreateAPIView):
    serializer_class = HospitalSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        username = request.data.get('username')
        password = request.data.get('password')

        if not username or not password:
            return Response(
                {"error": "Admin username and password are required."},
                status=status.HTTP_400_BAD_REQUEST
            )
        if User.objects.filter(username=username).exists():
            return Response(
                {"error": "That username is already taken."},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        hospital = serializer.save(verified=False)

        admin_user = User.objects.create_user(
            username=username,
            password=password,
            email=hospital.contact_email,
            role='HOSPITAL_ADMIN'
        )
        HospitalAdminProfile.objects.create(user=admin_user, hospital=hospital)

        return Response(
            {
                "message": "Hospital registered. Awaiting admin verification.",
                "hospital": HospitalSerializer(hospital).data
            },
            status=status.HTTP_201_CREATED
        )


class DoctorCreateView(generics.CreateAPIView):
    serializer_class = DoctorCreateSerializer
    permission_classes = [IsAuthenticated,IsHospitalAdmin]

    def create(self, request, *args, **kwargs):
        user = request.user

        if not hasattr(user, 'hospital_admin_profile'):
            return Response(
                {"error": "Only hospital admins can create doctor accounts."},
                status=status.HTTP_403_FORBIDDEN
            )

        hospital = user.hospital_admin_profile.hospital

        if not hospital.verified:
            return Response(
                {"error": "Your hospital is not verified yet. Contact the system admin."},
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
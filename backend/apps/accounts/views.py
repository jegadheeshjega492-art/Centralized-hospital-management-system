from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny
from .serializers import PatientRegisterSerializer, UserSerializer
from rest_framework_simplejwt.views import TokenObtainPairView
from .serializers import MyTokenObtainPairSerializer
from rest_framework.permissions import IsAuthenticated

class PatientRegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = PatientRegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            return Response(
                {'message': 'Patient registered successfully.',
                 'user': UserSerializer(user).data},
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class MeView(APIView):
    """Returns the currently logged-in user's basic info."""
    def get(self, request):
        return Response(UserSerializer(request.user).data)

class MyTokenObtainPairView(TokenObtainPairView):
    serializer_class = MyTokenObtainPairSerializer

class PatientProfileView(APIView):
    """
    GET /api/auth/patient-profile/
    Returns the logged-in patient's full profile details.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            profile = request.user.patient_profile
        except Exception:
            return Response({"error": "Patient profile not found."}, status=404)

        return Response({
            "full_name":      profile.full_name,
            "patient_uid":    profile.patient_uid,
            "dob":            str(profile.dob),
            "gender":         profile.gender,
            "contact_number": profile.contact_number,
            "email":          request.user.email,
            "username":       request.user.username,
        })
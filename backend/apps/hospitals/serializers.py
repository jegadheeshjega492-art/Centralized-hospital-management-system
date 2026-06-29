
from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Hospital, DoctorProfile

User = get_user_model()


class HospitalSerializer(serializers.ModelSerializer):
    class Meta:
        model = Hospital
        fields = ['id', 'name', 'registration_number', 'address', 'contact_email', 'verified', 'created_at']
        read_only_fields = ['verified', 'created_at']


class DoctorCreateSerializer(serializers.ModelSerializer):
    # User fields for creating the doctor's login account
    username = serializers.CharField(write_only=True)
    email = serializers.EmailField(write_only=True)
    password = serializers.CharField(write_only=True, min_length=8)
    first_name = serializers.CharField(write_only=True)
    last_name = serializers.CharField(write_only=True)

    class Meta:
        model = DoctorProfile
        fields = ['username', 'email', 'password', 'first_name', 'last_name',
                  'license_number', 'department']

    def create(self, validated_data):
        # Pop user fields out
        username = validated_data.pop('username')
        email = validated_data.pop('email')
        password = validated_data.pop('password')
        first_name = validated_data.pop('first_name')
        last_name = validated_data.pop('last_name')

        # Create the User
        user = User.objects.create_user(
            username=username,
            email=email,
            password=password,
            first_name=first_name,
            last_name=last_name,
            role='DOCTOR'
        )

        # Hospital comes from the request (injected by the view)
        hospital = self.context['hospital']

        doctor = DoctorProfile.objects.create(
            user=user,
            hospital=hospital,
            **validated_data
        )
        return doctor


class DoctorProfileSerializer(serializers.ModelSerializer):
    doctor_name = serializers.SerializerMethodField()
    hospital_name = serializers.CharField(source='hospital.name', read_only=True)

    class Meta:
        model = DoctorProfile
        fields = ['id', 'doctor_name', 'hospital_name', 'license_number', 'department', 'verified', 'created_at']

    def get_doctor_name(self, obj):
        return f"Dr. {obj.user.get_full_name() or obj.user.username}"
from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import PatientProfile
import hashlib
import uuid

User = get_user_model()


class PatientRegisterSerializer(serializers.ModelSerializer):
    full_name      = serializers.CharField(write_only=True)
    dob            = serializers.DateField(write_only=True)
    gender         = serializers.CharField(write_only=True)
    contact_number = serializers.CharField(write_only=True)
    aadhaar_number = serializers.CharField(write_only=True, min_length=12, max_length=12)  # ← changed
    password       = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model  = User
        fields = ['username', 'email', 'password',
                  'full_name', 'dob', 'gender', 'contact_number', 'aadhaar_number']  # ← changed

    def create(self, validated_data):
        profile_fields = {
            'full_name':      validated_data.pop('full_name'),
            'dob':            validated_data.pop('dob'),
            'gender':         validated_data.pop('gender'),
            'contact_number': validated_data.pop('contact_number'),
            'aadhaar_hash':   hashlib.sha256(validated_data.pop('aadhaar_number').encode()).hexdigest(),  # ← changed
        }
        validated_data['role'] = 'PATIENT'
        user = User.objects.create_user(**validated_data)

        PatientProfile.objects.create(
            user=user,
            patient_uid=f"UID{uuid.uuid4().hex[:10].upper()}",
            **profile_fields,
        )
        return user


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model  = User
        fields = ['id', 'username', 'email', 'role']

from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)

        # Add custom fields into the JWT payload
        token['role'] = user.role

        # Add patient_uid if the user is a patient
        if user.role == 'PATIENT':
            try:
                token['patient_uid'] = user.patient_profile.patient_uid
            except PatientProfile.DoesNotExist:
                token['patient_uid'] = None

        return token
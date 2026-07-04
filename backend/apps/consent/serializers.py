from rest_framework import serializers
from django.utils import timezone
from .models import ConsentRequest, Appointment
from apps.accounts.models import PatientProfile

class ConsentRequestSerializer(serializers.ModelSerializer):
    patient_name = serializers.CharField(source='patient.full_name', read_only=True)
    doctor_name = serializers.SerializerMethodField()
    hospital_name = serializers.CharField(source='hospital.name', read_only=True)

    def get_doctor_name(self, obj):
        return obj.requested_by.user.get_full_name() or obj.requested_by.user.username

    class Meta:
        model = ConsentRequest
        fields = [
            'id', 'patient', 'patient_name',
            'hospital', 'hospital_name',
            'requested_by', 'doctor_name',
            'status', 'consent_method',
            'appointment',
            'requested_at', 'resolved_at', 'expires_at',
        ]
        read_only_fields = [
            'id', 'status', 'consent_method',
            'requested_at', 'resolved_at',
            'requested_by', 'hospital',
        ]

    def validate(self, data):
        if data.get('expires_at') and data['expires_at'] <= timezone.now():
            raise serializers.ValidationError("expires_at must be in the future")
        return data


class ConsentRespondSerializer(serializers.Serializer):
    action = serializers.ChoiceField(choices=['APPROVE', 'DENY'])


class AppointmentSerializer(serializers.ModelSerializer):
    # Accept patient_uid string instead of database ID
    patient_uid = serializers.CharField(write_only=True)

    class Meta:
        model = Appointment
        fields = [
            'id', 'patient_uid', 'patient',
            'hospital', 'doctor',
            'appointment_date', 'start_time', 'end_time',
            'access_method', 'otp_hash', 'otp_verified',
            'verified_by_staff', 'status', 'created_at',
        ]
        read_only_fields = [
            'id', 'patient', 'otp_hash', 'otp_verified',
            'verified_by_staff', 'status', 'created_at'
        ]

    def validate_patient_uid(self, value):
        try:
            profile = PatientProfile.objects.get(patient_uid=value)
            return profile
        except PatientProfile.DoesNotExist:
            raise serializers.ValidationError(
                f"No patient found with UID '{value}'. Check the UID and try again."
            )

    def create(self, validated_data):
        # patient_uid has been resolved to a PatientProfile object by validate_patient_uid
        patient_profile = validated_data.pop('patient_uid')
        return Appointment.objects.create(patient=patient_profile, **validated_data)


class OTPVerifySerializer(serializers.Serializer):
    otp = serializers.CharField(max_length=6, min_length=6)
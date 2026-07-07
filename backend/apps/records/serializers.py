from rest_framework import serializers
from .models import MedicalRecord, PrescriptionItem


class PrescriptionItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = PrescriptionItem
        fields = ['id', 'tablet_name', 'dosage', 'frequency', 'duration', 'notes']


class MedicalRecordSerializer(serializers.ModelSerializer):
    prescription_items = PrescriptionItemSerializer(many=True, write_only=True, required=False)
    created_by_name = serializers.SerializerMethodField()
    patient_name = serializers.CharField(source='patient.full_name', read_only=True)
    hospital_name = serializers.CharField(source='hospital.name', read_only=True)

    class Meta:
        model = MedicalRecord
        fields = [
            'id', 'patient', 'patient_name', 'hospital', 'hospital_name',
            'created_by', 'created_by_name', 'record_type', 'title',
            'hospital_address', 'reason_for_visit',
            'details', 'attachment_url', 'source', 'created_at',
            'prescription_items',
        ]
        read_only_fields = ['id', 'created_by', 'hospital', 'created_at']

    def get_created_by_name(self, obj):
        if obj.created_by:
            return obj.created_by.user.get_full_name() or obj.created_by.user.username
        return None

    def create(self, validated_data):
        # Pop prescription_items before creating the MedicalRecord
        # — it's a reverse relation, not a real model field,
        # so passing it to objects.create() would crash.
        # The view handles bulk_create separately.
        validated_data.pop('prescription_items', [])
        return MedicalRecord.objects.create(**validated_data)

class PatientRecordSerializer(serializers.ModelSerializer):
    prescription_items = PrescriptionItemSerializer(many=True, read_only=True)
    hospital_name      = serializers.CharField(source='hospital.name',      read_only=True)
    created_by_name    = serializers.SerializerMethodField()

    class Meta:
        model  = MedicalRecord
        fields = [
            'id', 'record_type', 'title', 'details',
            'hospital_name', 'hospital_address', 'reason_for_visit',
            'created_by_name',
            'attachment_url', 'created_at',
            'prescription_items',
        ]

    def get_created_by_name(self, obj):
        if not obj.created_by:
            return 'Unknown'
        return f"Dr. {obj.created_by.user.get_full_name() or obj.created_by.user.username}"

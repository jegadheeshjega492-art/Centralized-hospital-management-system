from rest_framework import serializers
from .models import AuditLog

class AuditLogSerializer(serializers.ModelSerializer):
    actor_name    = serializers.SerializerMethodField()
    hospital_name = serializers.CharField(source='hospital.name', read_only=True)

    class Meta:
        model  = AuditLog
        fields = ['id', 'action', 'actor_name', 'hospital_name', 'timestamp', 'metadata']

    def get_actor_name(self, obj):
        if not obj.actor:
            return 'System'
        full = obj.actor.get_full_name()
        return full if full else obj.actor.username

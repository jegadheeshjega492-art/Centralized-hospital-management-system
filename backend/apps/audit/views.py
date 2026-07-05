from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import AuditLog
from .serializers import AuditLogSerializer

class AuditLogListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        patient_profile = getattr(request.user, 'patient_profile', None)
        if not patient_profile:
            return Response([], status=200)
        logs = AuditLog.objects.filter(
            patient=patient_profile
        ).select_related('actor', 'hospital').order_by('-timestamp')
        return Response(AuditLogSerializer(logs, many=True).data)

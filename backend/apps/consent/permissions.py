from rest_framework.permissions import BasePermission


class IsVerifiedDoctor(BasePermission):
    """Only doctors with a doctor_profile can create consent requests."""
    def has_permission(self, request, view):
        try:
            # Just check the doctor_profile exists — verified field removed
            return hasattr(request.user, 'doctor_profile') and request.user.doctor_profile is not None
        except AttributeError:
            return False


class IsPatientOwner(BasePermission):
    """Only the patient named in the consent can approve/deny."""
    def has_object_permission(self, request, view, obj):
        try:
            return obj.patient.user == request.user
        except AttributeError:
            return False
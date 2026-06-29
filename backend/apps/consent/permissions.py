from rest_framework.permissions import BasePermission


class IsVerifiedDoctor(BasePermission):
    """Only verified doctors can create consent requests."""
    def has_permission(self, request, view):
        try:
            return request.user.doctor_profile.verified
        except AttributeError:
            return False


class IsPatientOwner(BasePermission):
    """Only the patient named in the consent can approve/deny."""
    def has_object_permission(self, request, view, obj):
        try:
            return obj.patient.user == request.user
        except AttributeError:
            return False
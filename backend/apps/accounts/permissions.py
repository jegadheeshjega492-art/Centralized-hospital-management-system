from rest_framework.permissions import BasePermission


class IsPatient(BasePermission):
    """
    Allow access only to users with the PATIENT role.
    Usage in any view:
        permission_classes = [IsAuthenticated, IsPatient]
    """
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == 'PATIENT')


class IsDoctor(BasePermission):
    """
    Allow access only to users with the DOCTOR role.
    Usage in any view:
        permission_classes = [IsAuthenticated, IsDoctor]
    """
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == 'DOCTOR')


class IsHospitalAdmin(BasePermission):
    """
    Allow access only to users with the HOSPITAL_ADMIN role.
    Usage in any view:
        permission_classes = [IsAuthenticated, IsHospitalAdmin]
    """
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == 'HOSPITAL_ADMIN')


class IsPatientOrDoctor(BasePermission):
    """
    Allow access to both PATIENT and DOCTOR roles.
    Useful for endpoints like viewing medical records —
    a patient views their own, a doctor views their patient's.
    Usage:
        permission_classes = [IsAuthenticated, IsPatientOrDoctor]
    """
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated
                    and request.user.role in ('PATIENT', 'DOCTOR'))
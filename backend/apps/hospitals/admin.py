from django.contrib import admin
from .models import Hospital, DoctorProfile


@admin.register(Hospital)
class HospitalAdmin(admin.ModelAdmin):
    list_display = ('name', 'registration_number', 'contact_email', 'created_at')
    search_fields = ('name', 'registration_number', 'contact_email')

    @admin.action(description='Mark selected hospitals as verified')
    def mark_as_verified(self, request, queryset):
        updated = queryset.update(verified=True)
        self.message_user(request, f'{updated} hospital(s) successfully marked as verified.')


@admin.register(DoctorProfile)
class DoctorProfileAdmin(admin.ModelAdmin):
    list_display = ('get_doctor_name', 'hospital', 'department', 'license_number', 'created_at')
    list_filter = ('hospital',)
    search_fields = ('user__username', 'user__first_name', 'user__last_name', 'license_number',)
    @admin.display(description='Doctor Name')
    def get_doctor_name(self, obj):
        return f"Dr. {obj.user.get_full_name() or obj.user.username}"

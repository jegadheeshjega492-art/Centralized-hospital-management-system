from django.urls import path
from .views import HospitalRegisterView, DoctorCreateView, HospitalDashboardView, DoctorDashboardView

urlpatterns = [
    path('register/',         HospitalRegisterView.as_view(),  name='hospital-register'),
    path('doctors/create/',   DoctorCreateView.as_view(),      name='doctor-create'),
    path('dashboard/',        HospitalDashboardView.as_view(), name='hospital-dashboard'),
    path('doctor-profile/',   DoctorDashboardView.as_view(),   name='doctor-profile'),
]

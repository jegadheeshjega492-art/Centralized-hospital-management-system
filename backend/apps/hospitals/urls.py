from django.urls import path
from .views import HospitalRegisterView, DoctorCreateView

urlpatterns = [
    path('register/', HospitalRegisterView.as_view(), name='hospital-register'),
    path('doctors/create/', DoctorCreateView.as_view(), name='doctor-create'),
]

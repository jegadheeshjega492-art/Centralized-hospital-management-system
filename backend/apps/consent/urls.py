from django.urls import path
from . import views

urlpatterns = [
    path('request/', views.ConsentRequestView.as_view()),
    path('<int:pk>/approve/', views.ConsentApproveView.as_view()),
    path('<int:pk>/deny/', views.ConsentDenyView.as_view()),
    path('appointments/', views.AppointmentCreateView.as_view()),
    path('appointments/<int:pk>/verify-otp/', views.OTPVerifyView.as_view()),
    path('appointments/<int:pk>/verify-manual/', views.ManualVerifyView.as_view()),
    path('check/', views.CheckConsentView.as_view()),
]
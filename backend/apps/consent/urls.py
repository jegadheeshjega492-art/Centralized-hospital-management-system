from django.urls import path
from . import views

urlpatterns = [
    path('request/', views.ConsentRequestView.as_view()),
    path('<int:pk>/approve/', views.ConsentApproveView.as_view()),
    path('<int:pk>/deny/', views.ConsentDenyView.as_view()),
]
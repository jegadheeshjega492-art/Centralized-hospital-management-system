from django.urls import path
from rest_framework_nested import routers
from rest_framework.routers import DefaultRouter
from .views import MedicalRecordViewSet, PrescriptionItemViewSet, PatientRecordListView

router = DefaultRouter()
router.register(r'medical-records', MedicalRecordViewSet, basename='medical-records')

records_router = routers.NestedDefaultRouter(router, r'medical-records', lookup='record')
records_router.register(r'prescriptions', PrescriptionItemViewSet, basename='record-prescriptions')

urlpatterns = router.urls + records_router.urls
urlpatterns += [path('patient/', PatientRecordListView.as_view(), name='patient-records')]
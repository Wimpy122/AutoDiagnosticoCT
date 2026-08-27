from django.urls import path
from . import views

urlpatterns = [
    # Tu vista principal que carga el HTML (antes era path('', ...))
    path('autodiagnostico/', views.diagnostico_view, name='diagnostico'),

    # Tus rutas puente de la API (agregándoles el prefijo)
    path('autodiagnostico/api/local/evaluaciones', views.proxy_evaluaciones),
    path('autodiagnostico/api/local/evaluaciones/<str:assessment_id>/respuestas', views.proxy_respuestas),
    path('autodiagnostico/api/local/evaluaciones/<str:assessment_id>/resultados', views.proxy_resultados),
]
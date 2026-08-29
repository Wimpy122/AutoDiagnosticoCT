import requests
import json
from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt

def welcome_view(request):
    return render(request, 'home.html')

def diagnostico_view(request):
    return render(request, 'diagnostico.html')

@csrf_exempt
def proxy_evaluaciones(request):
    url = 'http://lw03.ddns.net:9000/api/evaluaciones'
    if request.method == 'POST':
        # Capturamos el body que envíe nuestro JS y lo mandamos a la API
        body = json.loads(request.body) if request.body else {}
        response = requests.post(url, json=body)
        
        try:
            res_data = response.json()
        except:
            res_data = {"error": "Respuesta no válida de la API"}
            
        return JsonResponse(res_data, safe=False, status=response.status_code)

@csrf_exempt
def proxy_cuestionario(request):
    url = 'http://lw03.ddns.net:9000/api/cuestionario'
    if request.method == 'GET':
        response = requests.get(url)
        return JsonResponse(response.json(), safe=False, status=response.status_code)

@csrf_exempt
def proxy_respuestas(request, assessment_id):
    url = f'http://lw03.ddns.net:9000/api/evaluaciones/{assessment_id}/respuestas'
    if request.method == 'PUT':
        body = json.loads(request.body)
        response = requests.put(url, json=body)
        
        # Manejo por si la API no devuelve un JSON al guardar
        try:
            res_data = response.json()
        except:
            res_data = {"status": "ok"}
            
        return JsonResponse(res_data, safe=False, status=response.status_code)

@csrf_exempt
def proxy_resultados(request, assessment_id):
    # Verifica si en tu Swagger el endpoint real se llama /resultados o tiene otra ruta
    url = f'http://lw03.ddns.net:9000/api/evaluaciones/{assessment_id}/resultados'
    if request.method == 'GET':
        response = requests.get(url)
        try:
            res_data = response.json()
        except:
            res_data = {}
        return JsonResponse(res_data, safe=False, status=response.status_code)
from django.db import models

# Create your models here.

class TipoCompetencia(models.TextChoices):
    DIRECTA = 'Directa', 'Directa'
    COMPARTIDA = 'Compartida', 'Compartida'
    DELEGADA = 'Delegada/Concesionada', 'Delegada/Concesionada'
    INDIRECTA = 'Indirecta', 'Indirecta'
    NO_APLICA = 'No aplica', 'No aplica'

class NivelMadurez(models.TextChoices):
    NO_EXISTE = '0', '0 - No existe'
    PLANIFICACION = '1', '1 - En planificación'
    PARCIAL = '2', '2 - Implementación parcial'
    CONSOLIDADA = '3', '3 - Implementación consolidada'
    MEJORA_CONTINUA = '4', '4 - Referente o mejora continua'

# Modelo para almacenar el diagnóstico general de una entidad
class Diagnostico(models.Model):
    entidad = models.CharField(max_length=200) # Ej: Nombre de la municipalidad
    fecha_creacion = models.DateTimeField(auto_now_add=True)

# Modelo para las preguntas (puedes pre-cargarlas desde el excel luego)
class Pregunta(models.Model):
    eje = models.CharField(max_length=50, default="Eje A - Gobernanza")
    texto = models.TextField() 
    
    def __str__(self):
        return self.texto

# Modelo para las respuestas
class Respuesta(models.Model):
    diagnostico = models.ForeignKey(Diagnostico, on_delete=models.CASCADE, related_name='respuestas')
    pregunta = models.ForeignKey(Pregunta, on_delete=models.CASCADE)
    competencia = models.CharField(
        max_length=30, 
        choices=TipoCompetencia.choices,
        verbose_name="Tipo de competencia municipal"
    )
    madurez = models.CharField(
        max_length=2,
        choices=NivelMadurez.choices,
        verbose_name="Nivel de madurez (0-4)"
    )
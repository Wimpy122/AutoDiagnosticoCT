#!/bin/bash
# Activar entorno virtual (opcional) source venv/bin/activate Navegar al directorio del proyecto (opcional) cd 
# /ruta/a/tu/proyecto Iniciar Django con PM2 en modo desarrollo

export PATH="/home/cgarcia/.pyenv/bin:$PATH"
eval "$(pyenv init -)"
eval "$(pyenv virtualenv-init -)"

pyenv activate dj

pm2 start "python manage.py runserver 0.0.0.0:8082" --name autodiag_app


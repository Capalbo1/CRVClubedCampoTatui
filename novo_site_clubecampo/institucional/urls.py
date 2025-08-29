# institucional/urls.py
from django.urls import path
from . import views

urlpatterns = [
    path("inicio/", views.inicio, name="inicio"),
    path("estrutura/", views.estrutura, name="estrutura"),
    path("institucional/", views.institucional, name="institucional"),
    # Formulário de contato (POST)
    path("contato/enviar/", views.enviar_contato, name="contato_enviar"),
]

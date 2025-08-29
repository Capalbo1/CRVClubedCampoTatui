# <projeto>/urls.py
from django.contrib import admin
from django.urls import path, include
from django.views.generic import RedirectView
from django.conf import settings
from django.views.static import serve
import os

urlpatterns = [
    path('admin/', admin.site.urls),

    # Redireciona a raiz para a Home usando o nome da rota
    path('', RedirectView.as_view(pattern_name='inicio', permanent=False)),

    # Rotas da app institucional
    path('', include('institucional.urls')),
]

# Força o Django a servir arquivos estáticos em DEBUG
if settings.DEBUG:
    urlpatterns += [
        path('static/<path:path>', serve, {
            'document_root': os.path.join(settings.BASE_DIR, 'static'),
            'show_indexes': True
        }),
    ]

from django.urls import path, include, re_path
from django.http import HttpResponse
from django.views.static import serve
from pathlib import Path

BASE_DIR  = Path(__file__).resolve().parent.parent
VITE_DIST = BASE_DIR / 'frontend' / 'dist'

def landing_view(request):
    with open(BASE_DIR / 'templates' / 'index.html', 'r', encoding='utf-8') as f:
        return HttpResponse(f.read(), content_type='text/html')

def vite_view(request):
    idx = VITE_DIST / 'index.html'
    if not idx.exists():
        return HttpResponse(
            '<div style="font-family:monospace;padding:40px;background:#0d0d1a;color:#fff">'
            '<h2 style="color:#7339c7">⚠️ Frontend build topilmadi</h2>'
            '<p>Quyidagi buyruqni bajaring:</p>'
            '<code style="background:#1a1a2e;padding:8px 16px;border-radius:8px;display:block;margin:12px 0">'
            'cd frontend &amp;&amp; npm run build'
            '</code></div>',
            status=503, content_type='text/html'
        )
    with open(idx, 'r', encoding='utf-8') as f:
        return HttpResponse(f.read(), content_type='text/html')

urlpatterns = [
    # Django API
    path('api/', include('api.urls')),

    # CV va media fayllar
    re_path(r'^media/(?P<path>.+)$', serve, {'document_root': str(BASE_DIR / 'media')}),

    # Vite compiled assets  (/assets/index-xxx.js, /assets/index-xxx.css)
    re_path(r'^assets/(?P<path>.+)$', serve, {'document_root': str(VITE_DIST / 'assets')}),

    # CRM Dashboard — bularni Vite React app handle qiladi
    re_path(r'^(?:admin|manager|teacher|student|login|register)(?:/.*)?$', vite_view),

    # Landing page — qolgan barcha URL
    re_path(r'^.*$', landing_view),
]

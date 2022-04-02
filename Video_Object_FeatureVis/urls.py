"""Video_Object_FeatureVis URL Configuration

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/2.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""

from django.urls import path, re_path
from . import views
from django.views.static import serve

from django.contrib.staticfiles.urls import staticfiles_urlpatterns

urlpatterns = [
    path('', views.index),
    # path('', views.query),
    path('index.html/', views.index),
    path('getAim/', views.getAim),
    path('filter/', views.filter),
    path('show_front/', views.show_front),
    path('filter_pid/', views.filter_pid),
    path('getAim_tojson/', views.getAim_tojson),
    path('graph_propagation/', views.graph_propagation),
    path('graph_propagation_optimize/', views.graph_propagation_optimize),
    path('graph_propagation_multi_SVM/', views.graph_propagation_multi_SVM),
    path('overview_update/', views.overview_update),
    re_path(r'^static/(?P<path>.*)$', serve, {'document_root': 'E:\Python Project\Video_Object_FeatureVis\static'})
]

from django.urls import include, path
from rest_framework.routers import DefaultRouter

from platform_admin.views import (
    AccountDetailView,
    AccountListCreateView,
    ApiServiceViewSet,
    FeaturePermissionViewSet,
    HealthView,
    LoginView,
    LogoutView,
    MeView,
    UsageResourceViewSet,
)

router = DefaultRouter()
router.register("admin/permissions", FeaturePermissionViewSet, basename="permission")
router.register("admin/usage", UsageResourceViewSet, basename="usage")
router.register("admin/apis", ApiServiceViewSet, basename="api-service")

urlpatterns = [
    path("health/", HealthView.as_view(), name="health"),
    path("auth/login/", LoginView.as_view(), name="login"),
    path("auth/me/", MeView.as_view(), name="me"),
    path("auth/logout/", LogoutView.as_view(), name="logout"),
    path("admin/accounts/", AccountListCreateView.as_view(), name="accounts"),
    path("admin/accounts/<int:pk>/", AccountDetailView.as_view(), name="account-detail"),
    path("", include(router.urls)),
]

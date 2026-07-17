from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.authtoken.models import Token
from rest_framework.test import APIClient

from platform_admin.models import ApiService, FeaturePermission, UsageResource


class AdminApiTests(TestCase):
    def setUp(self):
        self.admin = get_user_model().objects.create_superuser(
            username="test-admin",
            email="admin@example.test",
            password="test-password-only",
        )
        token = Token.objects.create(user=self.admin)
        self.client = APIClient()
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {token.key}")

    def test_health_is_public(self):
        client = APIClient()
        self.assertEqual(client.get("/api/health/").status_code, 200)

    def test_account_list_requires_admin(self):
        response = self.client.get("/api/admin/accounts/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.json()["accounts"]), 1)

    def test_login_rejects_non_staff_accounts(self):
        get_user_model().objects.create_user(
            username="login-member",
            password="test-password-only",
        )
        client = APIClient()
        response = client.post(
            "/api/auth/login/",
            {"username": "login-member", "password": "test-password-only"},
            format="json",
        )
        self.assertEqual(response.status_code, 400)

    def test_account_can_be_created_and_updated(self):
        create_response = self.client.post(
            "/api/admin/accounts/",
            {
                "name": "Example Member",
                "email": "member@example.test",
                "department": "Operations",
                "role": "member",
                "status": "invited",
            },
            format="json",
        )
        self.assertEqual(create_response.status_code, 201)
        account_id = create_response.json()["account"]["id"]
        update_response = self.client.patch(
            f"/api/admin/accounts/{account_id}/",
            {"status": "active"},
            format="json",
        )
        self.assertEqual(update_response.status_code, 200)
        self.assertEqual(update_response.json()["account"]["status"], "active")

    def test_permissions_are_persisted(self):
        create_response = self.client.post(
            "/api/admin/permissions/",
            {
                "key": "reports",
                "label": "Reports",
                "description": "Reporting area",
                "admin_visible": True,
                "member_visible": False,
            },
            format="json",
        )
        self.assertEqual(create_response.status_code, 201)
        permission = FeaturePermission.objects.get(key="reports")
        update_response = self.client.patch(
            f"/api/admin/permissions/{permission.id}/",
            {"member_visible": True},
            format="json",
        )
        self.assertEqual(update_response.status_code, 200)
        permission.refresh_from_db()
        self.assertTrue(permission.member_visible)

    def test_usage_resource_can_be_managed(self):
        create_response = self.client.post(
            "/api/admin/usage/",
            {
                "key": "documents",
                "label": "Documents",
                "current_value": 10,
                "limit_value": 100,
                "unit": "items",
            },
            format="json",
        )
        self.assertEqual(create_response.status_code, 201)
        resource = UsageResource.objects.get(key="documents")
        self.assertEqual(create_response.json()["percent_used"], 10)
        update_response = self.client.patch(
            f"/api/admin/usage/{resource.id}/",
            {"current_value": 25},
            format="json",
        )
        self.assertEqual(update_response.status_code, 200)
        self.assertEqual(update_response.json()["percent_used"], 25)

    def test_api_service_can_be_registered(self):
        response = self.client.post(
            "/api/admin/apis/",
            {
                "name": "Example API",
                "base_url": "https://api.example.test",
                "openapi_url": "https://api.example.test/openapi.json",
                "description": "Non-production test service",
                "enabled": True,
            },
            format="json",
        )
        self.assertEqual(response.status_code, 201)
        self.assertTrue(ApiService.objects.filter(name="Example API").exists())

    def test_member_cannot_access_admin_api(self):
        member = get_user_model().objects.create_user(
            username="test-member",
            password="test-password-only",
        )
        token = Token.objects.create(user=member)
        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f"Token {token.key}")
        self.assertEqual(client.get("/api/admin/usage/").status_code, 403)

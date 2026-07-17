from django.contrib.auth import get_user_model
from rest_framework import serializers

from platform_admin.models import (
    AccountProfile,
    ApiService,
    FeaturePermission,
    UsageResource,
)


def display_name(user) -> str:
    return user.get_full_name().strip() or user.get_username()


class UserSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    username = serializers.CharField()
    email = serializers.EmailField(allow_blank=True)
    name = serializers.CharField()
    is_staff = serializers.BooleanField()


class LoginRequestSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True, trim_whitespace=False)


class AuthSessionSerializer(serializers.Serializer):
    token = serializers.CharField()
    user = UserSerializer()


class MeResponseSerializer(serializers.Serializer):
    user = UserSerializer()


class HealthSerializer(serializers.Serializer):
    status = serializers.CharField()


class AccountSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    username = serializers.CharField()
    name = serializers.CharField()
    email = serializers.EmailField(allow_blank=True)
    department = serializers.CharField(allow_blank=True)
    role = serializers.ChoiceField(choices=["admin", "member"])
    status = serializers.ChoiceField(choices=AccountProfile.Status.values)
    last_login = serializers.DateTimeField(allow_null=True)
    created_at = serializers.DateTimeField()
    updated_by = serializers.CharField(allow_blank=True)


class AccountListResponseSerializer(serializers.Serializer):
    accounts = AccountSerializer(many=True)


class AccountResponseSerializer(serializers.Serializer):
    account = AccountSerializer()


class AccountWriteSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=150, required=False)
    email = serializers.EmailField(required=False)
    department = serializers.CharField(max_length=100, required=False, allow_blank=True)
    role = serializers.ChoiceField(choices=["admin", "member"], required=False)
    status = serializers.ChoiceField(choices=AccountProfile.Status.values, required=False)

    def validate_email(self, value):
        value = value.strip().lower()
        user_id = self.context.get("user_id")
        users = get_user_model().objects.filter(email__iexact=value)
        if user_id:
            users = users.exclude(id=user_id)
        if users.exists():
            raise serializers.ValidationError("An account with this email already exists.")
        return value


class FeaturePermissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = FeaturePermission
        fields = [
            "id",
            "key",
            "label",
            "description",
            "admin_visible",
            "member_visible",
            "updated_at",
        ]
        read_only_fields = ["id", "updated_at"]


class UsageResourceSerializer(serializers.ModelSerializer):
    percent_used = serializers.SerializerMethodField()

    class Meta:
        model = UsageResource
        fields = [
            "id",
            "key",
            "label",
            "current_value",
            "limit_value",
            "unit",
            "description",
            "percent_used",
            "updated_at",
        ]
        read_only_fields = ["id", "percent_used", "updated_at"]

    def get_percent_used(self, obj) -> int | None:
        if not obj.limit_value:
            return None
        return min(100, round((obj.current_value / obj.limit_value) * 100))


class ApiServiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = ApiService
        fields = [
            "id",
            "name",
            "base_url",
            "openapi_url",
            "description",
            "enabled",
            "updated_at",
        ]
        read_only_fields = ["id", "updated_at"]

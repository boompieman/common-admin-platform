from django.conf import settings
from django.db import models


class AccountProfile(models.Model):
    class Status(models.TextChoices):
        ACTIVE = "active", "Active"
        INVITED = "invited", "Invited"
        DISABLED = "disabled", "Disabled"

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="admin_platform_profile",
    )
    department = models.CharField(max_length=100, blank=True)
    status = models.CharField(
        max_length=16,
        choices=Status.choices,
        default=Status.ACTIVE,
        db_index=True,
    )
    updated_by_name = models.CharField(max_length=150, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["user__username"]


class FeaturePermission(models.Model):
    key = models.SlugField(max_length=100, unique=True)
    label = models.CharField(max_length=150)
    description = models.CharField(max_length=255, blank=True)
    admin_visible = models.BooleanField(default=True)
    member_visible = models.BooleanField(default=False)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["key"]


class UsageResource(models.Model):
    key = models.SlugField(max_length=100, unique=True)
    label = models.CharField(max_length=150)
    current_value = models.PositiveBigIntegerField(default=0)
    limit_value = models.PositiveBigIntegerField(null=True, blank=True)
    unit = models.CharField(max_length=32, default="items")
    description = models.CharField(max_length=255, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["key"]


class ApiService(models.Model):
    name = models.CharField(max_length=150, unique=True)
    base_url = models.URLField()
    openapi_url = models.URLField(blank=True)
    description = models.CharField(max_length=255, blank=True)
    enabled = models.BooleanField(default=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["name"]

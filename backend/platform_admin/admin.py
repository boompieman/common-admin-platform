from django.contrib import admin

from platform_admin.models import (
    AccountProfile,
    ApiService,
    FeaturePermission,
    UsageResource,
)

admin.site.register(AccountProfile)
admin.site.register(FeaturePermission)
admin.site.register(UsageResource)
admin.site.register(ApiService)

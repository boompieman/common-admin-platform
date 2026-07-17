from django.contrib.auth import authenticate, get_user_model
from django.db import transaction
from drf_spectacular.utils import OpenApiResponse, extend_schema
from rest_framework import status, viewsets
from rest_framework.authentication import SessionAuthentication, TokenAuthentication
from rest_framework.authtoken.models import Token
from rest_framework.permissions import AllowAny, IsAdminUser, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from platform_admin.models import (
    AccountProfile,
    ApiService,
    FeaturePermission,
    UsageResource,
)
from platform_admin.serializers import (
    AccountListResponseSerializer,
    AccountResponseSerializer,
    AccountSerializer,
    AccountWriteSerializer,
    ApiServiceSerializer,
    AuthSessionSerializer,
    FeaturePermissionSerializer,
    HealthSerializer,
    LoginRequestSerializer,
    MeResponseSerializer,
    UsageResourceSerializer,
    display_name,
)


def profile_for(user):
    profile, _ = AccountProfile.objects.get_or_create(
        user=user,
        defaults={"status": "active" if user.is_active else "disabled"},
    )
    return profile


def account_data(user):
    profile = profile_for(user)
    return {
        "id": user.id,
        "username": user.get_username(),
        "name": display_name(user),
        "email": user.email,
        "department": profile.department,
        "role": "admin" if user.is_staff else "member",
        "status": profile.status,
        "last_login": user.last_login,
        "created_at": user.date_joined,
        "updated_by": profile.updated_by_name,
    }


def user_data(user):
    return {
        "id": user.id,
        "username": user.get_username(),
        "email": user.email,
        "name": display_name(user),
        "is_staff": user.is_staff,
    }


def unique_username(email: str) -> str:
    users = get_user_model().objects
    base = email.split("@", 1)[0].lower()
    base = "".join(char if char.isalnum() or char in "._-" else "-" for char in base)
    candidate = base[:140] or "user"
    suffix = 1
    while users.filter(username=candidate).exists():
        suffix += 1
        candidate = f"{base[:135]}-{suffix}"
    return candidate


class HealthView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    @extend_schema(responses={200: HealthSerializer})
    def get(self, request):
        return Response({"status": "ok"})


class LoginView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    @extend_schema(
        request=LoginRequestSerializer,
        responses={200: AuthSessionSerializer},
    )
    def post(self, request):
        serializer = LoginRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        username = serializer.validated_data["username"]
        password = serializer.validated_data["password"]
        user = authenticate(request=request, username=username, password=password)
        if user is None or not user.is_active or not user.is_staff:
            return Response(
                {"detail": "Invalid username or password."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        token, _ = Token.objects.get_or_create(user=user)
        return Response({"token": token.key, "user": user_data(user)})


class MeView(APIView):
    authentication_classes = [TokenAuthentication, SessionAuthentication]
    permission_classes = [IsAuthenticated]

    @extend_schema(responses={200: MeResponseSerializer})
    def get(self, request):
        return Response({"user": user_data(request.user)})


class LogoutView(APIView):
    authentication_classes = [TokenAuthentication, SessionAuthentication]
    permission_classes = [IsAuthenticated]

    @extend_schema(
        request=None,
        responses={204: OpenApiResponse(description="Signed out.")},
    )
    def post(self, request):
        if request.auth is not None:
            request.auth.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class AccountListCreateView(APIView):
    permission_classes = [IsAdminUser]

    @extend_schema(responses={200: AccountListResponseSerializer})
    def get(self, request):
        users = get_user_model().objects.all().order_by("username", "id")
        payload = AccountSerializer([account_data(user) for user in users], many=True).data
        return Response({"accounts": payload})

    @extend_schema(
        request=AccountWriteSerializer,
        responses={201: AccountResponseSerializer},
    )
    @transaction.atomic
    def post(self, request):
        serializer = AccountWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        required = {"name", "email", "department", "role", "status"}
        if not required.issubset(serializer.validated_data):
            return Response(
                {"detail": "name, email, department, role, and status are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        payload = serializer.validated_data
        user = get_user_model()(
            username=unique_username(payload["email"]),
            first_name=payload["name"],
            email=payload["email"],
            is_staff=payload["role"] == "admin",
            is_active=payload["status"] != AccountProfile.Status.DISABLED,
        )
        user.set_unusable_password()
        user.save()
        AccountProfile.objects.create(
            user=user,
            department=payload["department"],
            status=payload["status"],
            updated_by_name=display_name(request.user),
        )
        return Response(
            {"account": AccountSerializer(account_data(user)).data},
            status=status.HTTP_201_CREATED,
        )


class AccountDetailView(APIView):
    permission_classes = [IsAdminUser]

    @extend_schema(
        request=AccountWriteSerializer,
        responses={200: AccountResponseSerializer},
    )
    @transaction.atomic
    def patch(self, request, pk):
        user = get_user_model().objects.filter(pk=pk).first()
        if user is None:
            return Response({"detail": "Account not found."}, status=status.HTTP_404_NOT_FOUND)
        serializer = AccountWriteSerializer(
            data=request.data,
            partial=True,
            context={"user_id": user.id},
        )
        serializer.is_valid(raise_exception=True)
        payload = serializer.validated_data
        profile = profile_for(user)
        role = payload.get("role", "admin" if user.is_staff else "member")
        account_status = payload.get("status", profile.status)

        if user.id == request.user.id and (role != "admin" or account_status == "disabled"):
            return Response(
                {"detail": "You cannot remove your own admin access or disable your account."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if "name" in payload:
            user.first_name = payload["name"]
            user.last_name = ""
        if "email" in payload:
            user.email = payload["email"]
        if "role" in payload:
            user.is_staff = role == "admin"
        if "status" in payload:
            profile.status = account_status
            user.is_active = account_status != "disabled"
        if "department" in payload:
            profile.department = payload["department"]
        profile.updated_by_name = display_name(request.user)
        user.save()
        profile.save()
        return Response({"account": AccountSerializer(account_data(user)).data})


class AdminModelViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAdminUser]
    http_method_names = ["get", "post", "patch", "head", "options"]


class FeaturePermissionViewSet(AdminModelViewSet):
    queryset = FeaturePermission.objects.all()
    serializer_class = FeaturePermissionSerializer


class UsageResourceViewSet(AdminModelViewSet):
    queryset = UsageResource.objects.all()
    serializer_class = UsageResourceSerializer


class ApiServiceViewSet(AdminModelViewSet):
    queryset = ApiService.objects.all()
    serializer_class = ApiServiceSerializer

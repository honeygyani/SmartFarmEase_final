import enum


class UserRole(str, enum.Enum):
    FARMER = "farmer"
    CUSTOMER = "customer"
    ADMIN = "admin"

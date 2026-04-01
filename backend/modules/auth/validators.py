import re


def validate_email(email):
    """Basic email validation (not Gmail-only anymore)."""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    if not re.match(pattern, email):
        return False, "Please enter a valid email address"
    return True, ""


def validate_username(username):
    """
    Username rules:
    - Only lowercase letters (a-z), numbers (0-9), underscore (_)
    - Length: 3 to 20 characters
    - Must start with a letter
    - No spaces or special characters except _
    - No consecutive underscores (__)
    - Cannot end with underscore
    - Pattern: ^[a-z][a-z0-9_]{2,19}$
    """
    if len(username) < 3:
        return False, "Username must be at least 3 characters"
    if len(username) > 20:
        return False, "Username must be at most 20 characters"
    if not re.match(r'^[a-z][a-z0-9_]{2,19}$', username):
        return False, "Username must start with a letter and contain only lowercase letters, numbers, and underscores"
    if '__' in username:
        return False, "Username cannot contain consecutive underscores"
    if username.endswith('_'):
        return False, "Username cannot end with an underscore"
    return True, ""


def validate_userid(userid):
    """Userid uses the same validation rules as username."""
    return validate_username(userid)


def validate_name(name):
    if len(name.strip()) < 2:
        return False, "Name must be at least 2 characters"
    if len(name) > 50:
        return False, "Name must be at most 50 characters"
    if not re.match(r'^[a-zA-Z\s]+$', name):
        return False, "Name can only contain alphabets and spaces"
    return True, ""


def validate_password(password):
    if len(password) < 8:
        return False, "Password must be at least 8 characters"
    if len(password) > 64:
        return False, "Password is too long"
    if not re.search(r'[A-Z]', password):
        return False, "Password must contain at least one uppercase letter"
    if not re.search(r'[a-z]', password):
        return False, "Password must contain at least one lowercase letter"
    if not re.search(r'[0-9]', password):
        return False, "Password must contain at least one number"
    return True, ""
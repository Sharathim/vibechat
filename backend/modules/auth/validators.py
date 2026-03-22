import re

def validate_gmail(gmail):
    pattern = r'^[a-zA-Z0-9._%+-]+@gmail\.com$'
    if not re.match(pattern, gmail):
        return False, "Please enter a valid Gmail address"
    return True, ""

def validate_username(username):
    if len(username) < 3:
        return False, "Username must be at least 3 characters"
    if len(username) > 30:
        return False, "Username must be at most 30 characters"
    pattern = r'^[a-zA-Z0-9._]+$'
    if not re.match(pattern, username):
        return False, "Username can only contain letters, numbers, underscores and dots"
    if username.startswith('.') or username.endswith('.'):
        return False, "Username cannot start or end with a dot"
    if '..' in username:
        return False, "Username cannot contain consecutive dots"
    return True, ""

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
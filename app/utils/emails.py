# app/utils/email.py
import resend
from app.core.config import settings

# Configuramos la API Key a nivel de módulo
resend.api_key = settings.RESEND_API_KEY

def send_welcome_email(to_email: str, raw_password: str, first_name: str, role: str):
    display_role = role.capitalize()
    
    html_content = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <h2 style="color: #2c3e50;">¡Bienvenido al equipo, {first_name}!</h2>
        <p style="color: #34495e; font-size: 16px;">
            Has sido dado de alta como <strong>{display_role}</strong> en la plataforma.
        </p>
        <p style="color: #34495e; font-size: 16px;">
            Tu contraseña temporal para iniciar sesión es:
        </p>
        <div style="background-color: #f8f9fa; padding: 15px; text-align: center; font-size: 20px; letter-spacing: 2px; font-weight: bold; border-radius: 4px; margin: 20px 0;">
            {raw_password}
        </div>
        <p style="color: #e74c3c; font-size: 14px;">
            <em>* Por motivos de seguridad, el sistema te pedirá cambiar esta contraseña en tu primer inicio de sesión.</em>
        </p>
    </div>
    """

    try:
        params = {
            "from": settings.RESEND_FROM_EMAIL, # Ej: "GYMSAAS <onboarding@tu-dominio.com>"
            "to": [to_email],
            "subject": "Tus credenciales de acceso",
            "html": html_content
        }
        
        email_response = resend.Emails.send(params)
        # print(f"Email enviado exitosamente: {email_response}")
        
    except Exception as e:
        print(f"Error enviando correo con Resend: {e}")
Backend — instrucciones rápidas

1. Instalar dependencias:
   npm install

2. Inicializar base de datos y seed demo:
   npm run seed:demo

3. Ejecutar servidor:
   npm run dev

Debug en Windows (PowerShell):

1) Ejecuta el script que crea logs:

```powershell
Set-Location -Path 'C:\Users\jflabur\Desktop\rios\backend'
.\server_start.cmd
```

2) Revisa `server.log` y `server.err` para ver la salida del servidor.

3) Para comprobar un endpoint:

```powershell
Invoke-RestMethod -Uri http://localhost:9000/api/usuarios -Method Get
```

Configurar variables en `.env` o `config/config.json` para Firebase y keys de mapas.

SMTP / Notificaciones de limpieza
--------------------------------

El script de limpieza `scripts/cleanup_uploads.js` puede enviar notificaciones por email tras cada ejecución.
Para activarlo, define las variables de entorno (recomendado en variables de sistema o `.env` en entornos de desarrollo):

   - CLEANUP_ENABLE_EMAIL=1
   - CLEANUP_SMTP_HOST (ej. smtp.gmail.com)
   - CLEANUP_SMTP_PORT (ej. 587)
   - CLEANUP_SMTP_SECURE (1 para TLS, 0 para STARTTLS en 587)
   - CLEANUP_SMTP_USER (usuario SMTP)
   - CLEANUP_SMTP_PASS (contraseña o App Password)
   - CLEANUP_NOTIFY_TO (email destino)

Notas de seguridad y Gmail
 - Si usas Gmail, crea un App Password en tu cuenta Google (recomendado) y usa ese App Password en `CLEANUP_SMTP_PASS`.
 - Por seguridad, el script bloquea el uso de la contraseña principal de Gmail a menos que explícitamente aceptes el riesgo estableciendo `CLEANUP_ALLOW_GMAIL_APP_PASS=1`.
 - Es mejor usar un SMTP dedicado o un servicio como SendGrid/Mailgun para producción.

Probar la configuración SMTP
1. Usa el helper PowerShell (no requiere editar código):
    - `.ackend\scripts\set_and_test_smtp_now.ps1` (establece variables en sesión y ejecuta la prueba)
    - o si quieres setear a nivel Machine (requiere elevación): `.ackend\scripts\set_gmail_app_password.ps1` y opt-in para la prueba.

2. Ejecuta manualmente la prueba SMTP desde el backend folder:

```powershell
Set-Location 'C:\Users\jflabur\Desktop\rios\backend'
node .\scripts\test_smtp_send.js
```

3. El script guardará un JSON con el resultado en `backend/logs/smtp-test-*.json` y mostrará en consola si la verificación y el envío fueron correctos.

Si la prueba falla, revisa el log en `backend/logs` y asegúrate de que las variables de entorno estén presentes en la sesión donde ejecutas los comandos.


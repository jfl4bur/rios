<#
scripts/propose_install_commands.ps1
Listado de comandos recomendados (winget) para instalar dependencias en Windows.
Este script NO ejecuta los comandos automáticamente; simplemente los muestra.
Puedes copiar/pegar y ejecutar manualmente si lo deseas.
#>

Write-Output "Comandos recomendados para instalar componentes (ejecutar con permisos de usuario):"
Write-Output "# Instalar OpenJDK 17 (necesario para builds Android)"
Write-Output "winget install --id Microsoft.OpenJDK.17 -e --source winget"
Write-Output "# Instalar Android Studio (incluye SDK manager)"
Write-Output "winget install --id Google.AndroidStudio -e --source winget"
Write-Output "# Instalar Android SDK platform-tools (si existe en winget)"
Write-Output "winget install --id Google.AndroidPlatformTools -e --source winget    # (puede variar el id)"
Write-Output "# Instalar Visual Studio Build Tools (C++ toolchain)"
Write-Output "winget install --id Microsoft.VisualStudio.2022.BuildTools -e --source winget"
Write-Output "# Instalar Flutter (opcional via scoop/choco/winget)
# winget install --id flutter.flutter -e --source winget"

Write-Output "\nNotas:"
Write-Output " - Verifica los IDs en winget con 'winget search <name>' antes de ejecutar." 
Write-Output " - Algunos paquetes pueden requerir aceptar Términos o reinicios."
Write-Output " - Después de instalar Java/Android/BuildTools, reinicia la shell y ejecuta 'flutter doctor'."

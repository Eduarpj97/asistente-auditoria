# deploy.ps1 - Actualiza el contenedor local con la imagen más reciente de Docker Hub

Write-Host "Descargando la imagen mas reciente..." -ForegroundColor Cyan
docker pull eduarpj/asistente-auditoria:latest

Write-Host "Deteniendo contenedor actual..." -ForegroundColor Yellow
docker stop asistente-auditoria 2>$null
docker rm asistente-auditoria 2>$null

Write-Host "Iniciando contenedor con la nueva imagen..." -ForegroundColor Green
docker run -d `
  --name asistente-auditoria `
  -p 8080:80 `
  eduarpj/asistente-auditoria:latest

Write-Host ""
Write-Host "Contenedor actualizado! Accede en: http://localhost:8080" -ForegroundColor Green

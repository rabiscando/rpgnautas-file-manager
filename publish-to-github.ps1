# Script para Publicar o Módulo no GitHub
# Execute este script no PowerShell a partir da pasta do módulo

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "RPGNautas File Manager - GitHub Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar se estamos na pasta correta
$currentPath = Get-Location
Write-Host "Pasta atual: $currentPath" -ForegroundColor Yellow
Write-Host ""

# Passo 1: Inicializar Git
Write-Host "[1/6] Inicializando repositório Git..." -ForegroundColor Green
git init
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERRO: Falha ao inicializar Git" -ForegroundColor Red
    exit 1
}

# Passo 2: Adicionar todos os arquivos
Write-Host "[2/6] Adicionando arquivos ao Git..." -ForegroundColor Green
git add .
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERRO: Falha ao adicionar arquivos" -ForegroundColor Red
    exit 1
}

# Passo 3: Primeiro commit
Write-Host "[3/6] Criando primeiro commit..." -ForegroundColor Green
git commit -m "Initial release v2.1.0"
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERRO: Falha ao criar commit" -ForegroundColor Red
    exit 1
}

# Passo 4: Renomear branch para main
Write-Host "[4/6] Renomeando branch para main..." -ForegroundColor Green
git branch -M main
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERRO: Falha ao renomear branch" -ForegroundColor Red
    exit 1
}

# Passo 5: Conectar ao GitHub
Write-Host "[5/6] Conectando ao GitHub..." -ForegroundColor Green
git remote add origin https://github.com/rabiscando/rpgnautas-file-manager.git
if ($LASTEXITCODE -ne 0) {
    Write-Host "AVISO: Remote já existe ou erro ao adicionar" -ForegroundColor Yellow
}

# Passo 6: Push para GitHub
Write-Host "[6/6] Enviando para GitHub..." -ForegroundColor Green
Write-Host "IMPORTANTE: O GitHub pode pedir suas credenciais!" -ForegroundColor Yellow
Write-Host ""
git push -u origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "SUCESSO! Módulo publicado no GitHub!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Próximos passos:" -ForegroundColor Cyan
    Write-Host "1. Acesse: https://github.com/rabiscando/rpgnautas-file-manager" -ForegroundColor White
    Write-Host "2. Vá em 'Releases' e crie uma nova release:" -ForegroundColor White
    Write-Host "   - Tag: v2.1.0" -ForegroundColor White
    Write-Host "   - Title: Version 2.1.0" -ForegroundColor White
    Write-Host "   - Description: Copie do CHANGELOG.md" -ForegroundColor White
    Write-Host ""
    Write-Host "URL de instalação para compartilhar:" -ForegroundColor Cyan
    Write-Host "https://raw.githubusercontent.com/rabiscando/rpgnautas-file-manager/main/module.json" -ForegroundColor Yellow
} else {
    Write-Host ""
    Write-Host "ERRO: Falha ao enviar para GitHub" -ForegroundColor Red
    Write-Host "Verifique suas credenciais e tente novamente" -ForegroundColor Yellow
}

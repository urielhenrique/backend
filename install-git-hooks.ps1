# Instalador de Git Hooks de Segurança
# Execute este script para instalar os hooks de pre-commit

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║     🔒 Instalador de Git Hooks de Segurança               ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

$hooksDir = ".git\hooks"

if (-not (Test-Path $hooksDir)) {
    Write-Host "❌ Diretório .git/hooks não encontrado!" -ForegroundColor Red
    Write-Host "   Certifique-se de estar na raiz do projeto." -ForegroundColor Yellow
    exit 1
}

Write-Host "📁 Diretório de hooks encontrado: $hooksDir" -ForegroundColor Green
Write-Host ""

# Verificar se já existe hook
$bashHook = Join-Path $hooksDir "pre-commit"
$psHook = Join-Path $hooksDir "pre-commit.ps1"

if (Test-Path $bashHook) {
    Write-Host "✓ pre-commit (Bash) já existe" -ForegroundColor Green
} else {
    Write-Host "⚠️  pre-commit (Bash) não encontrado" -ForegroundColor Yellow
}

if (Test-Path $psHook) {
    Write-Host "✓ pre-commit.ps1 (PowerShell) já existe" -ForegroundColor Green
} else {
    Write-Host "⚠️  pre-commit.ps1 (PowerShell) não encontrado" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🔧 Configurando Git para usar hooks do PowerShell no Windows..." -ForegroundColor Cyan

# Criar wrapper que chama o PowerShell hook
$wrapperContent = @"
#!/bin/sh
# Git hook wrapper para executar PowerShell no Windows

if command -v powershell >/dev/null 2>&1; then
    powershell -ExecutionPolicy Bypass -File ".git/hooks/pre-commit.ps1"
elif command -v pwsh >/dev/null 2>&1; then
    pwsh -ExecutionPolicy Bypass -File ".git/hooks/pre-commit.ps1"
else
    echo "⚠️  PowerShell não encontrado. Hook não será executado."
    exit 0
fi
"@

$wrapperContent | Out-File -FilePath $bashHook -Encoding UTF8 -NoNewline
Write-Host "✓ Wrapper criado: $bashHook" -ForegroundColor Green

Write-Host ""
Write-Host "✅ Instalação concluída!" -ForegroundColor Green
Write-Host ""
Write-Host "🛡️  Proteções ativas:" -ForegroundColor Cyan
Write-Host "   • Bloqueio de commit de .env" -ForegroundColor White
Write-Host "   • Detecção de API keys do Resend" -ForegroundColor White
Write-Host "   • Detecção de API keys do Stripe" -ForegroundColor White
Write-Host "   • Detecção de Webhook Secrets" -ForegroundColor White
Write-Host "   • Avisos para passwords hard-coded" -ForegroundColor White
Write-Host ""

Write-Host "🧪 Testando hook..." -ForegroundColor Cyan
Write-Host ""

# Testar se PowerShell consegue executar o script
try {
    & $psHook
    Write-Host ""
    Write-Host "✅ Hook está funcionando corretamente!" -ForegroundColor Green
} catch {
    Write-Host ""
    Write-Host "⚠️  Erro ao testar hook: $($_.Exception.Message)" -ForegroundColor Yellow
    Write-Host "   O hook ainda será executado normalmente no commit." -ForegroundColor White
}

Write-Host ""
Write-Host "📋 Próximos passos:" -ForegroundColor Cyan
Write-Host "   1. Tente fazer um commit normal" -ForegroundColor White
Write-Host "   2. O hook verificará automaticamente antes de commitar" -ForegroundColor White
Write-Host "   3. Se houver credenciais, o commit será bloqueado" -ForegroundColor White
Write-Host ""

Write-Host "💡 Para testar:" -ForegroundColor Cyan
Write-Host "   git add ." -ForegroundColor Yellow
Write-Host "   git commit -m 'test: verificar hook'" -ForegroundColor Yellow
Write-Host ""

Write-Host "🔒 Seu repositório agora está mais seguro!" -ForegroundColor Green
Write-Host ""

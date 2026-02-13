# Comandos Git - RPGNautas File Manager

## ⚠️ ANTES DE COMEÇAR

Você precisa criar o repositório no GitHub primeiro:

1. Acesse: https://github.com/new
2. Repository name: `rpgnautas-file-manager`
3. Description: `File management module for Foundry VTT with WebP conversion and link repair`
4. Visibility: **Public**
5. NÃO marque "Initialize this repository with a README"
6. Clique em "Create repository"

## 🚀 Opção 1: Script Automático (Recomendado)

Abra o PowerShell na pasta do módulo e execute:

```powershell
cd c:\FoundryVTT\Data1\Data\modules\rpgnautas-file-manager
.\publish-to-github.ps1
```

## 📝 Opção 2: Comandos Manuais

Se preferir executar os comandos manualmente:

```bash
# 1. Navegar até a pasta do módulo
cd c:\FoundryVTT\Data1\Data\modules\rpgnautas-file-manager

# 2. Inicializar Git
git init

# 3. Adicionar todos os arquivos
git add .

# 4. Criar primeiro commit
git commit -m "Initial release v2.1.0"

# 5. Renomear branch para main
git branch -M main

# 6. Conectar ao GitHub
git remote add origin https://github.com/rabiscando/rpgnautas-file-manager.git

# 7. Enviar para GitHub
git push -u origin main
```

## 📦 Criar Release no GitHub

Depois de fazer o push:

1. Acesse: https://github.com/rabiscando/rpgnautas-file-manager
2. Clique em **"Releases"** → **"Create a new release"**
3. Preencha:
   - **Tag version**: `v2.1.0`
   - **Release title**: `Version 2.1.0`
   - **Description**: Copie o conteúdo do CHANGELOG.md
4. Clique em **"Publish release"**

## 🔗 URL de Instalação

Compartilhe esta URL com outros usuários:

```
https://raw.githubusercontent.com/rabiscando/rpgnautas-file-manager/main/module.json
```

## 🔄 Atualizações Futuras

Quando fizer alterações:

```bash
# Adicionar alterações
git add .

# Commit
git commit -m "Descrição das alterações"

# Enviar para GitHub
git push

# Criar nova release no GitHub com a nova versão
```

## 🆘 Problemas Comuns

### Erro de autenticação

Se o GitHub pedir credenciais e você usa 2FA:

1. Vá em: https://github.com/settings/tokens
2. Crie um **Personal Access Token** com permissão `repo`
3. Use o token como senha quando o Git pedir

### Remote já existe

Se aparecer erro "remote origin already exists":

```bash
git remote remove origin
git remote add origin https://github.com/rabiscando/rpgnautas-file-manager.git
```

### Verificar status

Para ver o status do repositório:

```bash
git status
git remote -v
```

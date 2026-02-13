# Como Publicar o Módulo no GitHub

Este guia explica como criar um repositório GitHub para o módulo RPGNautas File Manager e disponibilizá-lo para outros usuários do Foundry VTT.

## 📋 Pré-requisitos

- Conta no GitHub (crie em https://github.com/signup se não tiver)
- Git instalado no seu computador (baixe em https://git-scm.com/)
- Acesso ao terminal/prompt de comando

## 🚀 Passo a Passo

### 1. Criar Repositório no GitHub

1. Acesse https://github.com e faça login
2. Clique no botão **"+"** no canto superior direito
3. Selecione **"New repository"**
4. Configure o repositório:
   - **Repository name**: `rpgnautas-file-manager`
   - **Description**: `File management module for Foundry VTT with WebP conversion and link repair`
   - **Visibility**: Public (para que outros possam instalar)
   - **NÃO** marque "Initialize this repository with a README" (já temos um)
5. Clique em **"Create repository"**

### 2. Preparar o Repositório Local

Abra o terminal/prompt de comando e navegue até a pasta do módulo:

```bash
cd c:\FoundryVTT\Data1\Data\modules\rpgnautas-file-manager
```

### 3. Inicializar Git e Fazer o Primeiro Commit

Execute os seguintes comandos:

```bash
# Inicializar repositório Git
git init

# Adicionar todos os arquivos
git add .

# Fazer o primeiro commit
git commit -m "Initial release v2.1.0"

# Renomear branch para main
git branch -M main
```

### 4. Conectar ao GitHub

Execute os seguintes comandos:

```bash
git remote add origin https://github.com/rabiscando/rpgnautas-file-manager.git
git push -u origin main
```

**Nota**: O GitHub pode pedir suas credenciais. Se você usa autenticação de dois fatores, precisará criar um Personal Access Token em vez de usar sua senha.

### 5. Criar uma Release

1. No GitHub, vá para o seu repositório
2. Clique na aba **"Releases"**
3. Clique em **"Create a new release"**
4. Configure a release:
   - **Tag version**: `v2.1.0`
   - **Release title**: `Version 2.1.0`
   - **Description**: Copie o conteúdo do CHANGELOG.md para esta versão
5. Clique em **"Publish release"**

### 6. Atualizar o module.json

Edite o arquivo `module.json` e adicione as seguintes linhas após a linha `"socket": true`:

```json
  "url": "https://github.com/rabiscando/rpgnautas-file-manager",
  "manifest": "https://raw.githubusercontent.com/rabiscando/rpgnautas-file-manager/main/module.json",
  "download": "https://github.com/rabiscando/rpgnautas-file-manager/archive/refs/tags/v2.1.0.zip",
  "bugs": "https://github.com/rabiscando/rpgnautas-file-manager/issues",
  "changelog": "https://github.com/rabiscando/rpgnautas-file-manager/blob/main/CHANGELOG.md"
```

### 7. Fazer Commit das Alterações

```bash
git add module.json
git commit -m "Add GitHub URLs to module.json"
git push
```

### 8. Atualizar a Release

1. Volte para a página de Releases no GitHub
2. Edite a release v2.1.0
3. Clique em **"Update release"**

## 📦 URL de Instalação

Após seguir todos os passos, a URL de instalação do módulo será:

```
https://raw.githubusercontent.com/rabiscando/rpgnautas-file-manager/main/module.json
```

Compartilhe esta URL com outros usuários para que eles possam instalar o módulo!

## 🔄 Atualizações Futuras

Quando você fizer alterações no módulo:

1. Atualize a versão no `module.json`
2. Atualize o `CHANGELOG.md` com as mudanças
3. Faça commit das alterações:
   ```bash
   git add .
   git commit -m "Descrição das alterações"
   git push
   ```
4. Crie uma nova release no GitHub com a nova versão

## 📝 Dicas Importantes

- ✅ Sempre teste o módulo antes de publicar uma nova versão
- ✅ Mantenha o CHANGELOG.md atualizado
- ✅ Use versionamento semântico (MAJOR.MINOR.PATCH)
- ✅ Responda às issues e pull requests dos usuários
- ✅ Faça backup do código antes de fazer alterações grandes

## 🆘 Problemas Comuns

### "Permission denied" ao fazer push

Você precisa configurar suas credenciais do GitHub. Use um Personal Access Token:

1. Vá em GitHub → Settings → Developer settings → Personal access tokens
2. Crie um novo token com permissões de "repo"
3. Use o token como senha quando o Git pedir

### "Repository not found"

Verifique se:

- O nome do repositório está correto
- A URL está usando `rabiscando` como nome de usuário
- O repositório é público

### Módulo não aparece no Foundry

Verifique se:

- A URL do manifest está correta
- O arquivo `module.json` está válido (use um validador JSON)
- O repositório é público

## 📞 Suporte

Se tiver dúvidas, consulte:

- [Documentação do Git](https://git-scm.com/doc)
- [Guia do GitHub](https://docs.github.com/)
- [Foundry VTT Module Development](https://foundryvtt.com/article/module-development/)

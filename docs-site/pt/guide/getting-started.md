---
title: Começando
description: Instale Deepsand, crie seu primeiro projeto e execute seu sandbox.
---

# Começando

Deepsand ajuda você a trabalhar com um assistente de codificação de IA em um projeto real sem dar a esse assistente acesso ao resto do seu computador. Você não precisa entender Docker ou a linha de comando para usar o fluxo básico.

Se você quiser uma visão geral primeiro, leia [O que é Deepsand?](./what-is-deepsand).

## Requisitos

- Docker Desktop em Windows ou macOS ou Docker Engine em Linux.
- Um computador Windows, macOS ou Linux. O [página de downloads](../download) detecta o sistema e lista os instaladores correspondentes.
- Nenhuma instalação do Node.js ou Rust é necessária, a menos que você esteja compilando o Deepsand a partir do código-fonte.

Docker Desktop deve estar em execução antes que Deepsand possa iniciar um sandbox. Se o daemon ainda estiver iniciando, a faixa de status informa isso e se oferece para verificar novamente. Docker Desktop também pode estar em execução, mas não responde; se Deepsand disser que o daemon não está respondendo, reinicie Docker Desktop. Quando Deepsand detecta Docker Desktop, ele mostra um controle **Reinicie Docker Desktop…**. Consulte [o que fazer se Docker Desktop não estiver em execução ou parar de responder](./faq#what-if-docker-desktop-is-not-running-or-has-stopped-responding).

## Instalar

Abra o [Página de downloads Deepsand](../download). Ele detecta seu sistema operacional e lista os instaladores Windows, macOS e Linux mais recentes da versão atual do GitHub. Escolha o pacote para o seu computador, instale-o e inicie Deepsand.

Se você estiver desenvolvendo o próprio Deepsand, o repositório README possui os comandos source-build e hot-reload.

## Primeira corrida

Você não precisa do DeepCode instalado ou configurado antes de usar o Deepsand. Deepsand executa DeepCode dentro da sandbox e vem com padrões razoáveis ​​para o modelo e endpoint.

A única coisa que você precisa é de uma chave modelo API. A próxima seção explica como obter uma chave DeepSeek ou você pode usar uma chave de outro provedor. Salve-o em **Configurações → tecla API**.

Se você já usa DeepCode CLI neste computador, Deepsand pode herdar o modelo, URL base e chave de sua configuração DeepCode existente. Um projeto também pode substituir essas credenciais em suas próprias configurações.

## Obtenha uma chave API

Deepsand precisa de uma chave API de um provedor de modelo antes que o assistente possa ser executado.

- **Se você não tiver um:** segue [Obtenha uma chave DeepSeek API](./deepseek-api). Ele percorre como criar uma conta, adicionar crédito, fazer uma chave e voltar para Deepsand.
- **Se você já tem um:** abra **Configurações**, cole-o no campo **Chave API** e selecione **Salvar chave**.
- **Se você quiser uma chave específica do projeto:** abra as configurações desse projeto e insira-o lá.

A chave de todo o aplicativo é mantida no keystore do sistema operacional, não no arquivo de estado do Deepsand. A janela mostra apenas os últimos quatro caracteres após salvar.

## Crie um projeto

1. Selecione **Novo projeto** na barra lateral.
2. Dê um nome ao projeto.
3. Escolha o diretório de trabalho.
4. Crie o projeto.

O diretório de trabalho se torna `/workspace` dentro da sandbox. Deepsand recusa caminhos como a raiz do sistema de arquivos, seu diretório inicial, armazenamentos de credenciais e seu próprio diretório de dados.

## Escolha um modelo

Use um **modelo flash** para a maioria das tarefas. O padrão Deepsand é `deepseek-v4-flash`, que é a escolha mais barata para codificação, explicações e edições diárias. Mude para `deepseek-v4-pro` somente quando o flash estiver claramente lutando com uma tarefa; o modelo profissional custa mais para funcionar.

Você pode alterar o modelo em **Configurações**, no cabeçalho do projeto, ou com `/model` no terminal DeepCode.

## Escolha um nível de pensamento

O controle deslizante de pensamento está próximo ao seletor de modelo no cabeçalho do projeto. Ele controla quanto raciocínio o modelo faz antes de responder.

- **Desligado:** sem pensar. O mais rápido, mas o menos cuidadoso.
- **Rápido:** um pouco de reflexão, para pequenas edições bem especificadas.
- **Equilibrado:** pensamento moderado e parada intermediária. Este é o padrão sensato para o trabalho real.
- Raciocínio máximo **Profundo:**. Mais lento e mais caro.
- **Padrão:** adia para o host `settings.json`; se não disser nada, DeepCode volta para Balanceado.

Mantenha o controle deslizante **Equilibrado** para a maioria das tarefas. Oferece bons resultados sem pagar pelo raciocínio mais lento e caro em cada solicitação. Use **Profundo** apenas para problemas genuinamente difíceis e **Desligado** ou **Rápido** para edições pequenas e previsíveis.

## Execute um projeto

1. Selecione o projeto.
2. Pressione **Correr**.
3. Se a imagem estiver faltando, Deepsand a criará primeiro e mostrará a saída da compilação na guia Atividade.
4. O DeepCode CLI começa dentro do contêiner e aparece no terminal.

Parar a sandbox encerra o contêiner. Iniciá-lo novamente retoma a sessão DeepCode anterior, quando existir uma.

## Usando o terminal DeepCode

A guia **terminal** é a sessão DeepCode CLI ao vivo. Digite uma solicitação e pressione **Digitar** ou use um comando de barra para controlar a sessão. `/new` inicia uma nova conversa, `/resume` continua uma anterior, `/model` altera o modelo e `/` abre o menu de comando.

Leia [Usando o terminal DeepCode](./deepcode-terminal) para os comandos principais, atalhos de teclado e etapas de recuperação.

## Respondendo a solicitações de permissão

Quando DeepCode precisa de um diretório, um destino de rede, uma ferramenta ou outro recurso, Deepsand pausa o sandbox e mostra a solicitação.

- **Conceder acesso** permite a solicitação e retoma a sessão.
- **Negar** recusa e informa ao modelo que a decisão é final.
- Uma concessão de diretório recria o contêiner com a nova montagem anexada.

Leia [Como funciona a caixa de areia](./security) antes de conceder acesso a um diretório que contém arquivos confidenciais.

## Onde encontrar coisas

| Área | O que mostra |
| --- | --- |
| Terminais | A sessão DeepCode ao vivo dentro do sandbox. |
| Permissões | Diretórios compartilhados, lista de permissões da rede e trilha de auditoria. |
| Ferramentas | Ferramentas inseridas na imagem do projeto. Alterar a seleção reconstrói a imagem. |
| Segredos | Valores criptografados injetados como variáveis ​​de ambiente no início. |
| Atividade | Os argumentos `docker run` exatos, o log de construção e as tentativas de saída bloqueadas. |

## Próximas etapas

- [Como funciona a caixa de areia](./security)
- [Perguntas frequentes](./faq)

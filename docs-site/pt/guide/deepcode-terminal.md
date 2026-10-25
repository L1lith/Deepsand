---
title: Usando o terminal DeepCode
description: >-
  Como usar o DeepCode CLI dentro do Deepsand, seus principais comandos de barra e atalhos de
  teclado.
---

# Usando o terminal DeepCode

Deepsand executa [DeepCode CLI](https://github.com/lessweb/deepcode-cli) dentro da sandbox. A guia **terminal** é uma sessão DeepCode ao vivo: digite uma solicitação em linguagem normal ou use um dos comandos de barra de DeepCode para controlar a sessão.

Você não instala DeepCode em sua própria máquina. Deepsand inicia o CLI no contêiner do projeto, onde pode ver `/workspace` e os diretórios que você compartilhou.

Saiba mais no [Página inicial do projeto DeepCode](https://deepcode.vegamo.cn/) ou no [Repositório DeepCode](https://github.com/lessweb/deepcode-cli).

## Iniciar uma sessão

1. Selecione um projeto na barra lateral.
2. Pressione **Correr**.
3. Aguarde o início da sandbox. Se a imagem estiver faltando, Deepsand a construirá primeiro e mostrará a saída da construção em **Atividade**.
4. O terminal DeepCode aparece quando o CLI está pronto.

Parar a sandbox encerra o contêiner. Iniciar o projeto novamente retoma a conversa DeepCode anterior, quando existir uma.

## Peça a DeepCode para fazer algo

Digite uma solicitação normal e pressione **Digitar**. Por exemplo:

```text
Find the failing test in this project and explain what is wrong.
```

DeepCode pode ler e editar arquivos na área de trabalho, executar comandos e usar as ferramentas selecionadas para o projeto. Você permanece no controle: quando precisa de algo fora do espaço de trabalho, o Deepsand pausa o sandbox e pergunta primeiro.

## Comandos de barra principais

Os comandos de barra começam com `/`. Digitar `/` sozinho abre o menu de comando.

| Comando | O que faz |
| --- | --- |
| `/new` | Comece uma nova conversa |
| `/resume` | Escolha uma conversa anterior para continuar |
| `/fork` | Bifurque a conversa atual |
| `/continue` | Continue a conversa ativa ou escolha uma para retomar |
| `/model` | Mudar o modelo, o modo de pensar e o esforço de raciocínio |
| `/raw` | Alternar o modo de exibição: rolagem Normal, Lite ou Raw |
| `/init` | Crie um arquivo `AGENTS.md` com instruções do projeto |
| `/skills` | Liste as habilidades disponíveis para DeepCode |
| `/mcp` | Mostrar status do servidor MCP e ferramentas disponíveis |
| `/undo` | Restaurar o código, a conversa ou ambos para um ponto anterior |
| `/exit` | Sair do DeepCode |

Um projeto já pode ter um `AGENTS.md`; verifique antes de usar `/init` para não substituir as instruções que já estão lá.

## Atalhos de teclado

| Chave | Ação |
| --- | --- |
| `Enter` | Envie o prompt |
| `Shift+Enter` | Insira uma nova linha |
| `Ctrl+J` | Insira uma nova linha |
| `Esc` | Interromper a virada do modelo atual |
| `Ctrl+V` | Colar uma imagem quando o modelo selecionado suportar imagens |
| `Ctrl+D` duas vezes | Sair do DeepCode |

Após interromper uma curva com `Esc`, você pode digitar outra solicitação. A sandbox não foi reiniciada.

## Soltando arquivos no terminal

Arraste um arquivo para o terminal e seu caminho será digitado para você.

- Um arquivo dentro da pasta do projeto, ou dentro de um diretório que você compartilhou com o projeto, é referenciado onde o sandbox já o vê (`/workspace/...` ou `/grants/...`). Nada é copiado.
- Um arquivo de qualquer outro lugar é copiado para `/tmp/deepsand-incoming` dentro da sandbox e Deepsand pergunta primeiro. Essa pasta não faz parte de nenhum repositório, portanto, um arquivo descartado não pode acabar em um commit e desaparece quando o sandbox é recriado. A caixa de diálogo possui uma opção **Não me avise novamente**, que tem a mesma configuração de **Configurações → Comportamento → Avisar antes de descartar arquivos de fora do projeto**.

## Manter-se atualizado

O DeepCode CLI está instalado dentro da imagem do sandbox e o sandbox não pode ser atualizado sozinho. Antes de cada inicialização, Deepsand pergunta a npm qual é a versão mais recente e, se a imagem for mais antiga, reconstrói primeiro essa parte da imagem - para que o terminal nunca abra em uma versão que já esteja solicitando a atualização. A resposta é lembrada por um quarto de hora, portanto, esta é uma solicitação em vez de uma por execução e, se npm não puder ser alcançado, o sandbox será iniciado na versão que já possui.

## Sessões, modelos e desfazer

- `/new` recomeça com uma conversa limpa. Os arquivos do projeto não são excluídos.
- `/resume` e `/continue` trazem de volta uma conversa anterior.
- `/model` altera o modelo, o modo de pensamento e o esforço de raciocínio da sessão. O cabeçalho do projeto também possui um seletor de modelo e um controle deslizante de pensamento; **Equilibrado** é o ponto intermediário e a configuração recomendada para a maioria dos trabalhos.
- `/undo` restaura o código, a conversa ou ambos para um ponto anterior. É a maneira mais rápida de desistir de uma mudança que você não queria.

O histórico de conversas reside no volume de estado Deepsand do projeto, não em seu repositório.

## Permissões e sandbox

O terminal está dentro do contêiner, então ele vê o projeto em `/workspace` e os diretórios que você compartilhou explicitamente, e nada mais no seu computador.

Quando DeepCode solicita outro diretório, um destino de rede, uma ferramenta ou outro recurso, Deepsand congela a sandbox e mostra uma caixa de diálogo de permissão.

- **Conceder acesso** aplica a solicitação e retoma a sessão.
- **Agora não** recusa desta vez; DeepCode pode perguntar novamente mais tarde.
- **Não pergunte novamente** recusa, e Deepsand então recusa esse caminho (e tudo abaixo dele) ou o próprio host (e seus subdomínios), não apenas em palavras. Cada bloco está listado em Permissões, onde você pode retirá-lo.
- A aprovação de um diretório recria o contêiner com a nova montagem.

Leia [Como funciona a caixa de areia](./security) antes de compartilhar um diretório que contenha arquivos confidenciais.

## Se o terminal não iniciar

- **A imagem está faltando:** Deepsand o constrói primeiro. Observe **Atividade** para ver o progresso da construção.
- **Docker Desktop não está em execução ou está travado:** dê partida e espere o motor terminar de dar partida. Se o Docker Desktop estiver funcionando, mas o mecanismo não estiver respondendo, reinicie o Docker Desktop. Use o controle **Reinicie Docker Desktop…** no aplicativo quando Deepsand mostrá-lo. Caso contrário, em Windows, clique com o botão direito na baleia Docker na área de notificação e escolha **Reiniciar**; em macOS use o ícone da barra de menu Docker; em Linux abra o menu **Solucionar problemas** do Docker Desktop. Reiniciar Docker Desktop encerra todos os contêineres da máquina. Consulte [as perguntas frequentes sobre Docker](./faq#what-if-docker-desktop-is-not-running-or-has-stopped-responding).
- **A chave API está ausente ou foi rejeitada:** abra **Configurações** e salve uma chave válida.
- **DeepCode saiu:** pressione **Correr** novamente. A sessão anterior pode ser retomada com `/resume`.

## Páginas relacionadas

- [Começando](./getting-started)
- [Obtenha uma chave DeepSeek API](./deepseek-api)
- [Como funciona a caixa de areia](./security)
- [Página inicial do projeto DeepCode](https://deepcode.vegamo.cn/)

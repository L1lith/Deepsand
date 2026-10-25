---
title: Sob o capô
description: >-
  Arquitetura, isolamento, fluxo de permissão, rede e ferramentas de linha de comando por trás do
  Deepsand.
---

# Sob o capô

Esta página é para desenvolvedores que desejam conhecer o formato técnico do sistema. Se você está procurando uma explicação em linguagem simples, comece com [O que é Deepsand?](./what-is-deepsand).

## Arquitetura

Deepsand é um aplicativo de desktop Tauri com três camadas principais:

- **A janela** é uma interface SolidJS. Ele renderiza o estado e envia intenções; não decide a política.
- **A camada Tauri** expõe comandos de desktop e traduz a mesma superfície de comando em um servidor HTTP de loopback para clientes remotos.
- **`deepsand-core`** possui as regras. A validação de caminho, o plano `docker run`, o corretor de permissão, o proxy de saída, o armazenamento secreto criptografado e o armazenamento de estado residem todos lá.

O aplicativo de desktop e o driver de linha de comando `deepsandctl` usam o mesmo núcleo, portanto, não podem se separar em uma decisão de segurança.

## Um projeto, um contêiner

Cada projeto obtém seu próprio contêiner Docker e seu próprio volume de estado. O diretório do projeto é montado em `/workspace`; outros diretórios de host exigem concessões explícitas.

`policy::plan_run` cria o argv `docker run` completo em um só lugar. A guia Atividade mostra esse plano exato, incluindo montagens, recursos, modo de rede e caminhos somente leitura.

O contêiner é deliberadamente restrito:

- O sistema de arquivos raiz é somente leitura, com montagens tmpfs dimensionadas para `/tmp` e `/run`.
- O spool de resposta e o diretório de estado são montados somente leitura.
- Os soquetes de tempo de execução do contêiner são rejeitados por nome.
- Os recursos são eliminados antes da execução de DeepCode e `no-new-privileges` é definido.
- Soquetes de tempo de execução de contêiner e outras montagens proibidas falham no fechamento em vez de produzir um plano mais fraco.

## Permissões

A sandbox pode solicitar mais acesso, mas não pode concedê-lo. Uma solicitação de permissão é gravada em um spool; o host broker o valida e pausa o contêiner. O operador vê a solicitação e decide.

A aprovação de uma solicitação de diretório recria o contêiner com a nova montagem de ligação e retoma a sessão. A recusa é uma de duas respostas, e o modelo é informado qual: **Não pergunte novamente** é final, enquanto **Agora não** recusa desta vez e diz que o modelo pode perguntar novamente mais tarde. Uma recusa final é armazenada no projeto e imposta pelo host: nenhuma montagem é criada para o caminho ou qualquer coisa abaixo dele, e um host recusado se torna uma regra de negação cobrindo seus subdomínios. Os bloqueios estão listados em Permissões e podem ser removidos lá, porque uma decisão sem retorno é uma armadilha e não uma escolha.

Um pedido de algo que o sandbox já possui é recusado com uma explicação. Não existe um caminho de aprovação automático, porque uma aprovação silenciosa seria um consentimento que o operador nunca deu.

## Rede

A política de rede tem quatro modos:

| Modo | Comportamento |
| --- | --- |
| `none` | Somente o terminal do modelo por meio do proxy de saída Deepsand. |
| `allowlisted` | O endpoint do modelo, o proxy e hosts, endereços e portas nomeados. |
| `internet` | Acesso à Internet, com faixas locais e privadas bloqueadas dentro do contêiner. |
| `full` | Acesso à Internet sem bloqueio de rede local. |

Uma entrada de nome de host é resolvida pelo proxy, que recusa resultados privados, de loopback, de link local e reservados. Uma entrada de endereço é imposta diretamente pelo contêiner, que é o que permite a conexão de um cliente de banco de dados ou outro programa não HTTP. Uma porta nomeada é publicada somente no loopback do host.

## Segredos e atualizações

Os segredos são criptografados em repouso com uma chave mantida pelo keystore do sistema operacional. Eles são passados ​​para o contêiner por meio de um arquivo de ambiente, nunca como um valor de linha de comando, e são injetados somente quando o sandbox é iniciado.

As compilações de versão verificam as atualizações assinadas antes de instalá-las. A chave de assinatura nunca é armazenada no repositório.

## Linha de comando

`deepsandctl` fornece a superfície sem cabeça:

```bash
deepsandctl doctor
deepsandctl plan <project> --offline
deepsandctl run <project>
deepsandctl watch <project>
deepsandctl requests <project>
deepsandctl network <project> <mode>
```

`plan --offline` imprime o argumento `docker run` exato sem iniciar um contêiner, o que é útil para revisar uma política alterada.

## Leia mais

- [O modelo de segurança completo](https://github.com/L1lith/Deepsand/blob/master/docs/SECURITY.md)
- [Notas de arquitetura](https://github.com/L1lith/Deepsand/blob/master/docs/ARCHITECTURE.md)
- [Como funciona a caixa de areia](./security)

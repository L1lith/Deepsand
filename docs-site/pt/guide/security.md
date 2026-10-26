---
title: Como funciona a caixa de areia
description: O que Deepsand impõe, o que você decide e o que o sandbox não pode alcançar.
---

# Como funciona a caixa de areia

Resumindo: o assistente pode trabalhar no projeto que você escolher e nas pastas que você aprovar, e em nenhum outro lugar do seu computador.

A promessa de Deepsand é restrita e testável: o sandbox pode alcançar o diretório do projeto e os diretórios que você concede explicitamente, e nada mais.

## A fronteira

O contêiner não tem visualização do sistema de arquivos host além das montagens de ligação que Deepsand escolheu. Outros caminhos de host não existem dentro do namespace de montagem do contêiner, portanto não há nenhum arquivo host para o qual escapar.

Todo o resto descrito aqui é uma defesa profunda além desse limite.

## O que é aplicado

- Somente o espaço de trabalho e as concessões explícitas são montadas no host.
- O spool de resposta e o diretório de estado são montados somente leitura.
- Os soquetes de tempo de execução do contêiner são rejeitados por nome.
- O sistema de arquivos raiz do contêiner é somente leitura, com sistemas de arquivos temporários dimensionados para `/tmp` e `/run`.
- Os links simbólicos são resolvidos antes que um caminho seja verificado, portanto, um link não pode disfarçar um alvo proibido.
- Os privilégios são eliminados antes da execução de DeepCode e `no-new-privileges` evita que eles sejam recuperados.

## Modos de rede

| Modo | O que permite |
| --- | --- |
| Nenhum | Somente o terminal do modelo por meio do proxy Deepsand. |
| Lista de permissões | O endpoint do modelo, o proxy e os hosts ou endereços na lista de permissões. |
| Internet | Acesso à Internet, com faixas locais e privadas bloqueadas dentro do contêiner. |
| Completo | Acesso à Internet sem bloqueio de rede local. Use-o somente quando o sandbox realmente precisar da sua rede local. |

Um nome de host na lista de permissões passa pelo proxy, que resolve o próprio nome e recusa um resultado no espaço de endereço privado. Um endereço na lista de permissões é permitido diretamente pelas regras do contêiner, porque um cliente de banco de dados ou outro programa não HTTP não pode usar o proxy. Uma porta nomeada em uma entrada também é publicada no loopback do host, nunca em todas as interfaces.

## O que você decide

Deepsand nunca concede acesso automaticamente. Uma solicitação chega até você com o caminho, host, ferramenta ou recurso solicitado, e o sandbox permanece pausado até você decidir.

Uma solicitação de algo que o sandbox já possui é recusada com uma explicação, porque uma permissão automática seria um consentimento que você nunca deu. Qualquer coisa ambígua chega até você.

## Contra o que não protege

- O provedor do modelo pode ver o conteúdo que você envia para ele.
- Os arquivos que você coloca na área de trabalho ficam visíveis na sandbox e podem ser alterados ou excluídos.
- Uma ferramenta ou instrução de modelo malformada ainda pode solicitar acesso. A decisão continua sendo sua.
- O próprio Docker está fora dos limites. Mantenha Docker Desktop e o sistema operacional host atualizados.

## Leia mais

O modelo de segurança completo, incluindo os testes que afirmam cada propriedade, está em [documentos/SEGURANÇA.md](https://github.com/L1lith/Deepsand/blob/master/docs/SECURITY.md).

A arquitetura é descrita em [docs/ARQUITETURA.md](https://github.com/L1lith/Deepsand/blob/master/docs/ARCHITECTURE.md).

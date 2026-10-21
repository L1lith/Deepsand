---
title: Obtenha uma chave DeepSeek API
description: >-
  Cadastre-se na plataforma DeepSeek API, adicione crédito, crie uma chave e armazene-a com
  segurança em Deepsand.
---

# Obtenha uma chave DeepSeek API

Deepsand precisa de um provedor de modelo para alimentar o assistente. A configuração padrão usa DeepSeek. Esta página explica como criar uma conta, adicionar crédito, criar uma chave API e salvá-la em Deepsand.

Se você já possui uma chave API de outro provedor, vá para [Use uma chave que você já possui](#use-a-key-you-already-have).

## Antes de começar

Você precisará de:

- Um endereço de e-mail ou uma conta de login compatível.
- Um método de pagamento para crédito API.
- Alguns minutos para criar a chave e colá-la em Deepsand.

O DeepSeek API é cobrado separadamente do site de bate-papo e do aplicativo móvel do DeepSeek. Adicionar crédito na plataforma API é o que permite ao assistente fazer solicitações.

## 1. Crie uma conta DeepSeek

1. Abra o [Plataforma DeepSeek API](https://platform.deepseek.com/).
2. Selecione **Inscrever-se** ou **Conecte-se**.
3. Crie uma conta com seu endereço de e-mail ou use uma das opções de login suportadas.
4. Verifique seu endereço de e-mail ou número de telefone se a plataforma solicitar.

## 2. Adicione crédito

1. Faça login na plataforma API.
2. Abra a seção de cobrança ou recarga no painel.
3. Adicione a quantidade de crédito que deseja usar.
4. Conclua o pagamento.

O uso de API é deduzido deste saldo. A plataforma mostra o saldo atual, uso e preços. Comece com uma pequena quantia enquanto tenta Deepsand; você pode adicionar mais mais tarde.

## 3. Crie uma chave API

1. Abra a seção **Chaves API** da plataforma.
2. Selecione **Crie uma nova chave API** ou o botão equivalente.
3. Dê à chave um nome que você reconheça, como **Deepsand**.
4. Crie a chave e copie-a imediatamente.

A chave geralmente é mostrada apenas uma vez. Trate-a como uma senha: qualquer pessoa que a possua pode gastar o crédito da sua conta.

## 4. Salve a chave em Deepsand

1. Abra Deepsand.
2. Abra **Configurações**.
3. Encontre o campo **Chave API** nas credenciais padrão.
4. Cole a chave.
5. Selecione **Salvar chave**.

Deepsand armazena a chave no keystore do seu sistema operacional, não no arquivo de configurações. A janela mostra apenas os últimos quatro caracteres após salvar, para que você possa confirmar a presença de uma chave sem expô-la novamente.

A chave de todo o aplicativo é usada quando nem a configuração do host DeepCode nem um projeto fornecem sua própria chave. Uma chave no nível do projeto ainda tem precedência.

## Use uma chave que você já possui

Se você já possui uma chave API, não precisa criar uma conta DeepSeek.

- Para usá-lo em todos os projetos, abra **Configurações**, insira a chave no campo **Chave API** e salve-a.
- Para usar um endpoint ou modelo diferente, defina também a URL base e o modelo em **Configurações** ou nas próprias credenciais do projeto.
- Para manter uma chave apenas para um projeto, abra as configurações desse projeto e insira-a lá.

O provedor deve expor um API que o DeepCode CLI possa chamar. Se você estiver usando um provedor que não seja do DeepSeek, insira o URL base e o nome do modelo em vez dos padrões do DeepSeek.

## Se algo não funcionar

- **A chave é rejeitada:** cria uma nova chave na plataforma e substitui a armazenada.
- **O saldo está vazio:** adiciona crédito à conta API. Uma assinatura de bate-papo não financia automaticamente o uso do API.
- **O assistente não consegue entrar em contato com o provedor:** verifica o modo de rede e a lista de permissões do projeto. O endpoint do modelo deve estar acessível.
- **Você deseja remover a chave:** abra **Configurações** e selecione **Remover chave**.

## Páginas relacionadas

- [Começando](./getting-started)
- [O que é Deepsand?](./what-is-deepsand)
- [Como funciona a caixa de areia](./security)

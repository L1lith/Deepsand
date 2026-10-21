---
title: Perguntas frequentes
description: Respostas curtas sobre projetos, permissões, dados e atualizações.
---

# Perguntas frequentes

## DeepCode vê meu diretório inicial?

Não. O sandbox vê o diretório do projeto em `/workspace` e os diretórios que você concede explicitamente. O restante do sistema de arquivos host não está montado.

## O que acontece quando eu aprovo uma solicitação de diretório?

Deepsand adiciona o diretório como uma concessão, recria o contêiner com a nova montagem anexada e retoma a sessão DeepCode. Uma sandbox em execução não pode obter uma montagem vinculada sem ser recriada.

## Onde minhas conversas são armazenadas?

O histórico de conversas, sessões, anexos e habilidades geradas ficam em um volume Docker por projeto. A pasta do projeto no disco contém apenas seu código e arquivos.

A remoção de um projeto de Deepsand não exclui esse volume. A limpeza dos dados DeepCode de um projeto remove o volume, mas deixa a pasta do projeto intacta.

## Onde as chaves e segredos API são armazenados?

Os segredos são criptografados em repouso com uma chave mantida pelo keystore do sistema operacional e são injetados na sandbox como variáveis ​​de ambiente somente quando ela é iniciada. A interface mostra nomes e comprimentos, nunca os valores armazenados.

As credenciais também podem ser herdadas da configuração do host DeepCode. Eles não são copiados para a pasta do projeto.

## Cada projeto pode usar um modelo diferente?

Sim. Um projeto pode herdar a configuração do host ou substituir o modelo, o URL base e as credenciais em suas próprias configurações. O seletor de cabeçalho também pode escolher um modelo para o projeto; **Adiar para configuração** significa que o projeto não fixa um.

## Qual modelo devo usar para manter os custos baixos?

Use um modelo flash para a maioria das tarefas. O padrão Deepsand é `deepseek-v4-flash`, que é a escolha mais barata para codificação, explicações e edições diárias. Reserve o `deepseek-v4-pro` para trabalhos onde o flash está claramente com dificuldades ou você precisa de sua capacidade extra, porque o modelo profissional custa mais para funcionar.

Alterne os modelos do cabeçalho do projeto ou com `/model` no terminal DeepCode. Se você estiver experimentando o Deepsand pela primeira vez, comece com o flash e só passe para o profissional quando tiver uma tarefa que precise dele.

## O que o controle deslizante de pensamento faz?

O controle deslizante de pensamento está próximo ao seletor de modelo no cabeçalho do projeto. Ele controla quanto raciocínio o modelo faz antes de responder.

| Pare | O que significa |
| --- | --- |
| **Desligado** | Não pense antes de responder. O mais rápido, mas o menos cuidadoso. |
| **Rápido** | Um pouco de reflexão, para pequenas edições bem especificadas. |
| **Equilibrado** | Pensamento moderado. A parada intermediária e o padrão sensato para trabalho real. |
| **Profundo** | Pense o máximo que o modelo puder. Mais lento e mais caro. |
| **Padrão** | Adiar para o host `settings.json`; se não disser nada, DeepCode volta para Balanceado. |

Mantenha o controle deslizante **Equilibrado** para a maioria das tarefas. É a configuração intermediária e dá bons resultados sem pagar pelo raciocínio mais lento e caro em cada solicitação. Mude para **Profundo** apenas para problemas realmente difíceis e use **Desligado** ou **Rápido** para edições pequenas e previsíveis.

## Deepsand funciona apenas com DeepSeek?

DeepSeek é o padrão porque é o modelo e endpoint com o qual o Deepsand é enviado, mas o Deepsand configura o DeepCode CLI com um nome de modelo, URL base e chave API. Você pode apontá-lo para outro provedor que expõe um API que o CLI pode chamar, geralmente um endpoint compatível com OpenAI.

Defina a URL base e o modelo do provedor em **Configurações** ou nas próprias credenciais de um projeto e armazene a chave API desse provedor no mesmo local. A política de rede do sandbox também deve permitir o endpoint do provedor.

## E se Docker Desktop não estiver em execução ou parar de responder?

Deepsand não pode iniciar um sandbox sem o mecanismo Docker. Se o Docker Desktop não estiver funcionando, dê partida e espere o motor terminar de dar partida. Deepsand verifica novamente quando a janela recupera o foco e a faixa de status oferece uma nova tentativa.

Às vezes, o Docker Desktop ainda está funcionando, mas seu mecanismo parou de responder. Reiniciar Deepsand não resolve isso; O próprio Docker Desktop precisa ser reiniciado.

- **Use o controle no aplicativo quando ele aparecer.** Se Deepsand detectar Docker Desktop, ele mostrará **Reinicie Docker Desktop…** na faixa de status ou aviso do terminal. Esse controle reinicia o mecanismo Docker, incluindo o processo WSL que ele usa em Windows, e aguarda até que um contêiner possa ser iniciado novamente.
- **Windows:** clique com o botão direito na baleia Docker na área de notificação e escolha **Reiniciar**. Se essa opção estiver faltando, abra Docker Desktop, selecione **Solucionar problemas** e depois **Reinicie Docker Desktop**.
- **macOS:** clique na baleia Docker na barra de menu e escolha **Reiniciar**.
- **Linux:** abra o menu Docker Desktop, selecione **Solucionar problemas** e depois **Reinicie Docker Desktop**. Se você usar Docker Engine em vez de Docker Desktop, reinicie seu serviço, por exemplo `sudo systemctl restart docker`.

Reiniciar Docker Desktop encerra todos os contêineres da máquina, incluindo contêineres não relacionados a Deepsand. Deepsand oferece a reinicialização, mas não o faz automaticamente. Consulte [Documentação de solução de problemas do Docker](https://docs.docker.com/desktop/troubleshoot-and-support/troubleshoot/) para obter o menu específico da plataforma.

## Posso usar Deepsand sem acesso à internet?

O modelo precisa de seu ponto final. Com o modo de rede `none`, somente esse terminal pode ser acessado por meio do proxy Deepsand. As instalações de pacotes e outros acessos à rede falharão, a menos que você permita os hosts necessários.

## Como faço para atualizar Deepsand?

Abra **Configurações**, depois **Atualizações** e verifique se há uma versão mais recente. As compilações de versão baixam atualizações assinadas e reiniciam o aplicativo após instalar uma. A instalação de uma atualização interrompe a execução de sandboxes.

## Existe uma interface de linha de comando?

Sim. `deepsandctl` fornece comandos sem cabeça, como `doctor`, `plan`, `run`, `watch`, `requests` e `network`. O aplicativo de desktop e o CLI compartilham o mesmo código de política em `deepsand-core`.

## Como faço para relatar um problema de segurança?

Não abra uma edição pública por um problema de segurança. Contate os mantenedores em particular através do canal de relatórios de segurança do repositório e inclua detalhes suficientes para reproduzir o problema.

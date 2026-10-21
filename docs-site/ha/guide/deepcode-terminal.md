---
title: Amfani da tashar DeepCode
description: >-
  Yadda ake amfani da DeepCode CLI a cikin Deepsand, babban umarnin slash da gajerun hanyoyin
  madannai.
---

# Amfani da tashar DeepCode

Deepsand yana gudanar da [Saukewa: DeepCode CLI](https://github.com/lessweb/deepcode-cli) a cikin akwatin yashi. Shafin **Tasha** shine zaman DeepCode mai rai: rubuta buƙatu a cikin yare na al'ada, ko amfani da ɗayan umarnin slash na DeepCode don sarrafa zaman.

Baka shigar da DeepCode akan injinka ba. Deepsand yana fara CLI a cikin kwandon aikin, inda zai iya ganin `/workspace` da kundin adireshi da kuka raba.

Ƙara koyo akan [DeepCode shafin gida na aikin](https://deepcode.vegamo.cn/) ko a cikin [Bayanan Bayani na DeepCode](https://github.com/lessweb/deepcode-cli).

## Fara zama

1. Zaɓi wani aiki a cikin labarun gefe.
2. Latsa **Gudu**.
3. Jira akwatin yashi ya fara. Idan hoton ya ɓace, Deepsand ya fara gina shi kuma yana nuna aikin ginin a cikin **Ayyuka**.
4. Tashar DeepCode tana bayyana lokacin da aka shirya CLI.

Tsayawa akwatin yashi yana ƙare kwandon. Fara aikin yana sake dawo da zancen DeepCode da ya gabata lokacin da akwai.

## Tambayi DeepCode don yin wani abu

Buga buƙatun al'ada kuma latsa **Shiga**. Misali:

```text
Find the failing test in this project and explain what is wrong.
```

DeepCode na iya karantawa da shirya fayiloli a cikin wurin aiki, gudanar da umarni, da amfani da kayan aikin da aka zaɓa don aikin. Kuna zama cikin iko: lokacin da yake buƙatar wani abu a wajen wurin aiki, Deepsand yana dakatar da akwatin yashi kuma ya fara tambayar ku.

## Babban umarnin yanke hukunci

Dokokin Slash suna farawa da `/`. Buga `/` da kansa yana buɗe menu na umarni.

| Umurni | Abin da yake yi |
| --- | --- |
| `/new` | Fara sabon tattaunawa |
| `/resume` | Zaɓi tattaunawar da ta gabata don ci gaba |
| `/fork` | cokali mai yatsa hirar yanzu |
| `/continue` | Ci gaba da tattaunawar aiki, ko zaɓi ɗaya don ci gaba |
| `/model` | Canja samfurin, yanayin tunani da ƙoƙarin tunani |
| `/raw` | Juya yanayin nuni: Na al'ada, Lite ko Raw gungurawa |
| `/init` | Ƙirƙiri fayil na `AGENTS.md` tare da umarnin aiki |
| `/skills` | Lissafin basirar da ke samuwa ga DeepCode |
| `/mcp` | Nuna matsayin uwar garken MCP da samuwan kayan aikin |
| `/undo` | Mayar da lambar, tattaunawar ko duka biyu zuwa wani batu na baya |
| `/exit` | Bar DeepCode |

Wataƙila wani aikin yana da `AGENTS.md`; duba kafin amfani da `/init` don kada ku maye gurbin umarnin da ke can.

## Gajerun hanyoyin allo

| Maɓalli | Aiki |
| --- | --- |
| `Enter` | Aika sakon |
| `Shift+Enter` | Saka sabon layi |
| `Ctrl+J` | Saka sabon layi |
| `Esc` | Katse jujjuyawar ƙirar yanzu |
| `Ctrl+V` | Manna hoto lokacin da zaɓin samfurin yana goyan bayan hotuna |
| `Ctrl+D` sau biyu | Bar DeepCode |

Bayan katse juyowa tare da `Esc`, zaku iya rubuta wani buƙatun. Ba a sake kunna akwatin yashi ba.

## Zama, samfuri kuma gyara

- `/new` yana farawa tare da tattaunawa mai tsafta. Ba a share fayilolin aikin ba.
- `/resume` da `/continue` sun dawo da tattaunawa ta farko.
- `/model` yana canza samfurin, yanayin tunani da ƙoƙarin tunani don zaman. Har ila yau, taken aikin yana da zaɓin ƙira da maɗaurin tunani; **Daidaitacce** ita ce tasha ta tsakiya kuma saitin da aka ba da shawarar don yawancin aiki.
- `/undo` yana mayar da lamba, tattaunawar ko duka biyu zuwa wani batu na baya. Ita ce hanya mafi sauri don ficewa daga canjin da ba ku so.

Tarihin taɗi yana rayuwa a cikin ƙarar jihar Deepsand na aikin, ba cikin ma'ajiyar ku ba.

## Izini da akwatin yashi

Tashar yana cikin akwati, don haka yana ganin aikin a `/workspace` da kundayen adireshi da kuka raba a sarari, kuma babu wani abu akan kwamfutarka.

Lokacin da DeepCode ya nemi wani kundin adireshi, wurin sadarwa, kayan aiki ko wata hanya, Deepsand yana daskare akwatin yashi kuma yana nuna maganganun izini.

- **Bada damar shiga** ya yi amfani da buƙatar kuma ya ci gaba da zama.
- **Karyata** ya ƙi shi kuma ya gaya wa DeepCode shawarar ta ƙare.
- Amincewa da kundin adireshi yana sake ƙirƙirar akwati tare da sabon dutsen.

Karanta [Yadda akwatin yashi ke aiki](./security) kafin raba kundin adireshi wanda ya ƙunshi fayiloli masu mahimmanci.

## Idan tashar ba ta fara ba

- **Hoton ya ɓace:** Deepsand ya fara gina shi. Kalli **Ayyuka** don gina ci gaba.
- **Docker Desktop baya gudu ko ya makale:** fara shi kuma jira injin ya gama farawa. Idan Docker Desktop yana gudana amma injinsa baya amsawa, sake kunna Docker Desktop. Yi amfani da in-app **Sake kunna Docker Desktop…** iko lokacin da Deepsand ya nuna shi. In ba haka ba, a kan Windows dama-danna Docker whale a cikin sanarwar yankin kuma zaɓi **Sake kunnawa**; akan macOS yi amfani da gunkin menu na Docker; akan Linux bude menu na **Shirya matsala** na Docker Desktop. Sake kunna Docker Desktop yana ƙare kowane akwati akan injin. Duba [Bayanan Bayani na Docker](./faq#what-if-docker-desktop-is-not-running-or-has-stopped-responding).
- **Maɓallin API ya ɓace ko ƙi:** yana buɗe **Saituna** kuma ya adana maɓalli mai aiki.
- **DeepCode ya fita:** sake danna **Gudu**. Za a iya ci gaba da zaman da ya gabata tare da `/resume`.

## Shafukan da ke da alaƙa

- Saukewa: [Farawa](./getting-started)
- Saukewa: [Samu maɓallin DeepSeek API](./deepseek-api)
- Saukewa: [Yadda akwatin yashi ke aiki](./security)
- Saukewa: [DeepCode shafin gida na aikin](https://deepcode.vegamo.cn/)

---
title: Kwa kutumia terminal ya DeepCode
description: Jinsi ya kutumia DeepCode CLI ndani ya Deepsand, amri zake kuu za kufyeka na mikato ya kibodi.
---

# Kwa kutumia terminal ya DeepCode

Deepsand huendesha [DeepCode CLI](https://github.com/lessweb/deepcode-cli) ndani ya kisanduku cha mchanga. Kichupo cha **Kituo** ni kipindi cha DeepCode cha moja kwa moja: charaza ombi katika lugha ya kawaida, au tumia mojawapo ya amri za kufyeka za DeepCode ili kudhibiti kipindi.

Hujasakinisha DeepCode kwenye mashine yako mwenyewe. Deepsand huanzisha CLI kwenye kontena la mradi, ambapo inaweza kuona `/workspace` na saraka ambazo umeshiriki.

Jifunze zaidi juu ya [Ukurasa wa nyumbani wa mradi wa DeepCode](https://deepcode.vegamo.cn/) au katika [Hifadhi ya DeepCode](https://github.com/lessweb/deepcode-cli).

## Anzisha kipindi

1. Chagua mradi kwenye upau wa kando.
2. Bonyeza **Kimbia**.
3. Subiri sanduku la mchanga lianze. Ikiwa picha haipo, Deepsand huijenga kwanza na kuonyesha matokeo ya ujenzi katika **Shughuli**.
4. Terminal DeepCode inaonekana wakati CLI iko tayari.

Kusimamisha sanduku la mchanga kunamaliza chombo. Kuanzisha mradi tena kunaanza tena mazungumzo ya awali ya DeepCode wakati moja yapo.

## Uliza DeepCode kufanya kitu

Andika ombi la kawaida na ubonyeze **Ingiza**. Kwa mfano:

```text
Find the failing test in this project and explain what is wrong.
```

DeepCode inaweza kusoma na kuhariri faili katika nafasi ya kazi, kuendesha amri, na kutumia zana zilizochaguliwa kwa mradi. Unabaki kudhibiti: inapohitaji kitu nje ya nafasi ya kazi, Deepsand husitisha kisanduku cha mchanga na kukuuliza kwanza.

## Amri kuu za kufyeka

Amri za kufyeka huanza na `/`. Kuandika `/` peke yake hufungua menyu ya amri.

| Amri | Inafanya nini |
| --- | --- |
| `/new` | Anzisha mazungumzo mapya |
| `/resume` | Chagua mazungumzo ya awali ili kuendelea |
| `/fork` | Zuia mazungumzo ya sasa |
| `/continue` | Endelea na mazungumzo yanayoendelea, au chagua moja ili kuendelea |
| `/model` | Badili kielelezo, modi ya kufikiri na juhudi za hoja |
| `/raw` | Geuza hali ya kuonyesha: Kawaida, Nyepesi au Ghafi ya kusogeza nyuma |
| `/init` | Unda faili ya `AGENTS.md` na maagizo ya mradi |
| `/skills` | Orodhesha ujuzi unaopatikana kwa DeepCode |
| `/mcp` | Onyesha hali ya seva ya MCP na zana zinazopatikana |
| `/undo` | Rejesha msimbo, mazungumzo au zote mbili kwa hatua ya awali |
| `/exit` | Acha DeepCode |

Mradi unaweza kuwa tayari una `AGENTS.md`; angalia kabla ya kutumia `/init` ili usibadilishe maagizo ambayo tayari yapo.

## Njia za mkato za kibodi

| Ufunguo | Kitendo |
| --- | --- |
| `Enter` | Tuma kidokezo |
| `Shift+Enter` | Weka laini mpya |
| `Ctrl+J` | Weka laini mpya |
| `Esc` | Kataza zamu ya mtindo wa sasa |
| `Ctrl+V` | Bandika picha wakati muundo uliochaguliwa unaauni picha |
| `Ctrl+D` mara mbili | Acha DeepCode |

Baada ya kukatiza zamu na `Esc`, unaweza kuandika ombi lingine. Sanduku la mchanga halijaanzishwa upya.

## Inadondosha faili kwenye terminal

Buruta faili kwenye terminal na njia yake inaandikwa kwa ajili yako.

- Faili iliyo ndani ya folda ya mradi, au ndani ya saraka ambayo umeshiriki na mradi, inarejelewa ambapo sanduku la mchanga tayari linaiona (`/workspace/...` au `/grants/...`). Hakuna kitu kinachonakiliwa.
- Faili kutoka popote pengine inakiliwa katika `/tmp/deepsand-incoming` ndani ya kisanduku cha mchanga, na Deepsand inauliza kwanza. Folda hiyo sio sehemu ya hazina yoyote, kwa hivyo faili iliyoshuka haiwezi kuishia kwenye ahadi, na inatoweka wakati sanduku la mchanga linaundwa tena. Mazungumzo yana swichi ya **Usinionye tena**, ambayo ni mpangilio sawa na **Mipangilio → Tabia → Onya kabla ya kudondosha faili kutoka nje ya mradi**.

## Kukaa hadi sasa

DeepCode CLI imewekwa ndani ya picha ya sandbox, na sandbox haiwezi kujisasisha yenyewe. Kabla ya kila kuanza Deepsand inauliza npm toleo jipya zaidi ni nini na, ikiwa picha ina ya zamani, hujenga upya sehemu hiyo ya picha kwanza - kwa hivyo terminal haifungui kamwe kwenye toleo ambalo tayari linakuuliza usasishe. Jibu linakumbukwa kwa robo ya saa, kwa hivyo hili ni ombi moja badala ya moja kwa kukimbia, na ikiwa npm haiwezi kufikiwa sanduku la mchanga linaanza kwenye toleo ambalo tayari linayo.

## Vipindi, mifano na kutendua

- `/new` inaanza tena na mazungumzo safi. Faili za mradi hazijafutwa.
- `/resume` na `/continue` hurejesha mazungumzo ya awali.
- `/model` inabadilisha modeli, modi ya kufikiri na juhudi za hoja za kipindi. Kichwa cha mradi pia kina kichaguzi cha mfano na kitelezi cha kufikiria; **Imesawazishwa** ndio kituo cha katikati na mpangilio unaopendekezwa kwa kazi nyingi.
- `/undo` hurejesha msimbo, mazungumzo au zote mbili kwa hatua ya awali. Ndiyo njia ya haraka zaidi ya kujiondoa kwenye mabadiliko ambayo hukutaka.

Historia ya mazungumzo inaishi katika hali ya Deepsand ya mradi, sio katika hazina yako.

## Ruhusa na sanduku la mchanga

Kituo kiko ndani ya kontena, kwa hivyo kinaona mradi katika `/workspace` na saraka ulizoshiriki kwa uwazi, na hakuna kitu kingine chochote kwenye kompyuta yako.

Wakati DeepCode inauliza saraka nyingine, lengwa la mtandao, zana au nyenzo nyingine, Deepsand hugandisha kisanduku cha mchanga na kuonyesha kidirisha cha ruhusa.

- **Ruhusu ufikiaji** itatumia ombi na kuanza tena kikao.
- **Si sasa** inakataa wakati huu; DeepCode inaweza kuuliza tena baadaye.
- **Usiulize tena** inaikataa, na Deepsand kisha inakataa njia hiyo (na kila kitu chini yake) au mwenyeji huyo (na vikoa vyake) yenyewe, sio kwa maneno tu. Kila kizuizi kimeorodheshwa katika Ruhusa, ambapo unaweza kukiinua tena.
- Kuidhinisha saraka kunaunda tena kontena na kipandikizi kipya.

Soma [Jinsi sandbox inavyofanya kazi](./security) kabla ya kushiriki saraka ambayo ina faili nyeti.

## Ikiwa terminal haianza

- **Picha haipo:** Deepsand huijenga kwanza. Tazama **Shughuli** kwa maendeleo ya ujenzi.
- **Docker Desktop haifanyi kazi au imekwama:** iwashe na usubiri injini imalize kuanza. Ikiwa Docker Desktop inafanya kazi lakini injini yake haijibu, anzisha tena Docker Desktop. Tumia kidhibiti cha **Anzisha tena Docker Desktop...** cha ndani ya programu Deepsand kinapokionyesha. Vinginevyo, kwenye Windows bofya kulia kwenye nyangumi Docker katika eneo la taarifa na uchague **Anzisha upya**; kwenye macOS tumia ikoni ya upau wa menyu ya Docker; kwenye Linux fungua menyu ya **Tatua** ya Docker Desktop. Kuanzisha tena Docker Desktop humaliza kila kontena kwenye mashine. Tazama [Maswali Yanayoulizwa Mara kwa Mara ya Docker](./faq#what-if-docker-desktop-is-not-running-or-has-stopped-responding).
- **Kitufe cha API hakipo au kimekataliwa:** fungua **Mipangilio** na uhifadhi ufunguo halali.
- **DeepCode imetoka:** bonyeza **Kimbia** tena. Kipindi kilichotangulia kinaweza kurejeshwa kwa `/resume`.

## Kurasa zinazohusiana

- [Kuanza](./getting-started)
- [Pata kitufe cha DeepSeek API](./deepseek-api)
- [Jinsi sandbox inavyofanya kazi](./security)
- [Ukurasa wa nyumbani wa mradi wa DeepCode](https://deepcode.vegamo.cn/)

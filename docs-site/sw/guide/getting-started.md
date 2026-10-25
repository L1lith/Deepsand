---
title: Kuanza
description: Sakinisha Deepsand, unda mradi wako wa kwanza, na uendeshe sanduku lake la mchanga.
---

# Kuanza

Deepsand hukusaidia kufanya kazi na msaidizi wa usimbaji wa AI kwenye mradi halisi bila kumpa msaidizi huyo ufikiaji kwa kompyuta yako yote. Huhitaji kuelewa Docker au mstari wa amri ili kutumia mtiririko wa kimsingi.

Ikiwa unataka picha kubwa zaidi, soma [Deepsand ni nini?](./what-is-deepsand).

## Mahitaji

- Docker Desktop kwenye Windows au macOS, au Docker Engine kwenye Linux.
- Kompyuta ya Windows, macOS au Linux. [ukurasa wa kupakua](../download) hutambua mfumo na kuorodhesha visakinishi vinavyolingana.
- Hakuna usakinishaji wa Node.js au Rust unaohitajika isipokuwa kama unaunda Deepsand kutoka kwa chanzo.

Docker Desktop lazima iwe inaendeshwa kabla ya Deepsand kuwasha sandbox. Ikiwa daemoni bado inaanza, ukanda wa hali unasema hivyo na unajitolea kuangalia tena. Docker Desktop pia inaweza kuwa inaendesha lakini bila kuitikia; ikiwa Deepsand inasema daemoni haijibu, anzisha tena Docker Desktop. Wakati Deepsand inagundua Docker Desktop inaonyesha udhibiti wa **Anzisha tena Docker Desktop...**. Tazama [nini cha kufanya ikiwa Docker Desktop haifanyi kazi au imeacha kujibu](./faq#what-if-docker-desktop-is-not-running-or-has-stopped-responding).

## Sakinisha

Fungua [Deepsand ukurasa wa kupakua](../download). Hutambua mfumo wako wa uendeshaji na kuorodhesha visakinishi vipya zaidi vya Windows, macOS na Linux kutoka toleo la sasa la GitHub. Chagua kifurushi cha kompyuta yako, kisakinishe, kisha uanze Deepsand.

Ikiwa unatengeneza Deepsand yenyewe, hazina README ina amri za kujenga-chanzo na upakiaji upya wa moto.

## Kwanza kukimbia

Huhitaji DeepCode kusakinishwa au kusanidiwa kabla ya kutumia Deepsand. Deepsand huendesha DeepCode ndani ya kisanduku cha mchanga na huja na chaguomsingi zinazoeleweka kwa modeli na sehemu ya mwisho.

Kitu kimoja unachohitaji ni ufunguo wa API wa mfano. Sehemu inayofuata inaelezea jinsi ya kupata ufunguo wa DeepSeek, au unaweza kutumia ufunguo kutoka kwa mtoa huduma mwingine. Ihifadhi katika **Mipangilio → kitufe cha API**.

Ikiwa tayari unatumia DeepCode CLI kwenye kompyuta hii, Deepsand badala yake inaweza kurithi muundo, URL msingi na ufunguo kutoka kwa usanidi wako uliopo wa DeepCode. Mradi pia unaweza kubatilisha kitambulisho hicho katika mipangilio yake yenyewe.

## Pata ufunguo wa API

Deepsand inahitaji ufunguo wa API kutoka kwa mtoa huduma wa mfano kabla ya mratibu kufanya kazi.

- **Ikiwa huna moja:** kufuata [Pata kitufe cha DeepSeek API](./deepseek-api). Hupitia kuunda akaunti, kuongeza mkopo, kutengeneza ufunguo na kurudi kwa Deepsand.
- **Ikiwa tayari unayo:** fungua **Mipangilio**, ubandike kwenye uga wa **Kitufe cha API** na uchague **Hifadhi ufunguo**.
- **Ikiwa unataka ufunguo maalum wa mradi:** fungua mipangilio ya mradi huo na uiweke hapo badala yake.

Ufunguo mpana wa programu huwekwa katika hifadhi ya vitufe vya mfumo wako wa uendeshaji, si katika faili ya hali ya Deepsand. Dirisha linaonyesha tu herufi nne za mwisho baada ya kuhifadhi.

## Unda mradi

1. Chagua **Mradi mpya** kwenye upau wa kando.
2. Ipe mradi jina.
3. Chagua saraka ya kufanya kazi.
4. Unda mradi.

Saraka ya kufanya kazi inakuwa `/workspace` ndani ya sanduku la mchanga. Deepsand inakataa njia kama vile mzizi wa mfumo wa faili, saraka yako ya nyumbani, hifadhi za hati miliki na saraka yake ya data.

## Chagua mfano

Tumia **mfano wa flash** kwa kazi nyingi. Deepsand chaguomsingi hadi `deepseek-v4-flash`, ambayo ni chaguo nafuu zaidi kwa usimbaji wa kila siku, maelezo na uhariri. Badili hadi `deepseek-v4-pro` tu wakati flash inatatizika kwa uwazi na kazi; mfano wa pro unagharimu zaidi kuendesha.

Unaweza kubadilisha mtindo katika **Mipangilio**, kutoka kwa kichwa cha mradi, au kwa `/model` kwenye terminal ya DeepCode.

## Chagua kiwango cha kufikiri

Kitelezi cha kufikiria kiko karibu na kiteuzi cha mfano kwenye kichwa cha mradi. Inadhibiti ni hoja ngapi za mfano kabla ya kujibu.

- **Imezimwa:** bila kufikiria. Haraka zaidi, lakini kwa uangalifu mdogo.
- **Haraka:** kufikiria kidogo, kwa mabadiliko madogo yaliyoainishwa vyema.
- **Mizani:** kufikiri wastani na kuacha katikati. Huu ndio chaguo-msingi la busara kwa kazi halisi.
- Upeo wa hoja wa **Kina:**. Polepole na ghali zaidi.
- **Chaguomsingi:** kuahirisha kwa mwenyeji `settings.json`; ikiwa haisemi chochote, DeepCode inarudi kwa Mizani.

Weka kitelezi kwenye **Imesawazishwa** kwa kazi nyingi. Inatoa matokeo mazuri bila kulipia hoja polepole zaidi, ya gharama kubwa zaidi kwa kila ombi. Tumia **Kina** kwa matatizo magumu tu, na **Imezimwa** au **Haraka** kwa hariri ndogo zinazoweza kutabirika.

## Endesha mradi

1. Chagua mradi.
2. Bonyeza **Kimbia**.
3. Ikiwa picha haipo, Deepsand huiunda kwanza na kuonyesha matokeo ya ujenzi kwenye kichupo cha Shughuli.
4. DeepCode CLI huanza ndani ya kontena na inaonekana kwenye terminal.

Kusimamisha sanduku la mchanga kunamaliza chombo. Kuianzisha tena huanza tena kipindi cha DeepCode kilichopita wakati moja ipo.

## Kwa kutumia terminal ya DeepCode

Kichupo cha **Kituo** ni kipindi cha DeepCode CLI cha moja kwa moja. Andika ombi na ubonyeze **Ingiza**, au utumie amri ya kufyeka ili kudhibiti kipindi. `/new` inaanzisha mazungumzo mapya, `/resume` inaendelea na ya awali, `/model` inabadilisha modeli, na `/` inafungua menyu ya amri.

Soma [Kwa kutumia terminal ya DeepCode](./deepcode-terminal) kwa amri kuu, mikato ya kibodi na hatua za kurejesha.

## Kujibu maombi ya ruhusa

Wakati DeepCode inahitaji saraka, lengwa la mtandao, zana au nyenzo nyingine, Deepsand husitisha kisanduku cha mchanga na kuonyesha ombi.

- **Ruhusu ufikiaji** inaruhusu ombi na kuanza tena kikao.
- **Si sasa** inakataa wakati huu; mfano anaweza kuuliza tena baadaye.
- **Usiulize tena** inaikataa, na Deepsand kisha inakataa njia hiyo (na kila kitu chini yake) au mwenyeji huyo (na vikoa vyake) yenyewe, sio kwa maneno tu. Kila kizuizi kimeorodheshwa katika Ruhusa, ambapo unaweza kukiinua tena.
- Ruzuku ya saraka huunda tena kontena na kipachiko kipya kilichoambatishwa.

Soma [Jinsi sandbox inavyofanya kazi](./security) kabla ya kutoa ufikiaji wa saraka ambayo ina faili nyeti.

## Mahali pa kupata vitu

| Eneo | Inaonyesha nini |
| --- | --- |
| Kituo | Kipindi cha moja kwa moja cha DeepCode ndani ya kisanduku cha mchanga. |
| Ruhusa | Saraka zinazoshirikiwa, orodha ya ruhusa ya mtandao na njia ya ukaguzi. |
| Zana | Zana zilizowekwa kwenye picha ya mradi, Uwezo uliowekwa katika vikundi, Lugha, Wasimamizi wa Vifurushi, Huduma, Uhandisi wa Kugeuza. Hakuna kilichowashwa kwa chaguo-msingi, na kubadilisha uteuzi hujenga upya picha. |
| Siri | Thamani zilizosimbwa kwa njia fiche zilizoingizwa kama vigeu vya mazingira mwanzoni. |
| Shughuli | Hoja halisi za `docker run`, kumbukumbu ya muundo na majaribio yaliyozuiwa ya kutoka. |

## Hatua zinazofuata

- [Jinsi sandbox inavyofanya kazi](./security)
- [Maswali yanayoulizwa mara kwa mara](./faq)

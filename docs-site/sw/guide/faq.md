---
title: Maswali yanayoulizwa mara kwa mara
description: Majibu mafupi kuhusu miradi, ruhusa, data na masasisho.
---

# Maswali yanayoulizwa mara kwa mara

## Je, DeepCode huona saraka yangu ya nyumbani?

Hapana. Sanduku la mchanga huona saraka ya mradi katika `/workspace` na saraka unazotoa kwa uwazi. Mfumo mwingine wa faili wa mwenyeji haujawekwa.

## Ni nini hufanyika ninapoidhinisha ombi la saraka?

Deepsand huongeza saraka kama ruzuku, hutengeneza tena kontena na kipachiko kipya kilichoambatishwa, na kuanzisha tena kipindi cha DeepCode. Sanduku la mchanga linaloendesha haliwezi kupata sehemu ya kufunga bila kuundwa upya.

## Mazungumzo yangu yamehifadhiwa wapi?

Historia ya mazungumzo, vipindi, viambatisho na ujuzi unaozalishwa huishi katika kiwango cha kila mradi cha Docker. Folda ya mradi kwenye diski ina msimbo na faili zako pekee.

Kuondoa mradi kutoka Deepsand hakufuti kiasi hicho. Kufuta data ya DeepCode ya mradi huondoa sauti lakini huacha folda ya mradi bila kuguswa.

## Vifunguo na siri za API zimehifadhiwa wapi?

Siri husimbwa kwa njia fiche zikiwa zimepumzika kwa ufunguo unaoshikiliwa na hifadhi ya funguo za mfumo wa uendeshaji, na hudungwa kwenye kisanduku cha mchanga kama vigeuzo vya mazingira tu inapoanza. Kiolesura kinaonyesha majina na urefu, kamwe si maadili yaliyohifadhiwa.

Kitambulisho kinaweza pia kurithiwa kutoka kwa usanidi wa mwenyeji wako DeepCode. Hazijanakiliwa kwenye folda ya mradi.

## Je, kila mradi unaweza kutumia modeli tofauti?

Ndiyo. Mradi unaweza kurithi usanidi wa seva pangishi au kubatilisha muundo, URL msingi na vitambulisho katika mipangilio yake yenyewe. Kiteuzi cha kichwa kinaweza pia kuchagua mfano wa mradi; **Ahirisha kusanidi** inamaanisha kuwa mradi haubandiki moja.

## Je, ni modeli gani nitumie ili kupunguza gharama?

Tumia muundo wa flash kwa kazi nyingi. Deepsand chaguomsingi hadi `deepseek-v4-flash`, ambayo ni chaguo nafuu zaidi kwa usimbaji wa kila siku, maelezo na uhariri. Hifadhi `deepseek-v4-pro` kwa kazi ambapo flash inatatizika waziwazi au unahitaji uwezo wake wa ziada, kwa sababu mfano wa pro unagharimu zaidi kuendesha.

Badilisha miundo kutoka kwa kichwa cha mradi au na `/model` kwenye terminal ya DeepCode. Ikiwa unajaribu Deepsand kwa mara ya kwanza, anza na flash na nenda kwa mtaalamu pekee wakati una kazi inayohitaji.

## Kitelezi cha kufikiria hufanya nini?

Kitelezi cha kufikiria kiko karibu na kiteuzi cha mfano kwenye kichwa cha mradi. Inadhibiti ni hoja ngapi za mfano kabla ya kujibu.

| Acha | Nini maana yake |
| --- | --- |
| **Imezimwa** | Usifikiri kabla ya kujibu. Haraka zaidi, lakini kwa uangalifu mdogo. |
| **Haraka** | Fikra kidogo, kwa mabadiliko madogo yaliyoainishwa vyema. |
| **Imesawazishwa** | Kufikiri kwa wastani. Kituo cha kati na chaguo-msingi cha busara kwa kazi halisi. |
| **Kina** | Fikiri kwa bidii kadri mfano unavyoweza. Polepole na ghali zaidi. |
| **Chaguomsingi** | Ahirisha kwa mwenyeji `settings.json`; ikiwa haisemi chochote, DeepCode inarudi kwa Mizani. |

Weka kitelezi kwenye **Imesawazishwa** kwa kazi nyingi. Ni mpangilio wa kati, na unatoa matokeo mazuri bila kulipia hoja za polepole na za gharama kubwa kwa kila ombi. Hamisha hadi **Kina** kwa matatizo magumu tu, na utumie **Imezimwa** au **Haraka** kwa hariri ndogo zinazoweza kutabirika.

## Je, Deepsand inafanya kazi na DeepSeek pekee?

No. DeepSeek ndiyo chaguo-msingi kwa sababu ndiyo kielelezo na sehemu ya mwisho ya meli za Deepsand zenye, lakini Deepsand husanidi DeepCode CLI kwa jina la mfano, URL msingi na ufunguo wa API. Unaweza kuielekeza kwa mtoa huduma mwingine anayefichua API ambayo CLI inaweza kupiga, kwa kawaida ni sehemu ya mwisho inayooana na OpenAI.

Weka URL msingi na modeli ya mtoa huduma katika **Mipangilio**, au katika stakabadhi za mradi mwenyewe, na uhifadhi ufunguo wa API wa mtoa huduma huyo mahali pamoja. Sera ya mtandao ya sandbox lazima pia iruhusu mwisho wa mtoa huduma.

## Je, ikiwa Docker Desktop haifanyi kazi au imeacha kujibu?

Deepsand haiwezi kuanzisha sanduku la mchanga bila injini ya Docker. Ikiwa Docker Desktop haifanyi kazi, iwashe na usubiri injini imalize kuanza. Deepsand hukagua tena dirisha linapolenga tena, na ukanda wa hali unatoa jaribio la kujaribu tena.

Wakati mwingine Docker Desktop bado inafanya kazi lakini injini yake imekoma kujibu. Kuanzisha tena Deepsand hakurekebisha hilo; Docker Desktop yenyewe inahitaji kuanzishwa upya.

- **Tumia kidhibiti cha ndani ya programu kinapoonekana.** Ikiwa Deepsand itatambua Docker Desktop, inaonyesha **Anzisha tena Docker Desktop...** katika ukanda wa hali au onyo la terminal. Udhibiti huo huwasha tena injini ya Docker, ikijumuisha mchakato wa WSL inaotumia kwenye Windows, na kusubiri hadi kontena lianze tena.
- **Windows:** bofya kulia nyangumi Docker katika eneo la arifa na uchague **Anzisha upya**. Ikiwa chaguo hilo halipo, fungua Docker Desktop, chagua **Tatua**, kisha **Anzisha tena Docker Desktop**.
- **macOS:** bofya nyangumi Docker kwenye upau wa menyu na uchague **Anzisha upya**.
- **Linux:** fungua menyu ya Docker Desktop, chagua **Tatua**, kisha **Anzisha tena Docker Desktop**. Ikiwa unatumia Docker Engine badala ya Docker Desktop, anzisha upya huduma yake, kwa mfano `sudo systemctl restart docker`.

Kuanzisha tena Docker Desktop humaliza kila kontena kwenye mashine, ikijumuisha kontena zisizohusiana na Deepsand. Deepsand inatoa kuanzisha upya lakini haifanyi moja kwa moja. Tazama [Hati za utatuzi wa Docker](https://docs.docker.com/desktop/troubleshoot-and-support/troubleshoot/) kwa menyu mahususi ya jukwaa.

## Je, ninaweza kutumia Deepsand bila ufikiaji wa mtandao?

Mfano unahitaji mwisho wake. Ukiwa na hali ya mtandao ya `none`, mwisho huo pekee ndio unaoweza kufikiwa kupitia proksi ya Deepsand. Usakinishaji wa vifurushi na ufikiaji mwingine wa mtandao hautafaulu isipokuwa utaruhusu wapangishaji wanaohitaji.

## Jinsi ya kusasisha Deepsand?

Fungua **Mipangilio**, kisha **Sasisho**, na uangalie toleo jipya zaidi. Toleo hutengeneza sasisho zilizotiwa saini za upakuaji na kuanzisha upya programu baada ya kusakinisha. Kusakinisha sasisho huacha kuendesha sandbox.

## Kuna kiolesura cha mstari wa amri?

Ndiyo. `deepsandctl` hutoa amri zisizo na kichwa kama vile `doctor`, `plan`, `run`, `watch`, `requests` na `network`. Programu ya eneo-kazi na CLI hushiriki msimbo sawa wa sera katika `deepsand-core`.

## Je, ninawezaje kuripoti suala la usalama?

Usifungue suala la umma kwa tatizo la usalama. Wasiliana na watunzaji kwa faragha kupitia kituo cha kuripoti usalama cha hazina na ujumuishe maelezo ya kutosha ili kuzaliana tatizo.

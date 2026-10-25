---
title: Chini ya kofia
description: Usanifu, kutengwa, mtiririko wa ruhusa, mitandao, na zana za mstari wa amri nyuma ya Deepsand.
---

# Chini ya kofia

Ukurasa huu ni wa wasanidi programu ambao wanataka umbo la kiufundi la mfumo. Ikiwa unatafuta maelezo ya lugha rahisi, anza na [Deepsand ni nini?](./what-is-deepsand).

## Usanifu

Deepsand ni programu ya eneo-kazi ya Tauri yenye tabaka tatu kuu:

- **Dirisha** ni kiolesura cha SolidJS. Inatoa hali na kutuma dhamira; haiamui sera.
- **Safu ya Tauri** hufichua amri za eneo-kazi na kutafsiri uso wa amri sawa kwa seva ya HTTP ya kitanzi kwa wateja wa mbali.
- **`deepsand-core`** inamiliki sheria. Uthibitishaji wa njia, mpango wa `docker run`, wakala wa ruhusa, proksi ya egress, hifadhi ya siri iliyosimbwa kwa njia fiche, na duka la serikali zote zinaishi hapo.

Programu ya eneo-kazi na kiendeshi cha mstari wa amri `deepsandctl` hutumia msingi sawa, kwa hivyo haziwezi kutengana kwenye uamuzi wa usalama.

## Mradi mmoja, chombo kimoja

Kila mradi hupata kontena lake la Docker na ujazo wake wa hali. Saraka ya mradi imewekwa kwenye `/workspace`; saraka zingine za mwenyeji zinahitaji ruzuku wazi.

`policy::plan_run` huunda argv kamili ya `docker run` katika sehemu moja. Kichupo cha Shughuli kinaonyesha mpango huo kamili, ikijumuisha vipachiko, uwezo, hali ya mtandao na njia za kusoma pekee.

Chombo kimezuiwa kwa makusudi:

- Mfumo wa faili wa mizizi ni wa kusoma tu, na vipandikizi vya ukubwa wa tmpfs kwa `/tmp` na `/run`.
- Spool ya majibu na saraka ya hali imewekwa kwa kusoma tu.
- Soketi za wakati wa kutumia chombo zimekataliwa kwa jina.
- Uwezo hupunguzwa kabla ya DeepCode kukimbia, na `no-new-privileges` imewekwa.
- Soketi za wakati wa kutumia kontena na vipachiko vingine vilivyopigwa marufuku hushindwa kufungwa badala ya kutoa mpango dhaifu.

## Ruhusa

Sandbox inaweza kuomba ufikiaji zaidi, lakini haiwezi kuiruhusu. Ombi la ruhusa limeandikwa kwa spool; wakala mwenyeji huithibitisha na kusitisha kontena. Opereta anaona ombi na kuamua.

Kuidhinisha ombi la saraka hutengeneza tena kontena kwa kipachiko kipya na kurudisha kipindi. Kukataa ni mojawapo ya majibu mawili, na modeli inaambiwa ambayo: **Usiulize tena** ni ya mwisho, wakati **Si sasa** inakataa wakati huu na kusema kwamba mwanamitindo anaweza kuuliza tena baadaye. Kukataliwa kwa mwisho kunahifadhiwa kwenye mradi na kutekelezwa na mwenyeji: hakuna mlima unaowahi kuundwa kwa ajili ya njia au kitu chochote chini yake, na mwenyeji aliyekataliwa huwa sheria ya kukataa inayofunika vikoa vyake vidogo. Vitalu vimeorodheshwa katika Ruhusa na vinaweza kuinuliwa hapo, kwa sababu uamuzi usio na njia ya kurudi nyuma ni mtego badala ya chaguo.

Ombi la kitu ambacho sanduku la mchanga tayari linayo limekataliwa kwa maelezo. Hakuna njia ya uidhinishaji wa kiotomatiki, kwa sababu kibali cha kimya kitakuwa kibali ambacho mwendeshaji hajawahi kutoa.

## Mtandao

Sera ya mtandao ina njia nne:

| Hali | Tabia |
| --- | --- |
| `none` | Mwisho wa mfano pekee kupitia proksi ya egress ya Deepsand. |
| `allowlisted` | Mwisho wa mfano, proksi, na seva pangishi zilizotajwa, anwani na bandari. |
| `internet` | Ufikiaji wa mtandao, na safu za ndani na za kibinafsi zimezuiwa ndani ya kontena. |
| `full` | Ufikiaji wa mtandao bila kizuizi cha mtandao wa ndani. |

Ingizo la jina la mpangishaji linatatuliwa na seva mbadala, ambayo inakataa matokeo ya faragha, ya kurudi nyuma, ya kiungo-ya karibu na yaliyohifadhiwa. Ingizo la anwani hutekelezwa moja kwa moja na kontena, ambalo ndilo huruhusu mteja wa hifadhidata au programu nyingine isiyo ya HTTP kuunganishwa. Lango iliyotajwa huchapishwa kwenye mpangilio wa nyuma wa seva pangishi pekee.

## Siri na sasisho

Siri husimbwa kwa njia fiche wakati wa kupumzika na ufunguo unaoshikiliwa na duka la vitufe vya mfumo wa uendeshaji. Zinapitishwa kwa kontena kupitia faili ya mazingira, kamwe kama dhamana ya safu ya amri, na hudungwa tu wakati sanduku la mchanga linapoanza.

Toleo hutengeneza thibitisha masasisho yaliyotiwa saini kabla ya kuyasakinisha. Ufunguo wa kusaini hauhifadhiwi kamwe kwenye hazina.

## Mstari wa amri

`deepsandctl` hutoa uso usio na kichwa:

```bash
deepsandctl doctor
deepsandctl plan <project> --offline
deepsandctl run <project>
deepsandctl watch <project>
deepsandctl requests <project>
deepsandctl network <project> <mode>
```

`plan --offline` huchapisha argv halisi ya `docker run` bila kuanzisha kontena, ambayo ni muhimu kwa kukagua sera iliyobadilishwa.

## Soma zaidi

- [Mfano kamili wa usalama](https://github.com/L1lith/Deepsand/blob/master/docs/SECURITY.md)
- [Maelezo ya usanifu](https://github.com/L1lith/Deepsand/blob/master/docs/ARCHITECTURE.md)
- [Jinsi sandbox inavyofanya kazi](./security)

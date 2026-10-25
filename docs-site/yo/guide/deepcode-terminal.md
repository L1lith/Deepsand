---
title: Lilo ebute DeepCode
description: Bii o ṣe le lo DeepCode CLI inu Deepsand, awọn pipaṣẹ idinku akọkọ rẹ ati awọn ọna abuja keyboard.
---

# Lilo ebute DeepCode

Deepsand nṣiṣẹ [DeepCode CLI](https://github.com/lessweb/deepcode-cli) inu apoti iyanrin. Taabu **Ebute** jẹ igba DeepCode laaye: tẹ ibeere kan ni ede deede, tabi lo ọkan ninu awọn pipaṣẹ slash DeepCode lati ṣakoso igba naa.

O ko fi DeepCode sori ẹrọ ti ara rẹ. Deepsand bẹrẹ CLI ninu apo eiyan ise agbese, nibiti o ti le rii `/workspace` ati awọn ilana ti o ti pin.

Kọ ẹkọ diẹ sii lori [Oju-iwe ile ise agbese DeepCode](https://deepcode.vegamo.cn/) tabi ni [DeepCode ibi ipamọ](https://github.com/lessweb/deepcode-cli).

## Bẹrẹ igba kan

1. Yan ise agbese kan ninu awọn legbe.
2. Tẹ **Ṣiṣe**.
3. Duro fun apoti iyanrin lati bẹrẹ. Ti aworan naa ba nsọnu, Deepsand kọ ọ ni akọkọ ati ṣafihan iṣelọpọ kikọ ni **Iṣẹ-ṣiṣe**.
4. DeepCode ebute yoo han nigbati CLI ti šetan.

Idekun apoti iyanrin pari opin eiyan naa. Bibẹrẹ iṣẹ akanṣe lẹẹkansi tun bẹrẹ ibaraẹnisọrọ DeepCode ti tẹlẹ nigbati ọkan wa.

## Beere DeepCode lati ṣe nkan kan

Tẹ ibeere deede ki o tẹ **Wọle**. Fun apere:

```text
Find the failing test in this project and explain what is wrong.
```

DeepCode le ka ati ṣatunkọ awọn faili ni aaye iṣẹ, ṣiṣe awọn aṣẹ, ati lo awọn irinṣẹ ti a yan fun iṣẹ akanṣe naa. O duro ni iṣakoso: nigbati o nilo ohunkan ni ita aaye iṣẹ, Deepsand da duro apoti iyanrin ati beere lọwọ rẹ ni akọkọ.

## Awọn pipaṣẹ idinku akọkọ

Awọn pipaṣẹ Slash bẹrẹ pẹlu `/`. Titẹ `/` lori tirẹ ṣii akojọ aṣayan aṣẹ.

| Òfin | Ohun ti o ṣe |
| --- | --- |
| `/new` | Bẹrẹ ibaraẹnisọrọ alabapade |
| `/resume` | Yan ibaraẹnisọrọ iṣaaju lati tẹsiwaju |
| `/fork` | Orita awọn ti isiyi ibaraẹnisọrọ |
| `/continue` | Tẹsiwaju ibaraẹnisọrọ ti nṣiṣe lọwọ, tabi mu ọkan lati bẹrẹ |
| `/model` | Yipada awoṣe, ipo ero ati igbiyanju ero |
| `/raw` | Yi ipo ifihan pada: Deede, Lite tabi Aise yi lọ |
| `/init` | Ṣẹda faili `AGENTS.md` pẹlu awọn ilana iṣẹ akanṣe |
| `/skills` | Ṣe atokọ awọn ọgbọn ti o wa si DeepCode |
| `/mcp` | Ṣe afihan ipo olupin MCP ati awọn irinṣẹ to wa |
| `/undo` | Mu koodu pada, ibaraẹnisọrọ tabi awọn mejeeji si aaye iṣaaju |
| `/exit` | Jade DeepCode |

Ise agbese kan le ti ni `AGENTS.md` tẹlẹ; ṣayẹwo ṣaaju lilo `/init` ki o maṣe rọpo awọn ilana ti o wa tẹlẹ.

## Awọn ọna abuja keyboard

| Bọtini | Igbese |
| --- | --- |
| `Enter` | Firanṣẹ kiakia |
| `Shift+Enter` | Fi titun laini |
| `Ctrl+J` | Fi titun laini |
| `Esc` | Idilọwọ awọn ti isiyi awoṣe Tan |
| `Ctrl+V` | Lẹẹmọ aworan nigbati awoṣe ti o yan ṣe atilẹyin awọn aworan |
| `Ctrl+D` lemeji | Jade DeepCode |

Lẹhin idalọwọduro titan pẹlu `Esc`, o le tẹ ibeere miiran. Apoti iyanrin ko tun bẹrẹ.

## Jiju awọn faili sinu ebute

Fa faili kan sori ebute naa ati pe ọna rẹ ti tẹ sinu rẹ.

- Faili ti o wa ninu folda ise agbese, tabi inu itọsọna ti o ti pin pẹlu iṣẹ akanṣe naa, ni a tọka si ibiti apoti iyanrin ti rii tẹlẹ (`/workspace/...` tabi `/grants/...`). Ko si ohun ti a daakọ.
- Faili kan lati ibikibi miiran ni a daakọ sinu `/tmp/deepsand-incoming` inu apoti iyanrin, ati Deepsand beere lọwọ akọkọ. folda yẹn kii ṣe apakan ti ibi ipamọ eyikeyi, nitorinaa faili ti o lọ silẹ ko le pari ni adehun, ati pe o padanu nigbati apoti iyanrin ba tun ṣe. Ifọrọwerọ naa ni iyipada **Maṣe kilo fun mi lẹẹkansi**, eyiti o jẹ eto kanna bi **Eto → Ihuwasi → Kilọ ṣaaju sisọ awọn faili silẹ lati ita iṣẹ naa**.

## Duro titi di oni

DeepCode CLI ti fi sori ẹrọ inu aworan iyanrin, ati pe apoti iyanrin ko le ṣe imudojuiwọn ararẹ. Ṣaaju ki o to bẹrẹ kọọkan Deepsand beere npm kini itusilẹ tuntun jẹ ati, ti aworan naa ba ni agbalagba, tun ṣe apakan ti aworan naa ni akọkọ - nitorinaa ebute naa ko ṣii lori ẹya ti o n beere lọwọ rẹ lati ṣe imudojuiwọn. Idahun naa jẹ iranti fun mẹẹdogun wakati kan, nitorinaa eyi jẹ ibeere kan ju ọkan lọ fun ṣiṣe, ati pe ti npm ko ba le de ọdọ apoti iyanrin bẹrẹ lori ẹya ti o ti ni tẹlẹ.

## Awọn igba, awọn awoṣe ati ki o tunṣe

- `/new` bẹrẹ pẹlu ibaraẹnisọrọ mimọ. Awọn faili ise agbese ko ni paarẹ.
- `/resume` ati `/continue` mu ibaraẹnisọrọ iṣaaju pada.
- `/model` yipada awoṣe, ipo ero ati igbiyanju ero fun igba naa. Akọsori akanṣe naa tun ni yiyan awoṣe ati esun ironu; **Iwontunwonsi** jẹ iduro aarin ati eto iṣeduro fun iṣẹ pupọ julọ.
- `/undo` mu koodu pada, ibaraẹnisọrọ tabi awọn mejeeji si aaye iṣaaju. O jẹ ọna ti o yara julọ lati ṣe afẹyinti kuro ninu iyipada ti o ko fẹ.

Itan ibaraẹnisọrọ n gbe ni iwọn ipo Deepsand ti iṣẹ akanṣe, kii ṣe si ibi ipamọ rẹ.

## Awọn igbanilaaye ati apoti iyanrin

Ibusọ naa wa ninu apo eiyan, nitorinaa o rii iṣẹ akanṣe ni `/workspace` ati awọn ilana ti o pin ni gbangba, ati pe ko si ohun miiran lori kọnputa rẹ.

Nigbati DeepCode ba beere fun itọsọna miiran, opin irin ajo nẹtiwọọki kan, ọpa kan tabi orisun miiran, Deepsand di apoti iyanrin ati ṣafihan ifọrọwerọ igbanilaaye.

- **Ifunni wiwọle** kan ibeere naa ati tun bẹrẹ igba naa.
- **Ko bayi** kọ ni akoko yii; DeepCode le beere lẹẹkansi nigbamii.
- **Maṣe beere lẹẹkansi** kọ ọ, ati Deepsand lẹhinna kọ ọna naa (ati ohun gbogbo labẹ rẹ) tabi ogun naa (ati awọn subdomains) funrararẹ, kii ṣe ni awọn ọrọ nikan. Gbogbo bulọọki wa ni atokọ ni Awọn igbanilaaye, nibi ti o ti le gbe soke lẹẹkansi.
- Ifọwọsi iwe-itọsọna kan tun ṣe eiyan pẹlu oke tuntun.

Ka [Bawo ni apoti iyanrin ṣe n ṣiṣẹ](./security) ṣaaju pinpin ilana ti o ni awọn faili ifarabalẹ ninu.

## Ti ebute ko ba bẹrẹ

- **Aworan naa sonu:** Deepsand kọ o akọkọ. Wo **Iṣẹ-ṣiṣe** fun ilọsiwaju kikọ.
- **Docker Desktop ko nṣiṣẹ tabi ti di:** bẹrẹ rẹ ki o duro fun ẹrọ lati pari ibẹrẹ. Ti Docker Desktop ba nṣiṣẹ ṣugbọn ẹrọ rẹ ko dahun, tun bẹrẹ Docker Desktop. Lo iṣakoso **Tun Docker Desktop bẹrẹ…** in-app nigbati Deepsand fihan. Bibẹẹkọ, lori Windows tẹ-ọtun Docker whale ni agbegbe iwifunni ati yan **Tun bẹrẹ**; lori macOS lo aami igi akojọ aṣayan Docker; lori Linux ṣii akojọ aṣayan **Laasigbotitusita** ti Docker Desktop. Tun bẹrẹ Docker Desktop dopin gbogbo eiyan lori ẹrọ naa. Wo [Docker FAQ](./faq#what-if-docker-desktop-is-not-running-or-has-stopped-responding).
- **Bọtini API sonu tabi kọ:** ṣii **Eto** ati fi bọtini to wulo pamọ.
- **DeepCode jade:** tẹ **Ṣiṣe** lẹẹkansi. Igba iṣaaju le tun bẹrẹ pẹlu `/resume`.

## Awọn oju-iwe ti o jọmọ

- [Bibẹrẹ](./getting-started)
- [Gba DeepSeek API bọtini](./deepseek-api)
- [Bawo ni apoti iyanrin ṣe n ṣiṣẹ](./security)
- [Oju-iwe ile ise agbese DeepCode](https://deepcode.vegamo.cn/)

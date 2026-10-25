---
title: Bibẹrẹ
description: Fi Deepsand sori ẹrọ, ṣẹda iṣẹ akanṣe akọkọ rẹ, ki o ṣiṣẹ apoti iyanrin rẹ.
---

# Bibẹrẹ

Deepsand ṣe iranlọwọ fun ọ lati ṣiṣẹ pẹlu oluranlọwọ ifaminsi AI lori iṣẹ akanṣe gidi kan laisi fifun oluranlọwọ yẹn iwọle si iyoku kọnputa rẹ. O ko nilo lati ni oye Docker tabi laini aṣẹ lati lo sisan ipilẹ.

Ti o ba fẹ aworan nla ni akọkọ, ka [Kini Deepsand?](./what-is-deepsand).

## Awọn ibeere

- Docker Desktop lori Windows tabi macOS, tabi Docker Engine lori Linux.
- A Windows, macOS tabi Linux kọmputa. [awọn gbigba lati ayelujara iwe](../download) ṣe iwari eto ati ṣe atokọ awọn fifi sori ẹrọ ti o baamu.
- Ko si fifi sori Node.js tabi Rust nilo ayafi ti o ba n kọ Deepsand lati orisun.

Docker Desktop gbọdọ ṣiṣẹ ṣaaju ki Deepsand le bẹrẹ apoti iyanrin kan. Ti daemon ba tun bẹrẹ, ṣiṣan ipo naa sọ bẹ ati pe o funni lati ṣayẹwo lẹẹkansi. Docker Desktop tun le nṣiṣẹ ṣugbọn ko dahun; ti Deepsand ba sọ pe daemon ko dahun, tun bẹrẹ Docker Desktop. Nigbati Deepsand ṣe iwari Docker Desktop o fihan iṣakoso **Tun Docker Desktop bẹrẹ…** kan. Wo [Kini lati ṣe ti Docker Desktop ko ba ṣiṣẹ tabi ti dẹkun idahun](./faq#what-if-docker-desktop-is-not-running-or-has-stopped-responding).

## Fi sori ẹrọ

Ṣii [Deepsand gbigba lati ayelujara iwe](../download). O ṣe awari ẹrọ ṣiṣe rẹ ati ṣe atokọ Windows tuntun, macOS ati awọn fifi sori ẹrọ Linux lati itusilẹ GitHub lọwọlọwọ. Yan package fun kọnputa rẹ, fi sii, lẹhinna bẹrẹ Deepsand.

Ti o ba n ṣe idagbasoke Deepsand funrararẹ, ibi ipamọ README ni ipilẹ orisun ati awọn aṣẹ atungbejade gbona.

## Ṣiṣe akọkọ

O ko nilo DeepCode ti fi sori ẹrọ tabi tunto ṣaaju lilo Deepsand. Deepsand nṣiṣẹ DeepCode inu apoti iyanrin ati pe o wa pẹlu awọn aṣiṣe oye fun awoṣe ati aaye ipari.

Ohun kan ti o nilo ni bọtini awoṣe API kan. Abala ti o tẹle n ṣalaye bi o ṣe le gba bọtini DeepSeek, tabi o le lo bọtini kan lati ọdọ olupese miiran. Fipamọ ni **Eto → API bọtini**.

Ti o ba ti lo DeepCode CLI tẹlẹ lori kọnputa yii, Deepsand le dipo jogun awoṣe, URL ipilẹ ati bọtini lati iṣeto DeepCode ti o wa tẹlẹ. Iṣẹ akanṣe tun le yi awọn iwe-ẹri wọnyẹn pada ni awọn eto tirẹ.

## Gba bọtini API kan

Deepsand nilo bọtini API lati ọdọ olupese awoṣe ṣaaju ki oluranlọwọ le ṣiṣẹ.

- **Ti o ko ba ni ọkan:** tẹle [Gba DeepSeek API bọtini](./deepseek-api). O rin nipasẹ ṣiṣẹda akọọlẹ kan, fifi kirẹditi kun, ṣiṣe bọtini kan ati pada si Deepsand.
- **Ti o ba ti ni ọkan tẹlẹ:** ṣii **Eto**, lẹẹmọ rẹ sinu aaye **API bọtini** ki o yan **Fi bọtini pamọ**.
- **Ti o ba fẹ bọtini iṣẹ akanṣe kan:** ṣii awọn eto iṣẹ akanṣe naa ki o tẹ sii sibẹ dipo.

Bọtini jakejado app ti wa ni ipamọ ninu ibi-ipamọ ẹrọ ẹrọ ṣiṣe rẹ, kii ṣe si faili ipinlẹ Deepsand. Ferese nikan fihan awọn ohun kikọ mẹrin ti o kẹhin lẹhin fifipamọ.

## Ṣẹda ise agbese

1. Yan **New ise agbese** ninu ẹgbẹ ẹgbẹ.
2. Fun ise agbese orukọ kan.
3. Yan itọsọna iṣẹ.
4. Ṣẹda ise agbese.

Itọsọna iṣẹ naa di `/workspace` inu apoti iyanrin. Deepsand kọ awọn ipa-ọna gẹgẹbi gbongbo eto faili, ilana ile rẹ, awọn ile itaja ijẹrisi ati ilana ilana data tirẹ.

## Yan awoṣe kan

Lo **filasi awoṣe** kan fun ọpọlọpọ awọn iṣẹ-ṣiṣe. Deepsand aiyipada si `deepseek-v4-flash`, eyiti o jẹ yiyan ti o din owo fun ifaminsi lojoojumọ, awọn alaye ati awọn atunṣe. Yipada si `deepseek-v4-pro` nikan nigbati filasi jẹ kedere ìjàkadì pẹlu iṣẹ-ṣiṣe kan; awoṣe pro jẹ diẹ sii lati ṣiṣẹ.

O le yi awoṣe pada ni **Eto**, lati akọsori iṣẹ akanṣe, tabi pẹlu `/model` ni ebute DeepCode.

## Yan ipele ironu

Awọn ero esun ni tókàn si awọn awoṣe selector ni ise agbese akọsori. O ṣakoso iye ero ti awoṣe ṣe ṣaaju idahun.

- **Paa:** ko si ero. Yara ju, ṣugbọn o kere julọ ṣọra.
- **Yara:** kekere ero, fun kekere daradara-pato àtúnṣe.
- **Iwontunwonsi:** ironu dede ati iduro aarin. Eyi jẹ aifọwọyi ti oye fun iṣẹ gidi.
- **Jin:** o pọju ero. O lọra ati gbowolori julọ.
- **Aiyipada:** da duro si alejo `settings.json`; ti ko ba sọ nkankan, ṣubu DeepCode pada si Iwontunws.funfun.

Jeki esun lori **Iwontunwonsi** fun ọpọlọpọ awọn iṣẹ-ṣiṣe. O funni ni awọn abajade to dara laisi isanwo fun ero ti o lọra, gbowolori julọ lori gbogbo ibeere. Lo **Jin** nikan fun awọn iṣoro ti o nira nitootọ, ati **Paa** tabi **Iyara** fun kekere, awọn atunṣe asọtẹlẹ.

## Ṣiṣe ise agbese kan

1. Yan ise agbese na.
2. Tẹ **Ṣiṣe**.
3. Ti aworan naa ba sonu, Deepsand kọ ọ ni akọkọ ati ṣafihan iṣelọpọ kikọ ni taabu Iṣẹ-ṣiṣe.
4. DeepCode CLI bẹrẹ inu apo eiyan ati han ni ebute naa.

Idekun apoti iyanrin pari opin eiyan naa. Bibẹrẹ lẹẹkansi tun bẹrẹ igba DeepCode ti tẹlẹ nigbati ọkan wa.

## Lilo ebute DeepCode

Taabu **Ebute** ni igba DeepCode CLI laaye. Tẹ ibeere kan tẹ **Wọle**, tabi lo aṣẹ idinku lati ṣakoso igba naa. `/new` bẹrẹ ibaraẹnisọrọ tuntun, `/resume` tẹsiwaju ni iṣaaju, `/model` yipada awoṣe, ati `/` ṣi akojọ aṣayan aṣẹ.

Ka [Lilo ebute DeepCode](./deepcode-terminal) fun awọn aṣẹ akọkọ, awọn ọna abuja keyboard ati awọn igbesẹ imularada.

## Ndahun awọn ibeere igbanilaaye

Nigbati DeepCode nilo itọsọna kan, opin irin ajo nẹtiwọọki kan, ọpa kan tabi orisun miiran, Deepsand da duro apoti iyanrin ati ṣafihan ibeere naa.

- **Ifunni wiwọle** gba ibeere laaye ati tun bẹrẹ igba naa.
- **Ko bayi** kọ ni akoko yii; awoṣe le beere lẹẹkansi nigbamii.
- **Maṣe beere lẹẹkansi** kọ ọ, ati Deepsand lẹhinna kọ ọna naa (ati ohun gbogbo labẹ rẹ) tabi ogun naa (ati awọn subdomains) funrararẹ, kii ṣe ni awọn ọrọ nikan. Gbogbo bulọọki wa ni atokọ ni Awọn igbanilaaye, nibi ti o ti le gbe soke lẹẹkansi.
- Ẹbun liana tun ṣe eiyan pẹlu oke tuntun ti a so.

Ka [Bawo ni apoti iyanrin ṣe n ṣiṣẹ](./security) ṣaaju fifun ni iraye si itọsọna ti o ni awọn faili ifura ninu.

## Nibo ni lati wa nkan

| Agbegbe | Ohun ti o fihan |
| --- | --- |
| Ebute | Awọn ifiwe DeepCode igba inu awọn sandbox. |
| Awọn igbanilaaye | Awọn ilana ti o pin, atokọ iyọọda nẹtiwọki ati itọpa iṣayẹwo. |
| Awọn irinṣẹ | Awọn irinṣẹ ti a yan sinu aworan iṣẹ akanṣe, Awọn agbara akojọpọ, Awọn ede, Awọn alakoso Package, Awọn ohun elo, Imọ-ẹrọ Yiyipada. Ko si ohun ti o wa ni titan nipasẹ aiyipada, ati iyipada aṣayan tun ṣe aworan naa. |
| Asiri | Awọn iye ti paroko ti abẹrẹ bi awọn oniyipada ayika ni ibẹrẹ. |
| aṣayan iṣẹ-ṣiṣe | Awọn ariyanjiyan `docker run` gangan, akọọlẹ kikọ ati awọn igbiyanju egress dina. |

## Next awọn igbesẹ

- [Bawo ni apoti iyanrin ṣe n ṣiṣẹ](./security)
- [Awọn ibeere ti a beere nigbagbogbo](./faq)

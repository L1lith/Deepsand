---
title: Labẹ awọn Hood
description: Itumọ, ipinya, ṣiṣan igbanilaaye, netiwọki, ati awọn irinṣẹ laini aṣẹ lẹhin Deepsand.
---

# Labẹ awọn Hood

Oju-iwe yii wa fun awọn olupilẹṣẹ ti o fẹ apẹrẹ imọ-ẹrọ ti eto naa. Ti o ba n wa alaye itele, bẹrẹ pẹlu [Kini Deepsand?](./what-is-deepsand).

## Faaji

Deepsand jẹ ohun elo tabili tabili Tauri pẹlu awọn fẹlẹfẹlẹ akọkọ mẹta:

- **Ferese naa** jẹ wiwo SolidJS kan. O renders ipinle ati ki o rán intents; ko ṣe ipinnu eto imulo.
- **Layer Tauri** ṣafihan awọn aṣẹ tabili ati tumọ oju-ọna aṣẹ kanna si olupin HTTP loopback fun awọn alabara latọna jijin.
- **`deepsand-core`** ni awọn ofin. Ifọwọsi ipa-ọna, ero `docker run`, alagbata igbanilaaye, aṣoju egress, ile itaja aṣiri ti paroko, ati ile itaja ipinlẹ gbogbo wọn ngbe ibẹ.

Ohun elo tabili tabili ati awakọ laini aṣẹ `deepsandctl` lo mojuto kanna, nitorinaa wọn ko le ya sọtọ lori ipinnu aabo kan.

## Ise agbese kan, eiyan kan

Ise agbese kọọkan gba eiyan Docker tirẹ ati iwọn didun ipinlẹ tirẹ. Ilana ise agbese ti wa ni gbigbe ni `/workspace`; miiran ogun ilana nilo fojuhan igbeowosile.

`policy::plan_run` kọ awọn pipe `docker run` argv ni ibi kan. Awọn taabu aṣayan iṣẹ-ṣiṣe fihan wipe gangan ètò, pẹlu awọn gbeko, awọn agbara, nẹtiwọki mode ati kika-nikan ona.

Epo naa ti ni ihamọ mọọmọ:

- Eto faili gbongbo jẹ kika-nikan, pẹlu iwọn tmpfs gbeko fun `/tmp` ati `/run`.
- Idahun spool ati iwe ilana ipinle ti wa ni agesin kika-nikan.
- Awọn ibọsẹ igba-akoko apoti jẹ kọ nipasẹ orukọ.
- Awọn agbara ti lọ silẹ ṣaaju ṣiṣe DeepCode, ati `no-new-privileges` ti ṣeto.
- Awọn ibọsẹ-akoko asiko apoti ati awọn agbeko eewọ miiran kuna ni pipade kuku ju iṣelọpọ ero alailagbara kan jade.

## Awọn igbanilaaye

Apoti iyanrin le beere fun iraye si diẹ sii, ṣugbọn ko le fun ni. A fun igbanilaaye ìbéèrè ti kọ si a spool; alagbata agbalejo fọwọsi rẹ ati da duro eiyan naa. Oniṣẹ n wo ibeere naa o pinnu.

Gbigba ibeere itọsọna kan tun ṣe eiyan naa pẹlu oke dipọ tuntun ati tun bẹrẹ igba naa. Kiko ni ase ati ki o ti wa ni royin si awọn awoṣe.

Ibere ​​fun nkan ti apoti iyanrin ti ni tẹlẹ ni a kọ pẹlu alaye kan. Ko si ipa-ọna alafọwọsi aifọwọyi, nitori ifọwọsi ipalọlọ yoo jẹ ifọwọsi oniṣẹ ẹrọ ko funni.

## Nẹtiwọki

Ilana nẹtiwọki ni awọn ọna mẹrin:

| Ipo | Iwa |
| --- | --- |
| `none` | Nikan aaye ipari awoṣe nipasẹ aṣoju egress Deepsand. |
| `allowlisted` | Ojuami ipari awoṣe, aṣoju, ati awọn ogun ti a npè ni, awọn adirẹsi ati awọn ebute oko oju omi. |
| `internet` | Wiwọle Intanẹẹti, pẹlu agbegbe ati awọn sakani ikọkọ ti dina mọ inu eiyan naa. |
| `full` | Wiwọle Ayelujara laisi bulọọki-nẹtiwọọki agbegbe. |

Titẹwọle orukọ olupin ni ipinnu nipasẹ aṣoju, eyiti o kọ ikọkọ, loopback, ọna asopọ-agbegbe ati awọn abajade ti a fi pamọ. Titẹ sii adirẹsi kan ni ipa taara nipasẹ apo eiyan, eyiti o jẹ ki alabara data data tabi eto miiran ti kii ṣe HTTP sopọ. A ti a npè ni ibudo ti wa ni atejade lori ogun loopback nikan.

## Asiri ati awọn imudojuiwọn

Awọn aṣiri ti wa ni fifi ẹnọ kọ nkan ni isinmi pẹlu bọtini ti o waye nipasẹ ibi ipamọ ẹrọ ẹrọ. Wọn ti kọja si apo eiyan nipasẹ faili ayika, kii ṣe bi iye laini aṣẹ, ati pe wọn jẹ itasi nikan nigbati apoti iyanrin ba bẹrẹ.

Itusilẹ kọ ṣe idaniloju awọn imudojuiwọn fowo si ṣaaju fifi wọn sii. Bọtini ibuwọlu ko ni ipamọ rara si ibi ipamọ.

## Laini aṣẹ

`deepsandctl` n pese oju ti ko ni ori:

```bash
deepsandctl doctor
deepsandctl plan <project> --offline
deepsandctl run <project>
deepsandctl watch <project>
deepsandctl requests <project>
deepsandctl network <project> <mode>
```

`plan --offline` tẹjade gangan `docker run` argv lai bẹrẹ eiyan kan, eyiti o wulo fun atunyẹwo eto imulo ti o yipada.

## Ka siwaju

- [Awọn ni kikun aabo awoṣe](https://github.com/L1lith/Deepsand/blob/master/docs/SECURITY.md)
- [Awọn akọsilẹ faaji](https://github.com/L1lith/Deepsand/blob/master/docs/ARCHITECTURE.md)
- [Bawo ni apoti iyanrin ṣe n ṣiṣẹ](./security)

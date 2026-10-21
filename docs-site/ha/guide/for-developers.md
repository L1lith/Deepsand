---
title: Karkashin kaho
description: >-
  Gine-gine, keɓewa, kwararar izini, sadarwar sadarwar, da kayan aikin layin umarni da ke bayan
  Deepsand.
---

# Karkashin kaho

Wannan shafin na masu haɓakawa ne waɗanda ke son siffar fasaha na tsarin. Idan kuna neman bayanin bayyanannen harshe, fara da [Menene Deepsand?](./what-is-deepsand).

## Gine-gine

Deepsand app ne na tebur na Tauri tare da manyan yadudduka uku:

- **Tagan** sigar SolidJS ce. Yana sanya jihar kuma yana aika da niyya; ba ya yanke shawara.
- **Layer na Tauri** yana fallasa umarnin tebur kuma yana fassara saman umarni iri ɗaya zuwa uwar garken HTTP madauki don abokan ciniki masu nisa.
- **Saukewa: `deepsand-core`** ya mallaki dokoki. Tabbatar da hanyar, shirin `docker run`, dillali mai izini, wakili na egress, ɓoyayyen kantin sayar da sirri, da kantin kayan jihar duk suna zaune a wurin.

Aikace-aikacen tebur da direban layin umarni `deepsandctl` suna amfani da mahimmanci iri ɗaya, don haka ba za su iya karkata ba akan shawarar tsaro.

## Aikin daya, kwantena daya

Kowane aikin yana samun nasa akwati Docker da juzu'in jiharsa. An ɗora littafin aikin a `/workspace`; sauran kundayen adireshi masu masaukin baki suna buƙatar tallafin fayyace.

`policy::plan_run` yana gina cikakken `docker run` argv a wuri guda. Shafin Ayyukan yana nuna ainihin shirin, gami da hawa, iyawa, yanayin cibiyar sadarwa da hanyoyin karantawa kawai.

An danne kwantena da gangan:

- Tushen tsarin fayil ana karantawa kawai, tare da girman tmpfs masu hawa don `/tmp` da `/run`.
- An ɗora spool mai amsawa da kundin adireshi na jihohi karatu-kawai.
- An ƙi soketsan lokacin kwantena da suna.
- Ana sauke iyakoki kafin DeepCode ya gudana, kuma an saita `no-new-privileges`.
- Kwantena-lokacin aiki na kwantena da sauran tsaunukan da aka haramta sun kasa rufe maimakon samar da tsari mai rauni.

## Izini

Akwatin yashi na iya neman ƙarin damar shiga, amma ba zai iya ba da shi ba. Ana rubuta buƙatar izini zuwa spool; dillalin mai masaukin baki ya inganta shi kuma ya dakatar da akwati. Mai aiki yana ganin buƙatar kuma ya yanke shawara.

Amincewa da buƙatun kundin adireshi yana sake ƙirƙirar akwati tare da sabon ɗaurin ɗaure kuma ya ci gaba da zama. Musanta shine ƙarshe kuma an ba da rahoto ga ƙirar.

An ƙi buƙatar wani abu da akwatin yashi ya riga ya kasance tare da bayani. Babu hanyar amincewa ta atomatik, saboda amincewar shiru zai zama yarda mai aiki bai taɓa bayarwa ba.

## Sadarwar sadarwa

Manufar hanyar sadarwa tana da hanyoyi guda huɗu:

| Yanayin | Hali |
| --- | --- |
| `none` | Ƙarshen ƙirar ƙirar kawai ta hanyar Deepsand egress proxy. |
| `allowlisted` | Ƙarshen ƙirar ƙirar, wakili, da runduna mai suna, adireshi da tashoshin jiragen ruwa. |
| `internet` | Samun damar Intanet, tare da toshe kewayon gida da na sirri a cikin akwati. |
| `full` | Samun damar Intanet ba tare da toshe cibiyar sadarwar gida ba. |

Ana warware shigarwar sunan mai masauki ta hanyar wakili, wanda ya ƙi masu zaman kansu, madauki, hanyar haɗin gida da sakamakon da aka tanada. Ana aiwatar da shigar da adireshi kai tsaye ta kwantena, wanda shine abin da ke barin abokin ciniki na bayanai ko wasu shirye-shiryen da ba na HTTP ba. Ana buga tashar jiragen ruwa mai suna akan madaidaicin madaidaicin kawai.

## Sirri da sabuntawa

Ana rufaffen sirri yayin hutawa tare da maɓalli da ke riƙe da maɓallan tsarin aiki. Ana wuce su zuwa akwati ta hanyar fayil ɗin yanayi, ba a matsayin ƙimar layin umarni ba, kuma ana allura kawai lokacin da akwatin yashi ya fara.

Sakin yana gina tabbatar da sabunta sa hannu kafin saka su. Ba a taɓa adana maɓallin sa hannu a ma'ajiyar.

## Layin umarni

`deepsandctl` yana ba da saman mara kai:

```bash
deepsandctl doctor
deepsandctl plan <project> --offline
deepsandctl run <project>
deepsandctl watch <project>
deepsandctl requests <project>
deepsandctl network <project> <mode>
```

`plan --offline` yana buga ainihin `docker run` argv ba tare da fara akwati ba, wanda ke da amfani don sake duba tsarin da aka canza.

## Kara karantawa

- Saukewa: [Cikakken samfurin tsaro](https://github.com/L1lith/Deepsand/blob/master/docs/SECURITY.md)
- Saukewa: [Bayanan gine-gine](https://github.com/L1lith/Deepsand/blob/master/docs/ARCHITECTURE.md)
- Saukewa: [Yadda akwatin yashi ke aiki](./security)

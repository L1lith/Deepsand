---
title: Farawa
description: Shigar Deepsand, ƙirƙiri aikin ku na farko, kuma gudanar da akwatin yashi.
---

# Farawa

Deepsand yana taimaka muku aiki tare da mataimaki na coding AI akan ainihin aikin ba tare da ba wa wannan mataimakin damar zuwa sauran kwamfutarku ba. Ba kwa buƙatar fahimtar Docker ko layin umarni don amfani da kwararar asali.

Idan kuna son babban hoto da farko, karanta [Menene Deepsand?](./what-is-deepsand).

## Abubuwan bukatu

- Docker Desktop akan Windows ko macOS, ko Docker Engine akan Linux.
- Windows, macOS ko Linux kwamfuta. [downloads shafi](../download) yana gano tsarin kuma ya jera masu shigarwa masu dacewa.
- Ba a buƙatar shigarwa Node.js ko Rust sai dai idan kuna gina Deepsand daga tushe.

Docker Desktop dole ne ya kasance yana gudana kafin Deepsand ya iya fara akwatin yashi. Idan har yanzu daemon yana farawa, matakin matsayi ya faɗi haka kuma yana ba da sake dubawa. Docker Desktop kuma yana iya gudana amma baya amsawa; idan Deepsand ya ce daemon baya amsawa, sake kunna Docker Desktop. Lokacin da Deepsand ya gano Docker Desktop yana nuna ikon **Sake kunna Docker Desktop…**. Duba [abin da za a yi idan Docker Desktop baya gudana ko ya daina amsawa](./faq#what-if-docker-desktop-is-not-running-or-has-stopped-responding).

## Shigar

Bude [Zazzage shafin Deepsand](../download). Yana gano tsarin aikin ku kuma ya jera sabbin masu sakawa Windows, macOS da Linux daga sakin GitHub na yanzu. Zaɓi kunshin don kwamfutarka, shigar da shi, sannan fara Deepsand.

Idan kuna haɓaka Deepsand kanta, ma'ajin README yana da umarni-ginin tushe da umarnin sake lodi.

## Gudu na farko

Ba kwa buƙatar shigar ko saita DeepCode kafin amfani da Deepsand. Deepsand yana gudanar da DeepCode a cikin akwatin yashi kuma ya zo tare da ma'ana mai ma'ana don ƙirar da ƙarshen ƙarshen.

Abu daya da kuke buƙata shine ƙirar API maɓallin. Sashe na gaba yana bayanin yadda ake samun maɓallin DeepSeek, ko kuna iya amfani da maɓalli daga wani mai badawa. Ajiye shi a cikin **Saituna → maɓallin API**.

Idan kun riga kun yi amfani da DeepCode CLI akan wannan kwamfutar, a maimakon haka Deepsand na iya gado samfurin, URL na tushe da maɓalli daga tsarin ku na DeepCode na yanzu. Har ila yau, wani aiki na iya ƙetare waɗannan takaddun shaida a cikin saitunan sa.

## Samu maɓallin API

Deepsand yana buƙatar maɓallin API daga mai bada samfuri kafin mataimaki ya iya gudu.

- **Idan ba ku da daya:** bi [Samu maɓallin DeepSeek API](./deepseek-api). Yana tafiya ta hanyar ƙirƙirar asusu, ƙara kuɗi, yin maɓalli da dawowa zuwa Deepsand.
- **Idan kana da daya:** bude **Saituna**, manna shi a cikin filin **Maɓallin API** kuma zaɓi **Ajiye maɓalli**.
- **Idan kuna son takamaiman maɓalli:** bude saitunan aikin kuma shigar da shi a can maimakon.

Ana adana maɓalli mai faɗin ƙa'idar a cikin maɓallan tsarin aikin ku, ba a cikin fayil ɗin jihar Deepsand ba. Tagan kawai yana nuna haruffa huɗu na ƙarshe bayan adanawa.

## Ƙirƙiri aiki

1. Zaɓi **Sabon aikin** a cikin labarun gefe.
2. Ba wa aikin suna.
3. Zaɓi kundin adireshin aiki.
4. Ƙirƙiri aikin.

Kundin tsarin aiki ya zama `/workspace` a cikin akwatin yashi. Deepsand ya ƙi hanyoyi kamar tushen tsarin fayil, kundin adireshin gidan ku, shagunan shaidar shaida da kundin bayanan kansa.

## Zaɓi samfuri

Yi amfani da **flash model** don yawancin ayyuka. Deepsand ya sabawa `deepseek-v4-flash`, wanda shine mafi arha zaɓi don yin rikodin yau da kullun, bayani da gyarawa. Canja zuwa `deepseek-v4-pro` kawai lokacin da walƙiya ke fafitikar da ɗawainiya; samfurin pro yana kashe ƙarin don gudu.

Kuna iya canza samfurin a cikin **Saituna**, daga kan aikin, ko tare da `/model` a cikin tashar DeepCode.

## Zaɓi matakin tunani

Madogarar tunani tana kusa da mai zaɓin ƙira a cikin taken aikin. Yana sarrafa yawan dalilan da ƙirar ke yi kafin amsawa.

- **A kashe:** babu tunani. Mafi sauri, amma mafi ƙarancin hankali.
- **Mai sauri:** ɗan tunani, don ƙananan ƙayyadaddun gyare-gyare.
- **Ma'auni:** matsakaicin tunani da tsayawa ta tsakiya. Wannan shi ne madaidaicin tsoho don aiki na gaske.
- **Zurfi:** matsakaicin dalili. A hankali kuma mafi tsada.
- **Na asali:** ya jinkirta zuwa ga mai watsa shiri `settings.json`; idan bai ce komai ba, DeepCode ya koma Balanced.

Ajiye faifai akan **Daidaitacce** don yawancin ayyuka. Yana ba da sakamako mai kyau ba tare da biyan kuɗi mafi hankali ba, dalili mafi tsada akan kowace buƙata. Yi amfani da **Zurfafa** kawai don matsaloli masu wuyar gaske, da **Kashe** ko **Mai sauri** don ƙarami, gyare-gyare masu iya tsinkaya.

## Gudanar da aiki

1. Zaɓi aikin.
2. Latsa **Gudu**.
3. Idan hoton ya ɓace, Deepsand ya fara gina shi kuma yana nuna abin da aka gina a cikin Ayyukan Ayyuka.
4. DeepCode CLI yana farawa a cikin akwati kuma yana bayyana a cikin tasha.

Tsayawa akwatin yashi yana ƙare kwandon. Farawa kuma yana dawo da zaman DeepCode da ya gabata lokacin da akwai.

## Amfani da tashar DeepCode

Shafin **Tasha** shine zaman DeepCode CLI mai rai. Buga buƙatun kuma latsa **Shiga**, ko yi amfani da slash umarni don sarrafa zaman. `/new` ya fara sabon tattaunawa, `/resume` ya ci gaba da farko, `/model` yana canza samfurin, kuma `/` yana buɗe menu na umarni.

Karanta [Amfani da tashar DeepCode](./deepcode-terminal) don manyan umarni, gajerun hanyoyin madannai da matakan dawowa.

## Amsa buƙatun izini

Lokacin da DeepCode yana buƙatar jagora, wurin da ke hanyar sadarwa, kayan aiki ko wata hanya, Deepsand yana dakatar da akwatin yashi kuma yana nuna buƙatar.

- **Bada damar shiga** yana ba da damar buƙatar kuma ta ci gaba da zama.
- **Ba yanzu** ya ƙi shi a wannan lokacin; samfurin na iya sake tambaya daga baya.
- **Kar a sake tambaya** ya ƙi shi, kuma Deepsand ya ƙi wannan hanya (da duk abin da ke ƙarƙashinsa) ko kuma mai masaukin (da ƙananan yanki) kanta, ba kawai a cikin kalmomi ba. Ana jera kowane shinge a cikin Izini, inda zaku iya sake ɗaga shi.
- Tallafin kundin adireshi yana sake ƙirƙirar akwati tare da sabon dutsen da aka makala.

Karanta [Yadda akwatin yashi ke aiki](./security) kafin ba da damar yin amfani da kundin adireshi wanda ya ƙunshi fayiloli masu mahimmanci.

## Inda za a sami abubuwa

| Yanki | Abin da yake nunawa |
| --- | --- |
| Tashar | Zaman DeepCode mai rai a cikin akwatin yashi. |
| Izini | Kundin adireshi da aka raba, jerin izinin hanyar sadarwa da hanyar duba. |
| Kayan aiki | Kayan aikin da aka toya a cikin hoton aikin, Ƙarfafan Rukuni, Harsuna, Manajan Kunshin, Abubuwan Utilities, Injiniyan Baya. Babu wani abu da ke kunne ta tsohuwa, kuma canza zaɓin yana sake gina hoton. |
| Sirri | Ƙimar rufaffiyar allura azaman masu canjin yanayi a farkon. |
| Ayyuka | Madaidaicin muhawarar `docker run`, gunkin ginin da katange yunƙurin ƙuri'a. |

## Matakai na gaba

- Saukewa: [Yadda akwatin yashi ke aiki](./security)
- Saukewa: [Tambayoyin da ake yawan yi](./faq)

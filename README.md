# LucFlori — site static

Site nou pentru **LucFlori**, producător român de gerbera (Comuna Florești-Stoenești, jud. Giurgiu),
înlocuind vechiul site Wix. Fără pas de build, fără dependințe: se publică direct pe GitHub Pages.

## Publicare pe GitHub Pages

1. Creați un repository și încărcați tot conținutul acestui folder în rădăcina lui.
2. **Settings → Pages → Source: Deploy from a branch**, branch `main`, folder `/ (root)`.
3. Site-ul apare la `https://<utilizator>.github.io/<repo>/`.

Toate căile din HTML sunt relative, deci funcționează și în subfolder (`/<repo>/`), și pe domeniu propriu.
Fișierul `.nojekyll` dezactivează procesarea Jekyll.

### Domeniu propriu (opțional)

Adăugați un fișier `CNAME` cu domeniul (ex. `lucflori.ro`), apoi la registrar un `CNAME`
către `<utilizator>.github.io`. După aceea înlocuiți `https://lucflori.ro/` din etichetele
`<link rel="canonical">` cu adresa reală.

## Structura

```
index.html            pagina principală (peretele de culori, povestea, tipurile, contact)
catalog.html          sortimentul filtrabil — 89 de cultivaruri
livrare.html          cum se comandă, întrebări frecvente
contact.html          telefon, e-mail, adresă, program
404.html
data/varieties.js     datele sortimentului (89 de cultivaruri)
assets/css/           tokens → base → home / catalog / page
assets/js/            home.js, catalog.js, motion.js (JavaScript simplu, fără framework)
assets/img/varieties/ 89 × 2 imagini (260 px și 520 px, WebP)
assets/img/photos/    fotografiile din vechiul site, reencodate WebP
```

## De unde vin datele

Totul e preluat din vechiul site și din **planșele de varietăți** ale producătorului
(imaginile din galeria Wix). Cele 89 de capete florale din catalog au fost decupate
individual din acele planșe; culoarea fiecărui cultivar (`x`) și nuanța (`h`) sunt
**măsurate din pixelii petalei**, nu alese manual. Cele 31 de cultivaruri marcate
`new: 1` sunt cele care aveau eticheta verde „NOU” pe planșe.

Familiile de culoare (`f`) sunt derivate automat din nuanță, cu opt corecții manuale
acolo unde media pixelilor nu corespundea planșei (MILADY, JOSIE, USTICA, GONZO,
CAMILLA, RILEY, NUANCE, MAYBALL).

## Ce trebuie completat de proprietar

Vechea pagină „Livrare” de pe Wix conținea doar text-șablon („I'm a shipping policy
section…”), deci nu exista nicio informație reală de preluat. Pagina nouă spune doar
lucruri confirmate. Dacă vreți să fie completă, trimiteți-mi:

- comanda minimă (număr de tije sau valoare)
- zona de livrare și cine asigură transportul
- modul de ambalare (câte tije/cutie, tip de ambalaj)
- termen de plată și modalități accepate
- dacă se poate ridica marfa direct de la seră și în ce interval

De adăugat, dacă există: **CUI / date de facturare** în subsol.
Facebook, Instagram, Google Maps și Waze sunt deja legate în antet, subsol și pe
paginile de contact și livrare.

## Formularul de comandă

GitHub Pages servește doar fișiere statice, deci nu poate procesa formulare.
Butonul **„Trimite pe e-mail”** din catalog compune un mesaj `mailto:` cu lista de
varietăți alese, către `lucflor@gmail.com`. Lista se ține în `localStorage`, deci
rămâne salvată dacă vizitatorul închide pagina.

Dacă doriți un formular clasic în pagină, se poate adăuga fără server prin Formspree
sau Netlify Forms (ambele funcționează pe GitHub Pages).

## Actualizarea sortimentului

Editați `data/varieties.js` — un rând pe cultivar:

```js
{n:"SUBMARINE", s:"submarine", c:"std", f:"galben", h:43.5, x:"#efae02"}
```

`n` nume · `s` numele fișierului din `assets/img/varieties/` · `c` categoria
(cheile din `cats`) · `f` familia de culoare (cheile din `families`) · `h` nuanța în
grade, folosită la sortare · `x` culoarea afișată pe card · `new:1` pentru eticheta NOU.

Pentru un cultivar nou adăugați și imaginile `slug.webp` (260×260) și `slug@2x.webp` (520×520).

## Direcția vizuală

Paleta nu conține culori inventate: portocaliul `#ff5a00` și verdele `#11963a` sunt
prelevate din siglă, iar spălările de secțiune și culoarea fiecărui card vin din
pixelii petalelor. Secțiunile alternează intenționat — alb, roz, bloc întunecat,
verde-mentă, alb — ca parcurgerea paginii să treacă prin paletă.

Mișcarea e strânsă în `assets/js/motion.js`:

- dezvăluire la derulare, decalată în cadrul fiecărui grup
- antetul se strânge după 24 px de derulare

Clasa `.reveal` e aplicată din JavaScript, deci fără JS nu se ascunde nimic.
Tot ce se mișcă folosește doar `transform` și `opacity` și se oprește complet la
`prefers-reduced-motion`.

## Verificări făcute

- fără scroll orizontal — verificat pe 5 pagini × 4 lățimi (320 / 375 / 768 / 1440)
- contrast de culoare ≥ 4.5:1 pentru text mic (portocaliul de brand se folosește doar
  la titluri mari; pentru text mic există o variantă mai închisă)
- funcționează cu tastatura: link de salt, inele de focalizare, fișa se închide cu Esc,
  navigare între cultivaruri cu ← și →
- `prefers-reduced-motion` respectat: dezvăluirile, benzile și tranzițiile se opresc
- textul alb de pe blocul portocaliu folosește `#c74600` (4.88:1), nu portocaliul de brand
- catalogul are stare în adresa paginii: `catalog.html?tip=mini&culoare=roz`
- imaginile au dimensiuni explicite; cele de sub prima vizualizare se încarcă leneș

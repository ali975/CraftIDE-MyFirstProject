# CraftIDE - Kapsamli Gelistirme Plani

> **Amac:** Kullanicilarin kodlama bilmeden mod, plugin ve skript yapabilmelerine imkan tanimak.
> **Tarih:** 4 Mart 2026
> **Surum:** v0.1.0 Analiz Raporu

---

## Icindekiler

- [Mevcut Durum Ozeti](#mevcut-durum-ozeti)
- [Tespit Edilen Eksiklikler](#tespit-edilen-eksiklikler)
- [A - No-Code UX Iyilestirmeler](#a---no-code-ux-iyilestirmeler)
- [B - AI ve Otomasyon](#b---ai-ve-otomasyon)
- [C - Yeni Arac ve Modul Onerileri](#c---yeni-arac-ve-modul-onerileri)
- [D - Teknik Altyapi Iyilestirmeleri](#d---teknik-altyapi-iyilestirmeleri)
- [Oncelik Siralamasi](#oncelik-siralamasi)
- [Yol Haritasi](#yol-haritasi)

---

## Mevcut Durum Ozeti

CraftIDE su anda asagidaki bilesenlerle calismaktadir:

| Bilesen | Durum | Aciklama |
|---------|-------|----------|
| **Visual Builder** | Mevcut | Node tabanli gorsel editor (Plugin/Fabric/Forge/Skript modlari) |
| **AI Asistan** | Mevcut | Ollama/OpenAI/Anthropic/Google destekli chat + blueprint olusturma |
| **Proje Scaffolding** | Mevcut | Spigot/Paper/Fabric/Forge/Skript/Velocity/Bungee proje sablonlari |
| **GUI Builder** | Mevcut | Chest GUI tasarimcisi |
| **Recipe Creator** | Mevcut | Crafting tarifi olusturucu |
| **Command Tree** | Mevcut | Komut agaci modelleme |
| **Permission Tree** | Mevcut | Izin hiyerarsisi editoru |
| **Test Server** | Mevcut | Gomulu Paper test sunucusu |
| **Template Market** | Mevcut | Yerel JSON tabanli blueprint paylasimi |
| **Image Editor** | Mevcut | Pixel art editoru |
| **Monaco Editor** | Mevcut | Kod editoru + Skript syntax highlighting |
| **i18n** | Mevcut | TR/EN dil destegi |
| **No-Code Suite** | Mevcut | Intent wizard, behavior pack, graph validation, guaranteed build |

### Teknik Yapi

- **Platform:** Electron masaustu uygulamasi
- **Main Process:** TypeScript (src/main/)
- **Renderer:** Vanilla JavaScript + HTML + CSS (src/renderer/)
- **Editor:** Monaco Editor
- **Terminal:** xterm.js
- **Extension Sistemi:** VS Code benzeri extension mimarisi (5 dahili extension)
- **Build:** electron-builder (Windows portable + NSIS installer)

---

## Tespit Edilen Eksiklikler

### Kritik Eksiklikler

1. **"Kodlama bilmeden" hedefine ulasmada bosluk var**
   - Visual Builder node'lari hala teknik terimler kullaniyor (`PlayerJoinEvent`, `onCommand` vb.)
   - Kullanici "oyuncu sunucuya girdiginde" gibi dogal dilde ifade yazmak ister
   - AI entegrasyonu var ama kullanici hala teknik bilgi gerektiren ifadeler kullanmak zorunda

2. **Test altyapisi tamamen eksik**
   - Hicbir unit test, integration test veya E2E test dosyasi yok
   - Bu, uzun vadede kalite ve guvenilirlik sorunlarina yol acar

3. **Renderer mimarisi olceklenemiyor**
   - Tamamen vanilla JS, framework yok
   - Buyuk monolitik dosyalar (app.js, visual-builder.js)
   - State management eksik

4. **Extension runtime belirsiz**
   - Extension'lar tanimlanmis ama Electron icerisinde gercek bir extension host mekanizmasi eksik

5. **Marketplace sadece yerel**
   - Gercek online paylasim mekanizmasi yok
   - Topluluk katkilari desteklenmiyor

---

## A - No-Code UX Iyilestirmeler

### A1. Sihirbaz (Wizard) Tabanli Plugin Olusturma

**Problem:** Visual Builder node'lari hala teknik terminoloji kullaniyor. Kodlama bilmeyen kullanici `PlayerJoinEvent`, `onCommand` gibi kavramlari bilmiyor.

**Cozum:** Adim adim sihirbaz akisi:

```
Adim 1: "Ne tur bir plugin yapacaksin?"
  -> Oyun modu / Yonetim / Eglence / Ekonomi / PvP / Koruma

Adim 2: "Hangi tetikleyicileri istiyorsun?" (gorsel kartlarla)
  -> "Oyuncu sunucuya girdiginde"
  -> "Oyuncu bir komut yazdiginda"
  -> "Oyuncu oldugunde"
  -> "Bir blok kirildiginda"

Adim 3: "Ne olsun?" (aksiyon kartlari)
  -> "Mesaj gonder" / "Esya ver" / "Isinla" / "Ses cal" / "Partikul efekti"

Adim 4: Otomatik Visual Builder graph olusturma + kod uretimi
```

Kullanici hicbir zaman `PlayerJoinEvent` yazmiyor. Turkce/Ingilizce dogal dilde kartlar seciyor.

**Uygulama detaylari:**
- Her adimda gorsel kartlar (ikon + baslik + kisa aciklama)
- Secimler sonucunda otomatik VB graph olusturulmasi
- Ileri/geri navigasyon
- Son adimda onizleme ve onay

---

### A2. Block Tanimlarina "Insan-Dostu" Etiketler

**Mevcut durum:** `player_join`, `on_command`, `send_message` gibi teknik isimler kullaniliyor.

**Cozum:** Tum Visual Builder block'larina `friendlyName` ve `description` alanlari eklenmeli:

| Teknik Isim | Insan-Dostu Isim (TR) | Insan-Dostu Isim (EN) |
|-------------|----------------------|----------------------|
| `player_join` | Oyuncu sunucuya girdiginde | When a player joins |
| `player_quit` | Oyuncu sunucudan ciktiginda | When a player leaves |
| `on_command` | Komut yazildiginda | When a command is used |
| `send_message` | Oyuncuya mesaj gonder | Send message to player |
| `give_item` | Oyuncuya esya ver | Give item to player |
| `teleport` | Oyuncuyu isinla | Teleport player |
| `play_sound` | Ses cal | Play sound |
| `spawn_particle` | Partikul efekti olustur | Spawn particles |
| `check_permission` | Izin kontrolu yap | Check permission |
| `set_health` | Can degerini ayarla | Set health |
| `kill_player` | Oyuncuyu oldur | Kill player |

Block palette'te arama: "mesaj" yazinca `send_message` bulunmali.

**Uygulama:**
- `BLOCK_DEFS` dizisine `friendlyName`, `friendlyDesc` alanlari eklenmeli
- Palette UI'da teknik isim yerine friendly isim gosterilmeli
- Arama hem teknik hem friendly isimde calismali

---

### A3. Gercek Zamanli Onizleme Paneli

**Cozum:** Visual Builder'da bir "Onizleme" paneli eklenmeli:

- Graph degistiginde anlik olarak "Bu plugin sunu yapacak:" aciklamasi gosterilsin
- Dogal dilde davranis ozeti (Turkce/Ingilizce)
- Ornek cikti:
  ```
  Bu plugin sunlari yapacak:

  1. Bir oyuncu sunucuya girdiginde:
     - Oyuncuya "Hos geldin!" mesaji gonderilecek
     - Oyuncuya 5 adet elmas verilecek

  2. /spawn komutu yazildiginda:
     - Oyuncu dunya spawn noktasina isinlanacak
     - "Spawn'a isinlandiniz!" mesaji gonderilecek
  ```

**Uygulama:**
- Sagda veya altta acilabilir bir panel
- `generatePreview()` fonksiyonu: graph'i parse edip dogal dilde ozet uretir
- Node ekleme/silme/baglama islemlerinde otomatik guncelleme
- AI destekli zenginlestirilmis aciklama (opsiyonel)

---

### A4. Drag & Drop "Davranis Kartlari"

**Mevcut durum:** Node'lar sag-tik menusunden ekleniyor.

**Cozum:** Sol panelde kategorize edilmis, renkli, ikonlu kartlar:

```
TETIKLEYICILER (Yesil)
  [Oyuncu giris] [Komut] [Blok kirma] [Olum]
  [Hasar alma] [Esya kullanma] [Chat mesaji]

AKSIYONLAR (Mavi)
  [Mesaj gonder] [Esya ver] [Isinla] [Patlama]
  [Ses cal] [Partikul] [Komut calistir] [Skor degistir]

KOSULLAR (Sari)
  [Izin kontrolu] [Dunya kontrolu] [Esya kontrolu]
  [Skor kontrolu] [Cooldown kontrolu] [Oyuncu modu]

DONGULER & ZAMANLAMA (Turuncu)
  [Zamanlayici] [Tekrar] [Gecikme] [Her X saniyede]
```

**Uygulama:**
- Kartlari canvas'a surukle-birak ile ekleme
- Her kartta ikon + kisa baslik + renk kodu
- Kategori bazli collapse/expand
- Arama/filtreleme

---

### A5. "Sablondan Basla" Galerisi Gelistirme

**Mevcut durum:** Template market var ama sinirli sayida sablon.

**Cozum:** Zenginlestirilmis sablon galerisi:
- En az 30-50 hazir sablon
- Kategoriler: Yonetim, Eglence, PvP, Ekonomi, Koruma, Sosyal, Mini-oyun
- Her sablonda onizleme ekran goruntusu
- "Bu sablonu ozellestir" butonu (wizard'a yonlendirme)
- Topluluk sablonlari (online marketplace)

Eklenmesi gereken yeni sablonlar:
- Oto-mesaj sistemi (belirli araliklarla duyuru)
- AFK dedektoru
- Ozel olum mesajlari
- Giris/cikis efektleri
- Kit sistemi
- Duello sistemi
- Oylama odulleri
- Ozel boss mob
- Ozel crafting tarifi
- Bolgeli koruma

---

## B - AI ve Otomasyon

### B1. "Dogal Dil -> Tam Plugin" Tek Adim Akisi

**Mevcut durum:** AI chat + text-to-node ayri araclar olarak var.

**Cozum:** Ana ekranda buyuk bir input alani:

```
+----------------------------------------------------------+
| "Ne tur bir plugin istersin? Turkce yaz, biz yapalim!"   |
|                                                          |
| [ Oyuncular /spawn yazinca dunya spawn noktasina        |
|   isinlansin, 5 saniyelik bekleme suresi olsun,         |
|   bekleme sirasinda hareket ederlerse iptal olsun ]      |
|                                                          |
|                          [Plugin Olustur]                 |
+----------------------------------------------------------+
```

Arka planda calisan akis:
1. **Architect Agent** -> Tasarim karti olusturur
2. Kullaniciya gorsel ozet gosterir: "Bu plugini yapacagiz: ..."
3. Onay alinir
4. **Coder Agent** -> Kod uretir
5. **Validator Agent** -> Dogrular
6. Otomatik proje scaffolding + dosyalar yazilir
7. Test sunucusuna deploy + test

**Ek ozellikler:**
- "Ornek istekler" butonlari (hizli baslangic)
- Gecmis istekler listesi
- Istek duzenleme/iyilestirme onerileri

---

### B2. AI "Asistan Modu" - Akilli Oneriler

**Cozum:** Kullanici Visual Builder'da calisirken AI proaktif oneriler sunsun:

- "Bu event'e bir izin kontrolu eklemek ister misin?"
- "Cooldown eklemek dengeli bir oyun icin iyi olur"
- "Bu komut icin tab-complete ekleyebilirim"
- "Config.yml'den deger okumak ister misin? Boylece sunucu sahibi ayarlari degistirebilir"

**Uygulama:**
- Graph degisikliklerini izleyen bir AI watcher
- Belirli pattern'lerde tetiklenen oneriler
- Bildirimleri kapatabilme secenegi
- Rule-based (AI olmadan) + AI-enhanced (AI varken) iki katmanli sistem

---

### B3. "Hata Duzeltme Sihirbazi" Gelistirme

**Mevcut durum:** Server log'dan stack trace analizi var.

**Cozum:** Daha guclu hata yonetimi:
- Server konsolunda kirmizi hata -> otomatik popup: "Bir hata tespit ettim!"
- AI hata analizi + "Tek Tikla Duzelt" butonu
- Duzeltme oncesi/sonrasi diff gosterimi
- "Bu hatayi gelecekte onlemek icin sunu da ekleyelim" onerisi
- Yaygin hata veritabani (NullPointerException, ClassNotFoundException vb.)
- Hata gecmisi ve tekrar eden hatalarin tespiti

---

### B4. AI ile Icerik Olusturma

**Cozum:** Tamamlanan plugin icin otomatik:

1. **Plugin Aciklamasi:** Spigot/Modrinth sayfa aciklamasi
2. **Komut Kilavuzu:** Tum komutlar, izinler ve kullanim ornekleri
3. **Config Dokumani:** Config.yml icin detayli aciklama
4. **README.md:** Proje README dosyasi
5. **Degisiklik Gunlugu:** Surum bazli changelog

Tek tikla tum dokumanlar olusturulabilmeli.

---

### B5. "Kod Aciklama" Modu

**Cozum:** Uretilen kodu satir satir aciklayan mod:

```java
// Oyuncu sunucuya girdiginde bu olay tetiklenir
@EventHandler
public void onPlayerJoin(PlayerJoinEvent event) {
    // Giren oyuncuyu aliyoruz
    Player player = event.getPlayer();
    // Oyuncuya hos geldin mesaji gonderiyoruz
    player.sendMessage("Hos geldin!");
}
```

- Turkce/Ingilizce aciklama secenegi
- "Ne ogrendim?" ozet paneli
- Baslangic seviyesi / ileri seviye aciklama modu

---

## C - Yeni Arac ve Modul Onerileri

### C1. Mob Olusturucu (Custom Mob Designer)

Gorsel arayuzle ozel mob olusturma:

- **Mob tipi secimi:** Zombie, Skeleton, Spider, Creeper vb. (taban mob)
- **Ozellestirme:**
  - Isim (renkli metin destegi)
  - Saglik, hiz, hasar, zirh degerleri (slider)
  - Ozel efektler (ates direnci, gorunmezlik, parlama vb.)
- **Loot table tasarimcisi:** Mob oldugunde ne dusursun? (gorsel tablo)
- **Spawn kosullari:** Biyom, gece/gunduz, ay evresi, olasilik
- **AI davranis secimi:** Agresif, pasif, notr, boss
- **Boss ozellikleri:** Saglik cubugu, ozel saldirilar, evre sistemi
- **Kod uretimi:** Direkt `CustomMob` sinifi olusturma

---

### C2. Dunya Olusturucu (World Generator Designer)

- **Biyom haritasi editoru:** 2D grid uzerinde biyom yerlestirme
- **Yapi yerlestirme:** Structure placement kurallari
- **Maden uretimi:** Ore generation kurallari (derinlik, siklik, boyut)
- **Arazi sekli:** Terrain shape parametreleri (slider'larla)
- **Onizleme:** Basit 2D/3D terrain onizleme
- **Disa aktarma:** WorldGenerator sinifi kodu

---

### C3. Esya Olusturucu (Custom Item Designer)

**Mevcut image editor ile entegre calisabilir.**

- **Material secimi:** Gorsel material palette
- **Enchantment ekleme:** Gorsel kartlarla buyuleme
- **Lore/Display name editoru:** Renk kodlariyla
- **Custom model data:** Resource pack entegrasyonu
- **Esya yetenekleri:**
  - "Sag tikla -> ates topu firlat"
  - "Sol tikla -> simsek dusur"
  - "Shift + sag tikla -> iyilestir"
- **Texture paint:** Image editor'dan direkt yukleme
- **Esya kategorileri:** Silah, zirh, arac, tuketilebilir, ozel
- **Nadir esya efektleri:** Parlama, partikul, ses

---

### C4. Scoreboard / HUD Tasarimcisi

- **Sidebar scoreboard:** Gorsel editor
  - Baslik ayarlama (animasyonlu baslik destegi)
  - Satir ekleme/cikarma
  - Degisken yerlestirme (oyuncu adi, skor, para vb.)
  - Renk ve format ayarlari
- **Bossbar tasarimcisi:**
  - Renk secimi (6 renk)
  - Stil secimi (segmented, solid)
  - Animasyon (ilerleme cubugu)
- **Action bar mesaj editoru:** Anlik mesaj gosterimi
- **Tab list ozellestirme:**
  - Ust/alt metin
  - Oyuncu listesi formati
- **Gercek zamanli onizleme:** Minecraft benzeri mockup gorunumu

---

### C5. NPC Diyalog Sistemi

- **NPC olusturma:** Gorsel karakter tasarimcisi
- **Diyalog agaci tasarimcisi:** Node-based editor
  - NPC konusmasi -> oyuncu secenekleri -> NPC cevabi
  - Dallanma mantigi
  - Kosullu diyaloglar (gorev durumuna gore)
- **Secenekli cevaplar:** Oyuncuya sunulan secimler
- **Gorev (Quest) entegrasyonu:**
  - Gorev verme
  - Gorev ilerleme kontrolu
  - Odul verme
- **Uyumluluk:** Citizens / ZNPCsPlus uyumlu kod uretimi

---

### C6. Partikul Efekt Tasarimcisi

**Mevcut GeometryEngine (3D shape preview) genisletilebilir.**

- **Partikul tipi secimi:** Flame, heart, smoke, redstone, vb.
- **Sekil sablonlari:**
  - Spiral, kure, kubbe, halka, cizgi, yildiz
  - Ozel sekil cizimi
- **Timeline animasyon:**
  - Keyframe bazli animasyon
  - Hiz, boyut, renk degisimi zamana gore
- **Parametreler:**
  - Partikul sayisi, hiz, yayilma alani
  - Renk (redstone partikul icin)
  - Boyut ve sure
- **Gercek zamanli 3D onizleme:** Three.js ile canli gosterim
- **Tetikleyici baglama:** Event'e veya komuta baglama

---

### C7. Config.yml Gorsel Editoru Gelistirme

**Mevcut durum:** Basit YAML form editoru var.

**Cozum:** Daha guclu:
- **Tip bazli widget'lar:**
  - Renk secici (Minecraft renk kodlari)
  - Konum secici (x, y, z input'lari)
  - Material secici (gorsel palette)
  - Boolean toggle switch
  - Sayi slider
- **Nested object destegi:** Katlanabilir bolumler
- **Config degerlerine aciklama ekleme:** Tooltip ile
- **Varsayilan deger gosterimi:** Reset butonu
- **"Bu deger sunu etkiler" tooltip'leri:** Baglamsal yardim
- **Config sablonlari:** Ornek yapilandirmalar

---

### C8. Minecraft Surum Uyumluluk Kontrolu

**Mevcut:** Temel deprecation diagnostics var.

**Genisletme:**
- Secilen MC surumune gore kullanilabilir API'leri filtreleme
- Deprecated API kullanimi uyarisi (detayli aciklama ile)
- "Bu ozellik 1.20+ gerektirir" bildirimi
- Multi-version destek kodu otomatik uretimi
- Surum bazli API farklari tablosu
- Otomatik migration onerisi (eski surum -> yeni surum)

---

### C9. Plugin Paketleyici ve Yayinlayici

**Mevcut:** One-click release (JAR olusturma) var.

**Genisletme:**
- **Platform yukleme:** Spigot/Modrinth/CurseForge'a direkt yukleme
- **Surum yonetimi:** Semantic versioning UI
- **Changelog olusturma:** AI ile otomatik degisiklik gunlugu
- **Resource pack paketleme:** Texture + config birlikte
- **Update checker:** Otomatik guncelleme kontrol kodu ekleme
- **Lisans secici:** MIT, GPL, All Rights Reserved vb.
- **Bagimliliklari ekleme:** Depend/softdepend gorsel editoru

---

### C10. Olay Zinciri Simulatoru

Plugin davranisini test etmeden simule etme:

- **Adim adim calisma:**
  ```
  1. [Oyuncu giris yapti] -> Tetiklendi
  2. [Mesaj gonderildi] -> "Hos geldin!"
  3. [Esya verildi] -> 5x Elmas
  4. [Skor guncellendi] -> giris_sayisi +1
  ```
- **Hata noktalarini onceden tespit:** Potansiyel NullPointer, eksik izin vb.
- **Performans tahmini:** Bu plugin sunucuyu yavaslatir mi?
- **Senaryo bazli test:** "50 oyuncu ayni anda girerse ne olur?"
- **Gorsel akis diyagrami:** Node'lar arasi veri akisi gosterimi

---

### C11. Ses ve Muzik Yoneticisi

- **Ses efekti kutuphanesi:** Minecraft dahili sesleri gorsel listesi
- **Ozel ses yukleme:** .ogg dosyasi ekleme
- **Ses zamanlama:** Belirli event'lerde hangi ses calacak
- **Muzik kutusu:** Note block melodileri gorsel editoru
- **Resource pack ses entegrasyonu**

---

### C12. Harita/Bolgeler Editoru

- **2D harita gorunumu:** Dunya haritasi uzerinde bolge cizimleri
- **Bolge turleri:** PvP arena, safe zone, spawn, ozel alan
- **Bolge ozellikleri:** Izinler, etkilesimler, giris/cikis mesajlari
- **WorldGuard uyumlu cikti:** Region tanimlari
- **Gorsel sinir cizimleri:** Dikdortgen, cokgen, daire

---

## D - Teknik Altyapi Iyilestirmeleri

### D1. Test Altyapisi

**Durum:** Hicbir test dosyasi yok. Bu kritik bir eksiklik.

**Cozum:**
- **Unit test:** Jest veya Vitest ile
  - Her code generation fonksiyonu icin test
  - Template uretim testleri
  - AI prompt/response parse testleri
- **E2E test:** Playwright veya Spectron ile
  - Wizard akis testleri
  - Visual Builder islemleri
  - Proje olusturma/build/deploy akisi
- **CI/CD pipeline:** GitHub Actions
  - Her push'ta testler calissin
  - Build basarisini dogrulasin
  - Lint kontrolu

---

### D2. Renderer Modernizasyonu

**Mevcut durum:** Tum renderer vanilla JS, buyuk monolitik dosyalar.

**Cozum (Asama asama):**

**Faz 1 - Modul sistemi:**
- ES Module yapisina gecis
- Buyuk dosyalari parcalama (app.js -> birden fazla modul)
- Import/export ile bagimlilik yonetimi

**Faz 2 - State management:**
- Basit store pattern veya Zustand
- Merkezi state (acik dosyalar, aktif panel, ayarlar vb.)
- Event-driven guncellemeler

**Faz 3 - Component framework (opsiyonel):**
- Svelte veya Preact (hafif ve hizli)
- Component bazli UI parcalama
- Virtual DOM ile performans artisi (ozellikle buyuk node graph'larda)

---

### D3. Extension Runtime Gerceklestirme

**Mevcut durum:** Extension'lar tanimlanmis ama gercek bir extension host mekanizmasi eksik.

**Cozum:**
- Extension lifecycle yonetimi (activate/deactivate)
- Extension API tanimlama (ne yapabilir, ne yapamaz)
- Extension arasi iletisim (message passing)
- 3. parti extension destegi (topluluk eklentileri)
- Extension marketplace (online indirme/yukleme)

---

### D4. Offline-First AI

**Mevcut durum:** Ollama destekleniyor.

**Genisletme:**
- **Kurulum sihirbazi:** Ilk acilista otomatik Ollama + model indirme
- **Onerilen model boyutlari:**
  - 4GB RAM -> 7B model (ornegin: Mistral 7B)
  - 8GB RAM -> 13B model
  - 16GB+ RAM -> 34B model
- **Fallback sistemi:** AI olmadan da tum no-code ozellikler calismali
- **Rule-based NL->Graph:** AI yokken basit kural tabanli donusum
- **Model performans karsilastirmasi:** Hangi model ne kadar iyi?
- **Hibrit mod:** Basit istekler offline, karmasik istekler online

---

### D5. Undo/Redo Sistemi

**Cozum:**
- Visual Builder icin global undo/redo stack
- Tum araclar (GUI Builder, Recipe Creator, Command Tree, Permission Tree) icin tutarli undo
- Ctrl+Z / Ctrl+Y her yerde calismali
- Islem gecmisi paneli (neyin ne zaman degistigini gorme)
- Snapshot bazli veya diff bazli kayit

---

### D6. Proje Dosya Izleme (File Watcher)

**Cozum:**
- Harici degisiklikleri algilama (baska editorde acip degistirme)
- Otomatik reload / conflict cozumu
- Hot-reload: Dosya degisince test sunucusuna otomatik deploy
- Git entegrasyonu: Degisiklikleri gorsel diff ile gosterme

---

### D7. Otomatik Guncelleme

**Cozum:**
- electron-updater ile uygulama ici guncelleme
- Release notlari gosterimi
- Beta / Stable kanal secimi
- Guncelleme bildirimi ve isteye bagli kurulum

---

### D8. Performans Iyilestirmeleri

**Cozum:**
- Visual Builder canvas'ta virtual rendering (sadece gorunen node'lari ciz)
- Buyuk projelerde lazy file loading
- Monaco editor icin worker thread'ler
- Memory leak tespiti ve onleme
- Uygulama baslama suresi optimizasyonu

---

### D9. Erisilebilik ve Tema

**Cozum:**
- Acik tema (light mode) destegi
- Yuksek kontrast modu
- Font boyutu ayari (IDE geneli)
- Klavye kisayollari ozellestirmesi
- Screen reader uyumlulugu (temel seviye)

---

## Oncelik Siralamasi

| Oncelik | Ozellik | Etki | Zorluk | Kategori |
|---------|---------|------|--------|----------|
| 1 | A1 - Wizard tabanli plugin olusturma | Cok Yuksek | Orta | No-Code UX |
| 2 | B1 - Dogal dil -> tam plugin tek adim | Cok Yuksek | Orta | AI |
| 3 | A2 - Insan-dostu block etiketleri | Yuksek | Dusuk | No-Code UX |
| 4 | A4 - Drag & drop davranis kartlari | Yuksek | Orta | No-Code UX |
| 5 | C3 - Custom Item Designer | Yuksek | Orta | Yeni Arac |
| 6 | A3 - Gercek zamanli onizleme | Yuksek | Orta | No-Code UX |
| 7 | C1 - Mob Olusturucu | Yuksek | Orta | Yeni Arac |
| 8 | D5 - Undo/Redo sistemi | Orta | Dusuk | Altyapi |
| 9 | B2 - AI akilli oneriler | Orta | Orta | AI |
| 10 | C4 - Scoreboard/HUD tasarimcisi | Orta | Orta | Yeni Arac |
| 11 | D1 - Test altyapisi | Yuksek | Orta | Altyapi |
| 12 | A5 - Sablon galerisi genisletme | Orta | Dusuk | No-Code UX |
| 13 | B3 - Hata duzeltme gelistirme | Orta | Dusuk | AI |
| 14 | D4 - Offline-first AI wizard | Orta | Dusuk | Altyapi |
| 15 | C5 - NPC Diyalog sistemi | Orta | Yuksek | Yeni Arac |
| 16 | B4 - AI ile icerik olusturma | Orta | Dusuk | AI |
| 17 | C7 - Config editoru gelistirme | Orta | Dusuk | Yeni Arac |
| 18 | C10 - Olay zinciri simulatoru | Orta | Yuksek | Yeni Arac |
| 19 | C6 - Partikul efekt tasarimcisi | Dusuk | Orta | Yeni Arac |
| 20 | D2 - Renderer modernizasyonu | Yuksek | Cok Yuksek | Altyapi |
| 21 | C8 - Surum uyumluluk kontrolu | Dusuk | Orta | Yeni Arac |
| 22 | C9 - Plugin paketleyici gelistirme | Dusuk | Orta | Yeni Arac |
| 23 | D3 - Extension runtime | Dusuk | Yuksek | Altyapi |
| 24 | C2 - Dunya olusturucu | Dusuk | Cok Yuksek | Yeni Arac |
| 25 | C12 - Harita/Bolgeler editoru | Dusuk | Yuksek | Yeni Arac |

---

## Yol Haritasi

### Faz 1 - Temel No-Code Deneyimi (v0.2.0)
**Tahmini sure:** 4-6 hafta

- [x] A2 - Insan-dostu block etiketleri (tum bloklara friendlyName ekleme)
- [x] A4 - Drag & drop davranis kartlari (sol panel palette)
- [x] A1 - Wizard tabanli plugin olusturma (3-4 adimli akis)
- [x] D5 - Undo/Redo sistemi
- [x] A3 - Gercek zamanli onizleme paneli

### Faz 2 - AI Guclendirme (v0.3.0)
**Tahmini sure:** 3-4 hafta

- [x] B1 - Dogal dil -> tam plugin akisi
- [x] B2 - AI akilli oneriler
- [x] B3 - Hata duzeltme sihirbazi gelistirme
- [x] D4 - Offline-first AI wizard
- [x] B5 - Kod aciklama modu

### Faz 3 - Yeni Araclar (v0.4.0)
**Tahmini sure:** 6-8 hafta

- [x] C3 - Custom Item Designer
- [x] C1 - Mob Olusturucu
- [x] C4 - Scoreboard/HUD tasarimcisi
- [x] C7 - Config editoru gelistirme
- [x] A5 - Sablon galerisi genisletme (30+ sablon)

### Faz 4 - Ileri Ozellikler (v0.5.0)
**Tahmini sure:** 6-8 hafta

- [x] C5 - NPC Diyalog sistemi
- [x] C6 - Partikul efekt tasarimcisi
- [x] C10 - Olay zinciri simulatoru
- [x] B4 - AI ile icerik olusturma
- [x] C9 - Plugin paketleyici gelistirme

### Faz 5 - Teknik Yatirim (v0.6.0)
**Tahmini sure:** 8-12 hafta

- [x] D1 - Test altyapisi
- [x] D2 - Renderer modernizasyonu (faz faz)
- [x] D3 - Extension runtime
- [x] D7 - Otomatik guncelleme
- [x] D8 - Performans iyilestirmeleri

---

## Son Notlar

Bu plan, CraftIDE'yi "kodlama bilmeden Minecraft plugin/mod/skript yapabilme" hedefine en etkili sekilde ulastirmak icin tasarlanmistir. Oncelik siralamasinda **kullanici deneyimi** (No-Code UX) en onde tutulmustur cunku bu, projenin temel degeri ve farklilasmasi.

Her faz sonunda kullanici geri bildirimi alinmali ve plan buna gore guncellenmelidir.

---

*Bu belge CraftIDE gelistirme surecinde canli bir dokuman olarak guncellenmelidir.*

# CraftIDE

Electron + Monaco tabanli, yapay zeka destekli Minecraft gelistirme studosu.

CraftIDE; Paper/Spigot, Fabric, Forge ve Skript odakli projeler icin kod editoru, gorsel/no-code uretim, test sunucusu ve paketleme adimlarini tek masaustu uygulamasinda birlestirir.

## Son Koklu Revizyonlar

- Visual Builder ust bolgesi artik dikey olarak resize edilebilir (`84px` - `360px`) ve yukseklik `craftide.vb.topRegionHeight` ile kalicidir.
- Visual Builder toolbar tek satir + `More` menusu modeline gecirildi; kalabalik azaltildi.
- Canvas bos alanda `Sol Tik + Surukle` pan eklendi (`Orta Tik` ve `Alt+Sol` uyumlulugu korunur).
- `Browse Templates` butonu ve template modal akisi duzeltildi.
- Plugin/Fabric/Forge/Skript icin toplam 12 yeni Visual Builder sablonu eklendi.
- Visual Builder icin EN/TR dinamik i18n kapsami genisletildi (toolbar, no-code metinleri, node param etiketleri).
- Merkezi kisayol sistemi eklendi:
  - global + context komut kaydi,
  - cakisma uyari sistemi,
  - komut bazli reset + tumunu sifirla,
  - ayarlar ekrani entegrasyonu.
- Explorer `New File / New Folder` akisi in-app quick-create olarak yeniden yazildi (`prompt()` bagimliligi kalkti).
- Image Editor parse/runtime kirigi giderildi; `init -> open -> draw -> save` zinciri stabilize edildi.
- Test Server surum listesi server type bazli dinamik hale getirildi (`server:list-versions`, cache + fallback).
- Sidebar ucgen ikonu artik ayri `Minecraft Tools Hub` sayfasi aciyor (`mc-tools://`).

## One Cikan Yetkinlikler

- Node tabanli Visual Builder ile plugin/mod/script akisi.
- No-code katmani (validation, behavior packs vb.).
- Entegre test sunucusu yonetimi.
- Image Editor ve ek Minecraft arac sayfalari.
- Dinamik EN/TR dil sistemi.

## Kurulum ve Calistirma

```bash
git clone https://github.com/ali975/CraftIDE-MyFirstProject.git
cd CraftIDE-MyFirstProject/craftide
npm install
npm run dev
```

Dagitim paketi icin:

```bash
npm run dist
```

Ana ciktilar:

- `release/CraftIDE Setup 0.2.0.exe`
- `release/CraftIDE 0.2.0.exe`

## Dagitim Kurali

Proje kuralina gore her ana guncelleme paketinden sonra release artefact uretimi icin `npm run dist` calistirilir.

## Dizin Ozetleri

- `src/main` Electron main process + IPC
- `src/renderer` arayuz, Visual Builder, editor entegrasyonlari
- `release` olusan kurulum dosyalari
- `tests` birim testleri

## Lisans

MIT

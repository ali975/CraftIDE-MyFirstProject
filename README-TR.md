# CraftIDE

CraftIDE, Minecraft üreticileri için hazırlanmış masaüstü bir geliştirme ortamıdır. Kod editörü, görsel araçlar, test sunucusu ve paketleme adımlarını tek uygulamada toplar.

Uygulama; Paper/Spigot eklentileri, Fabric modları, Forge modları ve Skript projeleri için Electron + Monaco tabanlı birleşik bir çalışma akışı sunar.

## CraftIDE Neler Sunar

- Java, YAML, Skript ve proje dosyaları için Monaco tabanlı editör
- Akış tabanlı Visual Builder
- GUI, komut, yetki, tarif ve medya araçları
- Derle, dağıt, çalıştır ve hata ayıkla döngüsü için yerel test sunucusu yöneticisi
- Görsel düzenleme aracı ve Minecraft odaklı yardımcı sayfalar
- İngilizce/Türkçe arayüz desteği
- Resmî GitHub Release kanalı üzerinden uygulama içi güncelleme desteği

## Güncelleme Modeli

CraftIDE artık paketlenmiş Windows kurulum sürümleri için GitHub tabanlı uygulama içi güncelleme desteğine sahiptir.

- Güncellemeler yalnızca resmî kanal olan `ali975/CraftIDE-MyFirstProject` üzerinden alınır
- Kullanıcıların her yeni sürümde GitHub Releases sayfasına gidip tekrar indirme yapması gerekmez
- Güncelleme sırasında kullanıcı verileri korunur
- Portable sürüm üretilebilir, ancak uygulama içi otomatik güncelleme kurulum sürümü için tasarlanmıştır

Kullanıcı verileri uygulama dosyalarından ayrı tutulur. Bu yüzden uygulamayı güncellemek proje durumu, ayarlar veya `.craftide` verilerini silmez.

## Bu Sürümde Öne Çıkanlar

- Visual Builder şablon modal akışı yeniden düzeltildi
- Paketlenmiş uygulama ikonu ve başlık çubuğu ikonu `logo.png` ile senkronize edildi
- GitHub Releases tabanlı uygulama içi güncelleyici altyapısı eklendi
- Resmî sürüm doğrulama ve kanal kilidi korunmaya devam etti

## Geliştirme

```bash
git clone https://github.com/ali975/CraftIDE-MyFirstProject.git
cd CraftIDE-MyFirstProject/craftide
npm install
npm run dev
```

## Derleme

```bash
npm run dist
```

Ana Windows çıktıları:

- `release/CraftIDE-Setup-0.2.6.exe`
- `release/CraftIDE-0.2.6.exe`

GitHub'a doğrudan yayınlamak için:

```bash
npm run dist:publish
```

Bunun için GitHub kimlik doğrulaması veya geçerli bir `GH_TOKEN` gerekir.

## Proje Yapısı

- `src/main` Electron ana süreç, IPC ve güncelleyici entegrasyonu
- `src/renderer` arayüz, editörler, Visual Builder ve araç sayfaları
- `assets/icons` paketlenen Windows ikon dosyaları
- `release` üretilen kurulum dosyaları ve release metadatası
- `tests` otomatik testler

## Resmî Dağıtım

- Resmî sürümler yalnızca `ali975/CraftIDE-MyFirstProject` deposundan yayımlanır
- Fork sürümler izin olmadan resmî CraftIDE sürümü gibi sunulmamalıdır
- Marka ve isim kullanımı kuralları [TRADEMARK.md](./TRADEMARK.md) içinde yer alır

## Lisans

CraftIDE `GNU AGPL-3.0-only` ile lisanslanmıştır.

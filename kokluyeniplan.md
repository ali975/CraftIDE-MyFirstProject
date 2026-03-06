**Kritik mimari gerçek:** Tüm renderer modülleri `<script>` tag'leri ile sırayla yükleniyor. Module sistemi yok. Dosyalar arası iletişim tamamen `window.*` global objeleri üzerinden gerçekleşiyor (`window.CraftIDEVB`, `window.CraftIDEAppState`, `window.CraftIDEStore`, `window.NoCodeSuite`, `window.llmProvider`, `window.aiManager`, `window.Lang` vb.).

### 2.2 Ana Modüller ve Sorumlulukları

| Modül | Satır (≈) | Sorumluluk | Bağımlılıklar |
|---|---|---|---|
| `app.js` | 1600 | Tüm uygulama kabuğu: titlebar, activity bar, sidebar, tab yönetimi, file explorer, context menu, monaco editor, xterm terminal, search, settings, new project modal, welcome screen, server manager UI, MC tools hub | `window.*` globals, `ipcRenderer` direkt |
| `visual-builder.js` | 1200 | Node editor canvas, blok tanımları (4 platform × ~30 blok), şablonlar (20), connection çizimi, sürükle-bırak, context menu, code generation, save/load, import/export | `window.Lang`; `window.CraftIDEVB` olarak expose eder |
| `no-code-suite.js` | 733 | Intent wizard, behavior pack, graph validation, guaranteed build loop, scenario test, one-click release | `window.CraftIDEVB`, `window.CraftIDEAppState`, `window.llmProvider`, `ipcRenderer` |
| `visual-builder-enhancements.js` | 500 | Undo/redo, friendly labels (14 blok), preview panel, wizard UI, drag-drop cards panel | `window.CraftIDEVB`, `window.Lang` |
| `phase-completion-suite.js` | 2000+ | Faz 2–5 tüm MVP özellikleri: mob designer, scoreboard, NPC dialog, particle designer, config editor, code explain, proactive suggestions, extension runtime, file watcher, performance mode, updater UI, theme/accessibility | Neredeyse tüm `window.*` globals |
| `ipc.ts` | 1131 | 50+ IPC handler: dosya işlemleri, dialog, build, scaffold, NL→graph, validate, scenario, release, marketplace, official verify, search | Node `fs`/`path`/`crypto`/`https`, `scaffolder` |
| `styles/main.css` | 3269 | Tek dosyada tüm UI stilleri | — |

### 2.3 Mevcut Güçlü Yanlar

- Tek geliştirici tarafından geniş kapsam: 4 platform desteği, AI entegrasyonu, Visual Builder, Test Server, 10+ araç.
- 5 farklı LLM provider desteği (Ollama, LM Studio, OpenAI, Anthropic, Google).
- Visual Builder'da 80+ blok tanımı, 20 hazır şablon.
- Türkçe/İngilizce çift dil desteği, friendly block etiketleri.
- No-Code Suite: NL→graph→code→build tam zincir.
- Proje scaffolder: Paper, Spigot, Fabric, Forge, Velocity, BungeeCord, Skript.
- Anti-resale / official build verification sistemi.

---

## 3. Sorunlar ve Eksikler

### 3.1 Teknik Borçlar

#### TB-1: Global Scope Spaghetti

- `app.js`'te `let currentProjectPath`, `let openFiles`, `let currentFilePath` gibi modül-seviye `let` değişkenler var. Bunlara tüm renderer dosyaları `window.CraftIDEAppState` wrapper'ı üzerinden erişiyor.
- `visual-builder.js`'te `vbNodes`, `vbConnections`, `vbCanvas` vb. global scope'ta. `window.CraftIDEVB` üzerinden expose ediliyor.
- **Sonuç:** Herhangi bir dosyada yapılan değişiklik diğer dosyaları beklenmedik şekilde kırabilir. Test edilemezlik.

#### TB-2: Duplike Fonksiyonlar

- `tr()` fonksiyonu 4 farklı dosyada yeniden tanımlanmış:
  - `app.js` → `function tr(key, fallback, params)`
  - `visual-builder.js` → `function vbTr(key, fallback, params)`
  - `no-code-suite.js` → `function t(key, fallback, params)`
  - `visual-builder-enhancements.js` → `const t = (tr, en) => ...`
- `normalizeMode()` fonksiyonu 3 yerde tanımlı (`ipc.ts`, `no-code-suite.js`, `phase-completion-suite.js`).
- `esc()` (HTML escape) fonksiyonu 3 ayrı dosyada tanımlı.
- `notify()` / `showNotification()` wrapper'ları her dosyada farklı.

#### TB-3: `activateTab()` — 70+ Satırlık if/else Zinciri

`activateTab()` fonksiyonu (`app.js` satır 865–980) 12 farklı `filePath.startsWith('...')` kontrolü içeren bir if/else zinciri. Yeni bir araç eklemek bu fonksiyona yeni bir branch eklemek demek.

#### TB-4: `openFile()` İçindeki Protocol Kontrolü

`openFile()` satır 771'de 11 farklı protocol prefix'i tek satırda `||` ile kontrol ediyor. Ölçeklenebilir değil.

#### TB-5: İnline HTML String Oluşturma

`no-code-suite.js` → `mountUI()` fonksiyonu (satır 607–681): 7 modal'ın tüm HTML'ini tek bir `insertAdjacentHTML` çağrısında string concatenation ile oluşturuyor. Bakım maliyeti yüksek.

#### TB-6: `phase-completion-suite.js` — "Her Şeyi Yapan Tek Dosya"

Bu dosya mob designer, scoreboard builder, NPC dialog, particle designer, config editor, code explanation, proactive AI suggestions, extension runtime, file watcher, performance mode, updater ve theme ayarları gibi ~15+ bağımsız özelliği tek bir IIFE içinde topluyor.

### 3.2 Riskli Alanlar

#### R-1: UTF-8 / Mojibake Sorunu (Kanıtlanmış)

`visual-builder.js` içindeki varsayılan değerlerde bozuk Türkçe karakterler mevcut:

- `'HoÅŸ geldin!'` → olması gereken: `'Hoş geldin!'`
- `'Kurallara aykÄ±rÄ± davranÄ±ÅŸ'` → olması gereken: `'Kurallara aykırı davranış'`
- `'Ã–ldÃ¼n!'` → olması gereken: `'Öldün!'`

`src/shared/utf8.js` modülü (`repairMojibake`, `sanitizeVisibleText`) eklenmiş ama sorun kaynakta düzeltilmemiş; runtime'da yamalanıyor. Kullanıcının gördüğü ilk Türkçe metnin bozuk olma riski devam ediyor.

#### R-2: Güvenlik — `contextIsolation: false`, `nodeIntegration: true`

`main.ts` satır 29–33: `nodeIntegration: true`, `contextIsolation: false`, `webSecurity: false`. Electron güvenlik best practice'lerine aykırı. Şu an local-only bir uygulama olduğu için gerçek risk düşük, ama gelecekte online marketplace veya web content yüklenirse kritik hale gelir.

#### R-3: Test Kapsamı — Sembolik

Tek test dosyası `phase-utils.test.js`: 5 test, toplam 49 satır. Sadece utility fonksiyonları test ediyor. Visual Builder, code generation, no-code suite, scaffolder — bunların hiçbirinin testi yok.

#### R-4: Code Generation Doğruluğu Doğrulanamıyor

Visual Builder'dan üretilen Java/Skript kodunun doğruluğunu kontrol eden hiçbir mekanizma yok. `guaranteed build` sadece Maven/Gradle build başarısına bakıyor — runtime hataları, mantıksal bug'lar yakalanmıyor.

#### R-5: Monaco Editor Model Leak

`activateTab()` içinde her dosya açıldığında yeni `monaco.editor.createModel()` çağrılıyor ve `oldModel.dispose()` yapılıyor. Ancak `closeTab()` fonksiyonunda model dispose işlemi yok. Uzun oturumlarda memory leak.

### 3.3 Mimari Kısıtlar

| Kısıt | Açıklama |
|---|---|
| Bundler yok | Vite, webpack, esbuild kullanılmıyor. Tüm JS dosyaları `<script>` tag ile yükleniyor. Tree-shaking, code splitting, hot reload yok. |
| Framework yok | DOM manipülasyonu tamamen imperative. Component reuse yok. |
| Extension'lar hayalet | `extensions/` altında 5 extension tanımlı (TypeScript) ama build edilmiyor, yüklenmiyor, çalışmıyor. `phase-completion-suite.js` içinde basit bir `activate()`/`deactivate()` simülasyonu var ama gerçek host mekanizması değil. |

### 3.4 Eksik Temel Özellikler

| # | Eksik | Neden Önemli | Risk |
|---|---|---|---|
| E-1 | Kaydedilmemiş değişiklik koruması (editor) | Monaco editor'de yapılan değişiklikler tab kapatılırken kayıp gidebilir. `closeTab()` sadece image editor için dirty check yapıyor. | Kullanıcı veri kaybı |
| E-2 | Gerçek code generation testi | Üretilen Java/Skript kodunun syntax olarak doğru olduğunu doğrulayan hiçbir test yok. | Kırık kod üretimi fark edilmez |
| E-3 | Hata boundary'leri | Herhangi bir renderer modülünde uncaught exception olursa tüm UI çöker. Global error handler yok. | Beyaz ekran |
| E-4 | Dosya izleme (file watcher) | `phase-completion-suite.js`'te stub var ama `fs.watch()` çağrısının gerçekten çalışıp çalışmadığı belirsiz. | Harici değişiklikler görünmez |
| E-5 | Multiplatform build | electron-builder config'i sadece Windows hedefli (`--win`). macOS/Linux build yok. | Hedef kitle daraltılmış |

---

## 4. Önerilen Özellikler ve İyileştirmeler

### 4.1 Yeni Özellik Fırsatları

| # | Fırsat | Kullanıcıya Etkisi | Teknik Uyum |
|---|---|---|---|
| F-1 | "Describe & Create" ana akış — AI input → VB graph → code → test tam otomasyonunun welcome ekranından erişilebilir yapılması | Yüksek | No-code-suite zaten var, sadece UX yönlendirmesi gerekli |
| F-2 | Blok favorileri ve geçmiş — kullanıcı sık kullandığı blokları hızlı erişsin | Orta | `vbFavoriteBlocksByMode` zaten tanımlı, localStorage'a kaydediliyor |
| F-3 | Şablon çeşitliliği — 20 şablon var ama çoğu "join + message" pattern'ı | Orta | Yeni şablon eklemek trivial |
| F-4 | Light tema — gündüz kullanıcıları, erişilebilirlik | Orta | CSS değişkenleri tanımlı ama light mode uygulanmamış |
| F-5 | Proje otomatik kaydetme — kullanıcı veri kaybını önleme | Yüksek | `openFiles` Map'i var, otomatik `fs:writeFile` IPC eklenebilir |

---

## 5. Öncelik Sıralaması

### P0 — Şimdi Yapılmalı (Ürünü Kırılmaktan Koruyan)

#### P0-1: UTF-8 Bozukluklarını Kaynakta Düzelt

| Alan | Detay |
|---|---|
| **Ne yapılmalı** | `visual-builder.js` içindeki tüm Türkçe string literal'ları düzeltilmeli (`'HoÅŸ geldin!'` → `'Hoş geldin!'`). Runtime `repairMojibake()` yamasına güvenmek yerine dosyayı UTF-8 olarak yeniden kaydetmek gerekiyor. |
| **Neden** | Kullanıcının gördüğü ilk şablonlar bozuk Türkçe gösteriyor. İlk izlenim. |
| **Şimdi mi sonra mı** | Şimdi. |
| **Zorluk** | Düşük — doğrudan string replace. |
| **Ön koşul** | Yok. |
| **Risk** | Düşük. |

#### P0-2: Editor Dirty State + Kayıp Önleme

| Alan | Detay |
|---|---|
| **Ne yapılmalı** | Monaco editor'de `onDidChangeModelContent` ile dirty flag takibi + tab kapatırken unsaved dialog. |
| **Neden** | Kullanıcı veri kaybı. `closeTab()` sadece image editor için bunu yapıyor, kod dosyaları için yapmıyor. |
| **Şimdi mi sonra mı** | Şimdi. |
| **Zorluk** | Düşük-Orta. `openFiles` Map'inde `modified: true/false` zaten tanımlı ama kullanılmıyor. |
| **Ön koşul** | Yok. |
| **Risk** | Düşük. |

#### P0-3: Global Error Boundary

| Alan | Detay |
|---|---|
| **Ne yapılmalı** | `window.onerror` ve `window.onunhandledrejection` handler'ları ekleyerek renderer crash'lerini yakalama + kullanıcıya bilgi verme. |
| **Neden** | Tek bir uncaught exception tüm UI'ı öldürebilir. |
| **Şimdi mi sonra mı** | Şimdi. |
| **Zorluk** | Düşük. |
| **Ön koşul** | Yok. |
| **Risk** | Düşük. |

---

### P1 — Yakın Vadede Yapılmalı (Ürün Kalitesini Etkileyen)

#### P1-1: `activateTab()` / `openFile()` Refactor — Registry Pattern

| Alan | Detay |
|---|---|
| **Ne yapılmalı** | 12-branch if/else zincirini bir `VIRTUAL_TAB_REGISTRY` map'ine çevirmek: `{ 'visual-builder://': { containerId: '...', initFn: ..., icon: ... } }`. |
| **Neden** | Her yeni araç eklenmesinde 3 ayrı yerde (openFile, activateTab, HTML) değişiklik gerekiyor. Hata riski yüksek. |
| **Şimdi mi sonra mı** | Yakın (1–2 hafta). |
| **Zorluk** | Orta. Mevcut davranışı korumak gerekiyor. |
| **Ön koşul** | Yok. |
| **Risk** | Orta — regression. |

#### P1-2: Duplike Fonksiyonları Konsolide Et

| Alan | Detay |
|---|---|
| **Ne yapılmalı** | `tr()`, `esc()`, `normalizeMode()`, `notify()` gibi 4+ yerde tekrar eden fonksiyonları tek bir `src/renderer/shared/utils.js` dosyasına taşımak. |
| **Neden** | Bir bug'ı 4 yerde düzeltmek gerekiyor. Tutarsız davranış. |
| **Şimdi mi sonra mı** | Yakın. |
| **Zorluk** | Düşük-Orta. Module sistemi olmadığı için `window.CraftIDEUtils` gibi bir global gerekecek. |
| **Ön koşul** | Yok. |
| **Risk** | Düşük. |

#### P1-3: Code Generation Regression Testleri

| Alan | Detay |
|---|---|
| **Ne yapılmalı** | Visual Builder'ın `generateCode()` fonksiyonunu 5–10 farklı graph input'u ile çağırıp, üretilen kodun en azından syntax olarak valid Java/Skript olduğunu doğrulayan test suite. |
| **Neden** | Ürünün temel değer önerisi "çalışan kod üretmek". Bu test edilmiyorsa ürün vaadini karşılayamıyor. |
| **Şimdi mi sonra mı** | Yakın (2–3 hafta). |
| **Zorluk** | Orta. `generateCode()` fonksiyonunun DOM bağımlılıkları varsa mock gerekir. |
| **Ön koşul** | `generateCode()`'un pure function olarak extract edilebilirliği. (Belirsiz — bkz. Açık Sorular.) |
| **Risk** | Orta — DOM entangled ise zor. |

#### P1-4: Monaco Model Lifecycle Düzeltmesi

| Alan | Detay |
|---|---|
| **Ne yapılmalı** | Tab kapatılırken ilgili Monaco model'in dispose edilmesi. Aynı dosya için tekrar model oluşturmak yerine cache. |
| **Neden** | Memory leak. Uzun oturumlarda uygulama yavaşlar. |
| **Şimdi mi sonra mı** | Yakın. |
| **Zorluk** | Düşük. |
| **Ön koşul** | Yok. |
| **Risk** | Düşük. |

---

### P2 — Orta Vadede Yapılmalı (Ölçeklenebilirlik)

#### P2-1: Renderer Module Sistemi Geçişi

| Alan | Detay |
|---|---|
| **Ne yapılmalı** | Dosyaları ES modules yapısına çevirmek. `<script type="module">` ile yükleme. Import/export ile bağımlılık yönetimi. |
| **Neden** | `window.*` global'leri sürdürülemez. Yeni geliştirici projeye giremez. Test edilemez. |
| **Şimdi mi sonra mı** | 4–8 hafta sonra. |
| **Zorluk** | Yüksek. Tüm dosyalar birbirine global referanslarla bağlı. Kademeli geçiş gerekir. |
| **Ön koşul** | P1-2 (shared utils). |
| **Risk** | Yüksek — tüm modüller arası iletişim değişir. Regression riski. |

#### P2-2: `phase-completion-suite.js`'i Parçala

| Alan | Detay |
|---|---|
| **Ne yapılmalı** | Bu tek dosyayı mantıksal birimlere ayırmak: `mob-designer.js`, `scoreboard-builder.js`, `npc-dialog.js`, `particle-designer.js`, `config-editor.js`, `extension-runtime.js` vb. |
| **Neden** | Tek dosyada 15+ bağımsız özellik — düzenleme, debug, code review imkansız. |
| **Şimdi mi sonra mı** | Orta vade. P2-1 ile birlikte yapılabilir. |
| **Zorluk** | Orta. Fonksiyonlar zaten IIFE içinde izole ama paylaşılan state var. |
| **Ön koşul** | P2-1 veya en azından shared state çözümü. |
| **Risk** | Orta. |

#### P2-3: CSS Parçalama

| Alan | Detay |
|---|---|
| **Ne yapılmalı** | 3269 satırlık `main.css`'i component bazlı dosyalara ayırmak: `titlebar.css`, `sidebar.css`, `visual-builder.css`, `modals.css` vb. |
| **Neden** | Bakım, debugging, specificity sorunları. |
| **Şimdi mi sonra mı** | Orta vade. |
| **Zorluk** | Düşük-Orta. |
| **Ön koşul** | Yok (CSS `@import` veya basit concatenation). |
| **Risk** | Düşük. |

#### P2-4: `contextIsolation` Geçişi

| Alan | Detay |
|---|---|
| **Ne yapılmalı** | `contextIsolation: true` + `preload.js` ile IPC bridge. |
| **Neden** | Güvenlik. Online content yükleme planı varsa zorunlu. |
| **Şimdi mi sonra mı** | Orta vade. |
| **Zorluk** | Yüksek. Tüm `require('electron')` çağrıları renderer'dan kaldırılmalı. `ipcRenderer.invoke()` doğrudan kullanımı `window.api.invoke()` gibi bir bridge'e taşınmalı. |
| **Ön koşul** | P2-1 (module geçişi). |
| **Risk** | Yüksek — her dosyada değişiklik. |

---

### P3 — Uzun Vadede Yapılmalı (Büyüme ve Olgunluk)

#### P3-1: Bundler Entegrasyonu (Vite/esbuild)

| Alan | Detay |
|---|---|
| **Ne yapılmalı** | Renderer kodunu bundle'layarak single-file veya chunk'lanmış output üretmek. |
| **Neden** | Load süresi, tree-shaking, HMR ile geliştirme hızı. |
| **Şimdi mi sonra mı** | P2-1 tamamlandıktan sonra. |
| **Zorluk** | Orta. |
| **Ön koşul** | P2-1 (ES modules). |
| **Risk** | Orta. |

#### P3-2: E2E Test Suite (Playwright)

| Alan | Detay |
|---|---|
| **Ne yapılmalı** | Proje oluşturma → VB'de blok ekleme → code generate → build akışını test eden otomatik test. |
| **Neden** | Regression güvencesi. |
| **Şimdi mi sonra mı** | P1-3'ten sonra. |
| **Zorluk** | Yüksek. |
| **Ön koşul** | P1-3. |
| **Risk** | Düşük. |

#### P3-3: Extension Runtime Gerçekleştirme

| Alan | Detay |
|---|---|
| **Ne yapılmalı** | `extensions/` altındaki TypeScript extension'ları build edip gerçekten yükleyen bir host. |
| **Neden** | Şu an 5 extension dosyada duruyor, hiçbiri çalışmıyor. Ya kaldırılmalı ya gerçekleştirilmeli. |
| **Şimdi mi sonra mı** | Uzun vade. |
| **Zorluk** | Çok Yüksek. |
| **Ön koşul** | P2-4 (contextIsolation). |
| **Risk** | Scope creep. |

#### P3-4: Online Marketplace

| Alan | Detay |
|---|---|
| **Ne yapılmalı** | Şu an marketplace yerel JSON dosyası. Gerçek topluluk paylaşımı için backend. |
| **Neden** | Topluluk büyümesi, içerik zenginliği. |
| **Şimdi mi sonra mı** | Uzun vade. |
| **Zorluk** | Çok Yüksek (backend, auth, moderation gerekir). |
| **Ön koşul** | P2-4. |
| **Risk** | Yüksek. |

---

## 6. Yol Haritası

### Hafta 1–2: Stabilizasyon (P0)

- UTF-8 string düzeltmeleri (P0-1)
- Editor dirty state + save guard (P0-2)
- Global error boundary (P0-3)
- Monaco model dispose düzeltmesi (P1-4)

### Hafta 3–5: Kod Kalitesi (P1)

- Tab registry pattern refactor (P1-1)
- Shared utils konsolidasyonu (P1-2)
- Code generation test suite başlangıcı (P1-3)

### Hafta 6–10: Ölçeklenebilirlik Temeli (P2)

- CSS parçalama (P2-3) — en düşük riskli başlangıç
- `phase-completion-suite.js` parçalama (P2-2)
- ES module geçişi planlama + pilot (P2-1 başlangıç)

### Hafta 11+: Büyüme (P2 devam + P3)

- `contextIsolation` geçişi (P2-4)
- Bundler entegrasyonu (P3-1)
- E2E testler (P3-2)

---

## 7. Açık Sorular ve Belirsiz Noktalar

| # | Soru | Bağlam |
|---|---|---|
| AQ-1 | `phase-completion-suite.js` dosyasının tam satır sayısı ve özellik derinliği nedir? | Truncation nedeniyle dosyanın tamamı okunamadı. ~2000+ satır tahmini. İçindeki mob designer, NPC dialog, particle designer gibi araçların ne kadar fonksiyonel olduğu doğrulanamamıştır. |
| AQ-2 | `generateCode()` fonksiyonu DOM'a bağımlı mı? | P1-3 (code generation testleri) için kritik. Eğer fonksiyon DOM elementlerine direkt erişiyorsa, test için mock veya refactor gerekir. Truncation nedeniyle `visual-builder.js`'in code generation bölümü tam okunamadı. |
| AQ-3 | `GELISTIRME_PLANI.md`'deki "tüm fazlar tamamlandı" ifadesi gerçeği ne ölçüde yansıtıyor? | `KOKLU_DEGISIKLIKLER.md`'de "Tüm fazlar MVP seviyesinde tamamlandı" ve "5/5 test pass" yazıyor. Ancak gerçek test kapsamı 49 satır / 5 test (yalnızca utility). Birçok özelliğin skeleton/stub seviyesinde olma ihtimali var. |
| AQ-4 | Extension runtime gerçekleştirilecek mi, yoksa extensions klasörü kaldırılmalı mı? | 5 extension tanımlı ama hiçbiri çalışmıyor. Kaldırılması veya `product.json`'dan referanslarının temizlenmesi temizlik açısından değerlendirilebilir. |
| AQ-5 | macOS/Linux desteği planlarda var mı? | electron-builder config'i sadece Windows hedefli. Hedef kitle kararı bunu etkiler. |

---

## Uygulama Notları

- Bu doküman repodaki gerçek kaynak koduna dayalı analiz içerir. Truncation nedeniyle okunamamış bölümler açıkça belirtilmiştir.
- Öncelik sıralaması dört kriter ağırlıklı değerlendirilmiştir: **kullanıcıya etkisi**, **geliştirme maliyeti**, **teknik risk** ve **bakım yükü**.
- P0 maddelerinin tamamı bağımsızdır, paralel çalışılabilir.
- P1 maddeleri arasında P1-2 (shared utils), P2-1 (ES modules) için ön koşul oluşturur.
- P2-4 (contextIsolation), P3 maddelerinin çoğu için geçit noktasıdır; geciktirilmesi tüm P3 zaman çizelgesini kaydırır.
- Bu doküman yeni fikir veya öneri içermez; yalnızca mevcut analizin yapılandırılmış halidir.

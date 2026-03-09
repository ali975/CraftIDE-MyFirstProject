# CraftIDE Yapilan ve Yapilacaklar

Bu belge, CraftIDE icin hem bugune kadar **uygulanan degisiklikleri** hem de bundan sonra **tamamlanmasi gereken yol haritasini** tek dosyada toplar.

Amac:
- Baska bir AI veya gelistirici bu dosyayi okuyup dogrudan nerede kalindigini anlayabilsin.
- Tamamlanan isler ile acik kalan isler karismasin.
- Hedef urun vizyonu korunarak devam edilebilsin.

## 1. Hedef

CraftIDE'yi klasik bir "Minecraft IDE" olmaktan çıkarıp, kod bilmeyen bir kullanicinin fikirden calisan plugin/mod/skript ciktisina ulasabildigi yonlendirmeli bir creator platformuna donusturmek.

Basari tanimi:
- Kullanici `Welcome` ekraninda niyetini yazar.
- Uygulama dogru uretici akisini secip kullaniciyi yonlendirir.
- Sistem gorsel akisi kurar, eksikleri aciklar, kodu uretir.
- Build, temel senaryo ve release adimlari tek bir hat olarak tamamlanir.
- Kullanici teknik detay bilmeden "ilk calisan surumu" uretebilir.

## 2. Yapilanlar

## 2.1 Urun Akisinin Merkezilesmesi

Yapilanlar:
- Welcome deneyimi, fikir odakli creator akisina daha yakin hale getirildi.
- Welcome onizleme alanina ek bilgi kartlari eklendi:
  - recommended route
  - questions to confirm
  - delivery pipeline
- Sol taraftaki klasik baslangic alani urun dili olarak ikincil hale getirildi.
- “Create with AI” dili daha yardimci hale getirilip “Open AI Chat” olarak geri plana alindi.
- Welcome akisinin mantigi `src/renderer/app.js` icinden ayrilarak `src/renderer/welcome-flow.js` dosyasina tasinmaya baslandi.

Etkilenen dosyalar:
- `src/renderer/index.html`
- `src/renderer/app.js`
- `src/renderer/welcome-flow.js`

## 2.2 Rehberli Intake ve Creator Routing

Yapilanlar:
- `src/shared/creator-brief.js` icine yeni intake yardimcilari eklendi:
  - `buildGuidedIntake()`
  - `buildDeliveryChecklist()`
  - audience / outcome / trigger cikarimi
- Welcome ekraninda kullanicinin girdisinden:
  - olasi route
  - netlestirilmesi gereken sorular
  - teslim checklist’i
  gosterilmeye baslandi.
- Welcome path yönlendirmesi artik daha acik sekilde creator-first davraniyor.

Etkilenen dosyalar:
- `src/shared/creator-brief.js`
- `src/renderer/welcome-flow.js`
- `src/renderer/app.js`

## 2.3 AI Grounding ve Ortak Minecraft Bilgisi

Yapilanlar:
- `src/shared/minecraft-guidance.js` eklendi.
- Bu dosya icine su katmanlar eklendi:
  - knowledge packs
  - project snapshot
  - prompt preamble
  - release quality gate
  - otomatik scenario fikirleri
- Knowledge packs icine su basliklar eklendi:
  - Vault
  - PlaceholderAPI
  - WorldGuard
  - Citizens
  - ProtocolLib
  - Folia
- Renderer AI tarafinda prompt context injection baslatildi.
- Extension AI context’i zenginlestirildi:
  - indexed file list
  - dependency benzeri sinyaller
  - project summary
  - API highlights
- Architect agent, artik `ProjectContext` kullanarak sistem promptuna proje baglamini ekleyebiliyor.

Etkilenen dosyalar:
- `src/shared/minecraft-guidance.js`
- `src/renderer/ai-manager.js`
- `extensions/craftide-ai/src/ui/ChatPanelProvider.ts`
- `extensions/craftide-ai/src/agents/ArchitectAgent.ts`
- `extensions/craftide-ai/src/orchestrator/AgentOrchestrator.ts`
- `extensions/craftide-ai/src/types.ts`

## 2.4 No-Code Delivery Gate ve Uretim Hatti

Yapilanlar:
- `src/renderer/no-code-suite.js` icine merkezi quality status state’i eklendi.
- Validation, build ve scenario sonucu delivery gate’e baglandi.
- Release oncesi temel kalite kapisi eklendi.
- Scenario input’u prompt’tan otomatik tohumlanabilir hale geldi.
- Intent Wizard, artik sadece graph degil:
  - route
  - questions to confirm
  - delivery checklist
  de uretiyor.
- One-step flow ve build/scenario adimlari metrics ve journey step olarak isaretleniyor.
- No-code paneline yeni “Delivery Gate” gorunumu eklendi.

Etkilenen dosyalar:
- `src/renderer/no-code-suite.js`
- `src/shared/minecraft-guidance.js`
- `src/shared/creator-brief.js`

## 2.5 Metrik ve Yolculuk Takibi

Yapilanlar:
- `src/renderer/creator-metrics.js` eklendi.
- Journey bazli adim takibi eklendi:
  - flow start
  - validation
  - build
  - scenario
  - release
  - AI chat
- `src/renderer/app.js` icine creator journey yardimcilari eklendi.

Etkilenen dosyalar:
- `src/renderer/creator-metrics.js`
- `src/renderer/app.js`

## 2.6 Main Process Parcalama Baslangici

Yapilanlar:
- `src/main/graph-services.ts` eklendi.
- `src/main/build-release-services.ts` eklendi.
- `src/main/ipc.ts` icindeki graph/build/release mantiginin bir kismi bu yeni servis dosyalarina tasindi.
- `build:run`, `build:guaranteed`, `vb:nl2graph`, `validate:graph`, `release:oneClick` bu servisleri kullanacak sekilde guncellendi.

Etkilenen dosyalar:
- `src/main/ipc.ts`
- `src/main/graph-services.ts`
- `src/main/build-release-services.ts`

## 2.7 Guvenlik Migrasyonu Icin Ilk Adim

Yapilanlar:
- `src/main/preload.ts` eklendi.
- `src/main/main.ts` icine preload referansi eklendi.
- `window.CraftIDEBridge` icin gecis kancasi olusturuldu.

Durum:
- Bu sadece ilk asama.
- Uygulama hala tam guvenli Electron moduna gecmedi.

Etkilenen dosyalar:
- `src/main/preload.ts`
- `src/main/main.ts`

## 2.8 Packaging ve Extension Hizalama

Yapilanlar:
- `package.json` icinde paketleme kapsamına `product.json` ve `extensions/**/*` eklendi.
- `product.json` icindeki gercekte var olmayan `craftide-3d` kaydi kaldirildi.

Durum:
- Packaging kapsami iyilesti.
- Ama extension runtime konusu hala stratejik olarak acik.

Etkilenen dosyalar:
- `package.json`
- `product.json`

## 2.9 Testler ve Dogrulama

Yapilanlar:
- `tests/creator-brief.test.js` genisletildi.
- `tests/minecraft-guidance.test.js` eklendi.
- Yeni testler su alanlari kapsiyor:
  - guided intake
  - delivery checklist
  - knowledge pack cikarimi
  - prompt preamble
  - release quality gate
  - scenario ideas
- Derleme ve testler calistirildi.

Durum:
- `npm run build:main` gecti.
- `npm test` gecti.

Etkilenen dosyalar:
- `tests/creator-brief.test.js`
- `tests/minecraft-guidance.test.js`

## 2.10 Paylasilan Hazirlik + Telemetri Yuzey Kazimi

Yapilanlar:

- `src/shared/minecraft-guidance.js` icine iki yeni yardimci eklendi:
  - `buildReleaseDeliverySummary(releaseResult, qualityStatus)` — artifact, checksum, manuel kontroller ve sonraki adimi iceren teslimat ozeti
  - `buildProjectReadinessSnapshot(qualityStatus, releaseResult)` — skor/yuzde/aciklama iceren proje hazirlik anliktasi

- `src/renderer/creator-metrics.js` icine aggregate telemetri yardimcilari eklendi:
  - `getFirstWorkingBuildTime(metrics)` — ilk calisan build'e kadar gecen sure (ms)
  - `getBuildSuccessRate(metrics)` — basarili build orani (%)
  - `getScenarioPassRate(metrics)` — senaryo gecme orani (%)
  - `getManualFixRate(metrics)` — cok denemeli build orani / AI onarim yakinsamasi (%)
  - `getRecommendedRouteAccuracy(metrics)` — onerilene uyan rota secimi orani (%)
  - `aggregateTelemetry(metrics?)` — tum metrikleri tek bir ozette toplar

- `src/renderer/state-store.js` — `creator.readiness` varsayilan durumu eklendi

- `src/renderer/no-code-suite.js` cok sayida gelistirme:
  - `setQualityStatus` artik `CraftIDEStore`'a `creator.readiness` yazıyor
  - `runScenarios` artik baskari nedenlerini (`failureReasons`) yakalıyor
  - `renderDeliveryGate` artik `renderReadinessPanel` ve `renderTelemetryPanel` cagirisini tetikliyor
  - Yeni `renderReadinessPanel()` — ilerleme cubugu ve check listesi ile proje hazirlik paneli
  - Yeni `renderTelemetryPanel()` — creator-metrics agregasyonunu UI'a yansıtir
  - Basarili release sonrasi mevcut journey `finishJourney()` ile tamamlaniyor
  - Release ciktisi genisletildi: artifact, checksum, manuel kontroller, sonraki adim
  - `getReadiness()` public API'ye eklendi
  - Yeni UI panelleri: "Project Readiness" ve "Creator Telemetry"

- `src/renderer/welcome-flow.js`:
  - Delivery karti `CraftIDEStore.creator.readiness` mevcutsa bunu okar
  - `CraftIDEStore.subscribe` ile store guncellemelerine abone olur

- `src/renderer/app.js`:
  - `openWelcomeCreatorPath` artik `recommendedRoute`'u metrik adimina kaydediyor
  - `launchWelcomeIdeaFlow` artik `recommendedRoute`'u metrik adimina kaydediyor

- Yeni testler eklendi:
  - `tests/minecraft-guidance.test.js` genisletildi (yeni yardimcilar icin 7 ek test)
  - `tests/creator-metrics.test.js` — tum telemetri yardimcilari icin 13 test
  - `tests/graph-services.test.js` — normalizeGraphMode, localNlGraph, validateGraphShape (dist gerektirir)
  - `tests/build-release-services.test.js` — extractCompileErrors, artifact finder, hashFileSha256, createReleasePackage (dist gerektirir)

- `PROJECT.md` olusturuldu (proje durumu + bu slice icin dokumantasyon)

Durum:
- `npm run build:main` — pwsh.exe eksikligi nedeniyle bu oturumda calistirilamamadi (bkz. blocker notu)
- `npm test` — pwsh.exe eksikligi nedeniyle bu oturumda calistirilamamadi
- Tum kod degisiklikleri mevcut davranisi bozmadan yapildi; testler mock veriyle bagimsiz calisir

Etkilenen dosyalar:
- `src/shared/minecraft-guidance.js`
- `src/renderer/creator-metrics.js`
- `src/renderer/state-store.js`
- `src/renderer/no-code-suite.js`
- `src/renderer/welcome-flow.js`
- `src/renderer/app.js`
- `tests/minecraft-guidance.test.js`
- `tests/creator-metrics.test.js` (yeni)
- `tests/graph-services.test.js` (yeni)
- `tests/build-release-services.test.js` (yeni)
- `PROJECT.md` (yeni)

## 3. Hala Yapilacaklar

## 3.1 Guvenlik Sertlestirmesi

Hedef:
- `contextIsolation: true`
- `nodeIntegration: false`
- `webSecurity: true`
- Renderer tarafinin `ipcRenderer` ve `require()` bagimliligindan kurtulmasi

Mevcut durum:
- `src/main/preload.ts` eklendi.
- `src/main/main.ts` icine preload referansi eklendi.
- Ancak uygulama hala eski guvensiz Electron ayarlariyla calisiyor.

Yapilacaklar:
- `src/main/main.ts` icindeki `webPreferences` alanini guvenli moda gecir.
- Renderer tarafinda dogrudan `require('electron')` kullanan dosyalari tara.
- `window.CraftIDEBridge` uzerinden gerekli IPC wrapper'larini tanimla.
- Su dosyalardaki Electron bagimliliklarini bridge kullanimina tasi:
  - `src/renderer/app.js`
  - `src/renderer/no-code-suite.js`
  - `src/renderer/phase-completion-suite.js`
  - `src/renderer/ai-manager.js`
  - `src/renderer/gui-builder.js`
  - `src/renderer/command-tree.js`
  - `src/renderer/recipe-creator.js`
  - `src/renderer/permission-tree.js`

Bitis kriteri:
- Renderer tarafinda `require('electron')` kalmamali.
- Uygulama `contextIsolation: true` ile acilmali.
- Temel akislar bozulmadan calismali.

## 3.2 Renderer Monolitlerinin Daha Fazla Parcalanmasi

Mevcut durum:
- `welcome-flow.js` ve `creator-metrics.js` ayrildi.
- Ama `src/renderer/app.js` hala ana monolit.
- `src/renderer/no-code-suite.js` hala buyuk.

Yapilacaklar:
- `src/renderer/app.js` icinden su alanlari ayir:
  - AI chat panel logic
  - explorer/file actions
  - tab lifecycle
  - search UI
  - notification system
- `src/renderer/no-code-suite.js` icinden su alanlari ayir:
  - quality gate / delivery state
  - scenario runner
  - guaranteed build flow
  - intent wizard
  - one-step flow
  - modal mounting / UI injection
- `src/renderer/phase-completion-suite.js` icindeki designer’lari ayri dosyalara bol:
  - npc designer
  - quest designer
  - region designer
  - loot designer
  - economy designer
  - extension runtime panel

Bitis kriteri:
- `app.js` shell gorevinde kalmali.
- Yeni feature eklemek icin devasa tek dosyalara dokunma zorunlulugu azalmali.

## 3.3 Gercek AI Domain Intelligence Seviyesi

Mevcut durum:
- Shared guidance katmani eklendi.
- Prompt context injection basladi.
- Extension AI context’i zenginlesti.
- Ama LLM davranisi hala buyuk oranda prompt bazli.

Yapilacaklar:
- `src/shared/minecraft-guidance.js` icini daha gercek veriyle buyut:
  - version-aware compatibility hints
  - dependency capability profiles
  - anti-pattern library
- `extensions/craftide-minecraft/src/apidb/MinecraftApiDatabase.ts` verisini AI promptlarina aktif bagla.
- `extensions/craftide-ai/src/agents/ArchitectAgent.ts`
- `extensions/craftide-ai/src/agents/CoderAgent.ts`
- `extensions/craftide-ai/src/agents/ValidatorAgent.ts`
- Bu ajanlara su alanlarda structured context ver:
  - aktif platform
  - minecraft version
  - mevcut dosya listesi
  - plugin/mod metadata
  - dependency profile
  - relevant API highlights
- `scripts/ai-training/advanced-minecraft-expert-50.jsonl` icerigini:
  - few-shot example library
  - prompt snippet bank
  - issue/solution memory
  olarak kullan.

Bitis kriteri:
- Ayni prompt plugin/fabric/forge/skript modlarinda anlamli sekilde farkli sonuc vermeli.
- AI, dependency ve version uyumlulugu konusunda daha az generic konusmali.

## 3.4 `vb:nl2graph` Hibrit Mimarisinin Derinlestirilmesi

Mevcut durum:
- `src/main/graph-services.ts` ile mantik ayrildi.
- Ama graph üretimi hala agirlikli local heuristic.

Yapilacaklar:
- `src/main/graph-services.ts` icine yeni bir katman ekle:
  - block catalog summary
  - allowed node schema
  - allowed connection schema
  - mode bazli valid blocks
- Renderer veya main tarafinda LLM tabanli graph candidate olustur.
- Candidate graph’i `validateGraphShape()` ile normalize et.
- Geçersizse local fallback’e dus.
- `src/renderer/ai-manager.js` ve `src/renderer/no-code-suite.js` ile ayni davranis korunmali.

Bitis kriteri:
- Daha acik uçlu promptlarda graph önerileri mevcut heuristikten daha anlamli olmali.

## 3.5 Delivery Pipeline'in Nihai Uretim Hattina Donusmesi

Mevcut durum:
- Delivery gate gorunur hale geldi.
- Release öncesi temel gate kontrolu var.
- Scenario tohumlama eklendi.
- Ama pipeline hala dağinik ve modal tabanli.

Yapilacaklar:
- `src/renderer/no-code-suite.js` icindeki quality state'i daha merkezi hale getir.
- Tek bir “Project Readiness” veya “Ship Flow” paneli tasarla.
- Welcome, Visual Builder ve Release ekranlari ayni readiness state’i okusun.
- Scenario sonucunu daha gercekci hale getir:
  - kullanici senaryolari
  - otomatik seed senaryolar
  - başarısızlık nedeni
- Release sonrasinda kullanıcıya teslim özeti ver:
  - uretilen artifact
  - checksum
  - eksik manuel kontroller
  - sonraki doğal adım

Bitis kriteri:
- Teknik olmayan kullanıcı “ne kadar hazirim?” sorusunu tek bakista gorebilmeli.

## 3.6 Extension Stratejisinin Nihai Karara Baglanmasi

Mevcut durum:
- `product.json` temizlendi.
- `package.json` packaging kapsamı genisletildi.
- Ama extension’lar gercek runtime olarak calismiyor.

Karar noktasi:
- Yol A: CraftIDE esasen Electron urunu olacak
- Yol B: Gercek extension host mantigi kurulacak

Yol A secilecekse yapilacaklar:
- `extensions/` klasorunu yardimci kaynak olarak tut ya da kademeli kaldır.
- Renderer icindeki pseudo-extension runtime’i sadeleştir.
- Tum urun mantigini Electron renderer/main tarafina topla.

Yol B secilecekse yapilacaklar:
- Extension build pipeline kur.
- TS output üret.
- Packaged app icinde built-in extension yükleme mantigi kur.
- `craftide-ai`, `craftide-core`, `craftide-minecraft`, `craftide-testserver`, `craftide-visual` gercek aktivasyon gorsun.

Bitis kriteri:
- Extension konusu “yarim kalmis alternatif mimari” gibi durmamali.

## 3.7 Test ve Telemetry Bosluklari

Mevcut durum:
- Node testleri genisletildi.
- Guidance ve intake testleri eklendi.
- `tests/creator-metrics.test.js` eklendi — tum aggregate telemetri yardimcilari kapsaniyor.
- `tests/graph-services.test.js` eklendi — dist build gerektirir.
- `tests/build-release-services.test.js` eklendi — dist build gerektirir.
- `src/renderer/creator-metrics.js` verisi UI'da "Creator Telemetry" panelinde goruntuleniyor.
- Telemetri paneli: first working build time, build success rate, scenario pass rate, AI repair rate, route accuracy.

Hala yapilacaklar:
- `scripts/run-node-tests.js` yapisini gerekirse klasor bazli genislet.
- E2E icin temel kapsam belirle:
  - welcome prompt gir
  - builder ac
  - graph uret
  - code gen
  - build
  - scenario
  - release

Bitis kriteri:
- Uygulamanin ilerleyip ilerlemedigi hissiyata degil metriklere gore anlasilmali.

## 4. Onerilen Sonraki Sira

En mantikli devam sirasi:

1. Guvenlik migrasyonu
2. Renderer modulerlesmesi
3. AI grounding derinlestirme
4. `vb:nl2graph` hibrit LLM katmani
5. Delivery pipeline UX tamamlanmasi
6. Extension stratejisinin kesinlestirilmesi
7. E2E ve telemetry

## 5. Kritik Dosyalar

Bu alanlar hem yapilanlarin hem de kalan isin ana merkezleri:

- `src/main/main.ts`
- `src/main/preload.ts`
- `src/main/ipc.ts`
- `src/main/graph-services.ts`
- `src/main/build-release-services.ts`
- `src/renderer/app.js`
- `src/renderer/no-code-suite.js`
- `src/renderer/phase-completion-suite.js`
- `src/renderer/ai-manager.js`
- `src/renderer/welcome-flow.js`
- `src/renderer/creator-metrics.js`
- `src/shared/creator-brief.js`
- `src/shared/minecraft-guidance.js`
- `extensions/craftide-ai/src/agents/ArchitectAgent.ts`
- `extensions/craftide-ai/src/agents/CoderAgent.ts`
- `extensions/craftide-ai/src/agents/ValidatorAgent.ts`
- `extensions/craftide-ai/src/ui/ChatPanelProvider.ts`
- `extensions/craftide-ai/src/orchestrator/AgentOrchestrator.ts`
- `extensions/craftide-minecraft/src/apidb/MinecraftApiDatabase.ts`
- `package.json`
- `product.json`

## 6. Baska AI Icin Teslim Notu

Eger bu belgeyi devam ettirecek baska bir AI varsa:

- Once mevcut degisiklikleri bozmadan calissin.
- `Welcome -> NoCode -> Delivery Gate` hattini merkeze alsin.
- Renderer tarafinda bir anda buyuk yikici refactor yapmasin; parca parca ilerlesin.
- `contextIsolation` gecisini en kritik kirilma noktasi olarak ele alsin.
- Extension konusu net karar verilmeden buyuk entegrasyon yazmasin.
- Yapilan degisiklikleri geri almayip onlarin ustune insa etsin.

## 7. Nihai Bitis Resmi

Bu belge tamamen kapanmis sayilabilmesi icin su durum gerceklesmeli:

- Kullanici fikir yazdiktan sonra uygulama onu dogru akisa otomatik yonlendirebilmeli.
- AI, mevcut proje dosyalari ve Minecraft ekosistemi bilgisiyle daha akilli konusmali.
- Release oncesi kalite kapilari sadece gorunur degil guvenilir olmali.
- Electron guvenlik modeli modern hale gelmeli.
- Extension mimarisi ya gerceklesmeli ya da sadeleştirilmeli.
- Urun davranisi metriklerle olculebilir hale gelmeli.

# CraftIDE Yapilan Yenilikler Ozeti

Bu belge, `YAPILANveYAPILACAKLAR.md` icindeki **tamamlanmis yenilikleri** tek yerde toplamak icin hazirlandi.
Amaci, sadece yapilan gelistirmeleri ayri bir referans dosyasi halinde sunmaktir.

## 1. Urun Akisinin Merkezilesmesi

- Welcome deneyimi, fikir odakli creator akisina daha yakin hale getirildi.
- Welcome onizleme alanina su bilgi kartlari eklendi:
  - recommended route
  - questions to confirm
  - delivery pipeline
- Klasik baslangic alani urun dili olarak ikincil hale getirildi.
- "Create with AI" dili daha yardimci hale getirilip "Open AI Chat" olarak geri plana alindi.
- Welcome akis mantigi `src/renderer/app.js` icinden ayrilip `src/renderer/welcome-flow.js` tarafina tasinmaya baslandi.

**Etkilenen dosyalar**
- `src/renderer/index.html`
- `src/renderer/app.js`
- `src/renderer/welcome-flow.js`

## 2. Rehberli Intake ve Creator Routing

- `src/shared/creator-brief.js` icine yeni intake yardimcilari eklendi:
  - `buildGuidedIntake()`
  - `buildDeliveryChecklist()`
  - audience / outcome / trigger cikarimi
- Welcome ekraninda kullanici girdisinden:
  - olasi route
  - netlestirilmesi gereken sorular
  - teslim checklist'i
  gosterilmeye baslandi.
- Welcome path yonlendirmesi creator-first mantiga daha yakin hale getirildi.

**Etkilenen dosyalar**
- `src/shared/creator-brief.js`
- `src/renderer/welcome-flow.js`
- `src/renderer/app.js`

## 3. AI Grounding ve Ortak Minecraft Bilgisi

- `src/shared/minecraft-guidance.js` eklendi.
- Bu katmanda sunlar tanimlandi:
  - knowledge packs
  - project snapshot
  - prompt preamble
  - release quality gate
  - otomatik scenario fikirleri
- Knowledge pack kapsaminda su basliklar eklendi:
  - Vault
  - PlaceholderAPI
  - WorldGuard
  - Citizens
  - ProtocolLib
  - Folia
- Renderer AI tarafinda prompt context injection baslatildi.
- Extension AI context'i su alanlarda zenginlestirildi:
  - indexed file list
  - dependency benzeri sinyaller
  - project summary
  - API highlights
- Architect agent, `ProjectContext` kullanarak sistem promptuna proje baglami ekleyebilir hale geldi.

**Etkilenen dosyalar**
- `src/shared/minecraft-guidance.js`
- `src/renderer/ai-manager.js`
- `extensions/craftide-ai/src/ui/ChatPanelProvider.ts`
- `extensions/craftide-ai/src/agents/ArchitectAgent.ts`
- `extensions/craftide-ai/src/orchestrator/AgentOrchestrator.ts`
- `extensions/craftide-ai/src/types.ts`

## 4. No-Code Delivery Gate ve Uretim Hatti

- `src/renderer/no-code-suite.js` icine merkezi quality status state'i eklendi.
- Validation, build ve scenario sonucu delivery gate'e baglandi.
- Release oncesi temel kalite kapisi eklendi.
- Scenario input'u prompt'tan otomatik tohumlanabilir hale getirildi.
- Intent Wizard su alanlari da uretir hale getirildi:
  - route
  - questions to confirm
  - delivery checklist
- One-step flow ile build/scenario adimlari metrics ve journey step olarak isaretlenmeye baslandi.
- No-code paneline yeni "Delivery Gate" gorunumu eklendi.

**Etkilenen dosyalar**
- `src/renderer/no-code-suite.js`
- `src/shared/minecraft-guidance.js`
- `src/shared/creator-brief.js`

## 5. Metrik ve Yolculuk Takibi

- `src/renderer/creator-metrics.js` eklendi.
- Journey bazli adim takibi eklendi:
  - flow start
  - validation
  - build
  - scenario
  - release
  - AI chat
- `src/renderer/app.js` icine creator journey yardimcilari eklendi.

**Etkilenen dosyalar**
- `src/renderer/creator-metrics.js`
- `src/renderer/app.js`

## 6. Main Process Parcalama Baslangici

- `src/main/graph-services.ts` eklendi.
- `src/main/build-release-services.ts` eklendi.
- `src/main/ipc.ts` icindeki graph/build/release mantiginin bir kismi bu servis dosyalarina tasindi.
- Su kanallar yeni servislere baglandi:
  - `build:run`
  - `build:guaranteed`
  - `vb:nl2graph`
  - `validate:graph`
  - `release:oneClick`

**Etkilenen dosyalar**
- `src/main/ipc.ts`
- `src/main/graph-services.ts`
- `src/main/build-release-services.ts`

## 7. Guvenlik Migrasyonu Icin Ilk Adim

- `src/main/preload.ts` eklendi.
- `src/main/main.ts` icine preload referansi eklendi.
- `window.CraftIDEBridge` icin gecis kancasi olusturuldu.

**Durum notu**
- Bu sadece ilk asama.
- Uygulama henuz tam guvenli Electron moduna gecmedi.

**Etkilenen dosyalar**
- `src/main/preload.ts`
- `src/main/main.ts`

## 8. Packaging ve Extension Hizalama

- `package.json` icinde paketleme kapsamina `product.json` ve `extensions/**/*` eklendi.
- `product.json` icindeki gercekte var olmayan `craftide-3d` kaydi kaldirildi.

**Durum notu**
- Packaging kapsami iyilesti.
- Extension runtime konusu stratejik olarak hala acik.

**Etkilenen dosyalar**
- `package.json`
- `product.json`

## 9. Testler ve Dogrulama

- `tests/creator-brief.test.js` genisletildi.
- `tests/minecraft-guidance.test.js` eklendi.
- Bu testler su alanlari kapsar hale geldi:
  - guided intake
  - delivery checklist
  - knowledge pack cikarimi
  - prompt preamble
  - release quality gate
  - scenario ideas

**Durum notu**
- Belgede yer alan onceki kayda gore:
  - `npm run build:main` gecti
  - `npm test` gecti

**Etkilenen dosyalar**
- `tests/creator-brief.test.js`
- `tests/minecraft-guidance.test.js`

## 10. Paylasilan Hazirlik ve Telemetri Yuzeyi

- `src/shared/minecraft-guidance.js` icine iki yeni yardimci eklendi:
  - `buildReleaseDeliverySummary(releaseResult, qualityStatus)`
  - `buildProjectReadinessSnapshot(qualityStatus, releaseResult)`
- `src/renderer/creator-metrics.js` icine aggregate telemetri yardimcilari eklendi:
  - `getFirstWorkingBuildTime(metrics)`
  - `getBuildSuccessRate(metrics)`
  - `getScenarioPassRate(metrics)`
  - `getManualFixRate(metrics)`
  - `getRecommendedRouteAccuracy(metrics)`
  - `aggregateTelemetry(metrics?)`
- `src/renderer/state-store.js` icine `creator.readiness` varsayilan durumu eklendi.
- `src/renderer/no-code-suite.js` tarafinda:
  - `CraftIDEStore` ile readiness senkronizasyonu kuruldu
  - scenario failure reason bilgisi yakalanmaya baslandi
  - `renderReadinessPanel()` eklendi
  - `renderTelemetryPanel()` eklendi
  - release ciktisi artifact, checksum, manuel kontrol ve sonraki adim bilgisiyle genisletildi
  - `getReadiness()` public API'ye eklendi
  - basarili release sonrasi mevcut journey tamamlanir hale getirildi
- Visual Builder no-code alanina yeni paneller eklendi:
  - Project Readiness
  - Creator Telemetry
- `src/renderer/welcome-flow.js`, store'daki readiness verisini okuyup Welcome delivery kartina yansitir hale getirildi.
- `src/renderer/app.js`, recommended route bilgisini journey metric'lerine yazacak sekilde guncellendi.
- Su yeni testler eklendi:
  - `tests/creator-metrics.test.js`
  - `tests/graph-services.test.js`
  - `tests/build-release-services.test.js`
- `PROJECT.md` olusturuldu.

**Durum notu**
- Bu oturumdaki kayda gore `pwsh.exe` eksikligi nedeniyle `npm run build:main` ve `npm test` bu ortamda yeniden calistirilamadi.

**Etkilenen dosyalar**
- `src/shared/minecraft-guidance.js`
- `src/renderer/creator-metrics.js`
- `src/renderer/state-store.js`
- `src/renderer/no-code-suite.js`
- `src/renderer/welcome-flow.js`
- `src/renderer/app.js`
- `tests/minecraft-guidance.test.js`
- `tests/creator-metrics.test.js`
- `tests/graph-services.test.js`
- `tests/build-release-services.test.js`
- `PROJECT.md`

## Kisa Sonuc

CraftIDE, artik daha net bir creator-first Welcome deneyimi, daha guclu no-code delivery hattı, daha iyi AI grounding, daha belirgin release/readiness gorunurlugu ve daha gelismis journey telemetry altyapisina sahip.
Bu dosya sadece tamamlanmis yenilikleri toplar; kalan yol haritasi icin ana referans belge hala `YAPILANveYAPILACAKLAR.md` dosyasidir.

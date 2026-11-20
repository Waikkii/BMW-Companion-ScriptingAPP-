import { HStack, Image, Script, Spacer, Text, VStack, Widget } from "scripting"
import type { VehicleSnapshot } from "./domain"
import { fetchOfficialCarImage, loadCachedCarImage, isSessionExpiredError } from "./bmw-client"
import { loadRuntimeMode, loadSettings, loadWidgetSnapshot } from "./storage"
import { refreshConnectedSnapshot } from "./refresh"
import { emptySnapshot, PALETTE, widgetModel, type Appearance } from "./atelier/model"
import { LOGO_BASE64 } from "./atelier/logo"
import { atelierDemo } from "./atelier/demo"
import { MEDIUM_LAYOUT, SMALL_LAYOUT } from "./atelier/layout"

function tone(key: keyof typeof PALETTE, appearance: Appearance): any {
  return appearance === "system" ? PALETTE[key] : PALETTE[key][appearance]
}

export function AtelierWidget({ snapshot, car, offline = false, needsLogin = false, unavailable = false, small = false }: {
  snapshot: VehicleSnapshot; car: UIImage | null; offline?: boolean; needsLogin?: boolean; unavailable?: boolean; small?: boolean
}) {
  const settings = loadSettings()
  const m = widgetModel(snapshot, settings, { offline, needsLogin, unavailable })
  const color = (key: keyof typeof PALETTE) => tone(key, m.appearance)
  const logo = UIImage.fromBase64String(LOGO_BASE64)
  const layout = small ? SMALL_LAYOUT : MEDIUM_LAYOUT
  const carWidth = small ? SMALL_LAYOUT.carWidth : MEDIUM_LAYOUT.carWidth
  const carHeight = layout.carHeight
  const carView = car
    ? <Image image={car} resizable scaleToFit frame={{ width: carWidth, height: carHeight }} widgetAccentedRenderingMode="fullColor" />
    : <Image systemName="car.side" font={small ? 40 : 46} foregroundStyle={color("quiet")} frame={{ width: carWidth, height: carHeight }} />
  return (
    <VStack alignment="leading" spacing={0} padding={{ top: layout.top, horizontal: layout.horizontal, bottom: layout.bottom }}
      frame={{ maxWidth: Infinity, maxHeight: Infinity, alignment: "topLeading" }}
      widgetBackground={color("background")} foregroundStyle={color("text")}
      widgetURL={Script.createRunURLScheme(Script.name, { route: "overview" })}>
      <HStack spacing={5} frame={{ maxWidth: Infinity, height: layout.header }}>
        <Text font={small ? 14.5 : 20} fontWeight="bold" lineLimit={1} minScaleFactor={0.7}>{m.title}</Text>
        <Spacer minLength={0} />
        {logo ? <Image image={logo} resizable scaleToFit frame={{ width: small ? 15 : 23, height: small ? 15 : 23 }} widgetAccentedRenderingMode="fullColor" /> : null}
      </HStack>
      <VStack frame={{ height: layout.headerGap }} />
      {small ? (
        <VStack alignment="leading" spacing={0} frame={{ maxWidth: Infinity, maxHeight: Infinity }}>
          <Range m={m} small color={color} />
          <Spacer minLength={0} />
          <HStack frame={{ maxWidth: Infinity }}><Spacer minLength={0} />{carView}<Spacer minLength={0} /></HStack>
          <Spacer minLength={0} />
          <HStack spacing={3} frame={{ maxWidth: Infinity, height: layout.footer }}>
            <Image systemName={m.lockIcon} font={7} foregroundStyle={color(m.lockTone)} />
            <Text font={8} foregroundStyle={color(m.lockTone)} lineLimit={1}>{m.lock}</Text>
            <Spacer minLength={0} />
            <Text font={8} foregroundStyle={color(m.notice ? "warning" : "quiet")} lineLimit={1}>{m.notice || m.sync}</Text>
          </HStack>
        </VStack>
      ) : (
        <VStack alignment="leading" spacing={0} frame={{ maxWidth: Infinity, maxHeight: Infinity }}>
          <HStack spacing={0} frame={{ maxWidth: Infinity, height: MEDIUM_LAYOUT.body }}>
            <VStack alignment="leading" spacing={0} frame={{ width: MEDIUM_LAYOUT.metricsWidth, height: MEDIUM_LAYOUT.body, alignment: "topLeading" }}>
              <Range m={m} color={color} />
              <VStack frame={{ height: MEDIUM_LAYOUT.odometerGap }} />
              <Text font={9} foregroundStyle={color("secondary")} lineLimit={1} frame={{ height: MEDIUM_LAYOUT.odometer, alignment: "leading" }}>{m.odometer}</Text>
              <VStack frame={{ height: MEDIUM_LAYOUT.chipGap }} />
              <HStack spacing={0} frame={{ height: MEDIUM_LAYOUT.chip }}>
                <HStack spacing={4} padding={{ vertical: 3, horizontal: 6 }} background={{ style: color("chip"), shape: { type: "rect", cornerRadius: 5 } }}>
                  <Image systemName={m.lockIcon} font={8} foregroundStyle={color(m.lockTone)} />
                  <Text font={8.5} foregroundStyle={color(m.lockTone)} lineLimit={1}>{m.lock}</Text>
                  <Text font={8} foregroundStyle={color("quiet")}>·</Text>
                  <Text font={8} foregroundStyle={color("secondary")} lineLimit={1}>{m.sync}</Text>
                </HStack>
                <Spacer minLength={0} />
              </HStack>
            </VStack>
            <Spacer minLength={0} />
            {carView}
          </HStack>
          <Spacer minLength={0} />
          <HStack spacing={4} frame={{ maxWidth: Infinity, height: layout.footer }}>
            <Text font={8} foregroundStyle={color(m.notice ? "warning" : "secondary")} lineLimit={1}>{m.notice || m.reserve}</Text>
            <Spacer minLength={0} />
            <Text font={8.5} foregroundStyle={color(m.statusTone)} lineLimit={1} minScaleFactor={0.7}>{m.status}</Text>
          </HStack>
        </VStack>
      )}
    </VStack>
  )
}

function Range({ m, small = false, color }: { m: ReturnType<typeof widgetModel>; small?: boolean; color: (key: keyof typeof PALETTE) => any }) {
  return <HStack spacing={3} alignment="lastTextBaseline" frame={{ height: small ? SMALL_LAYOUT.range : MEDIUM_LAYOUT.range, alignment: "bottomLeading" }}>
    <Text font={small ? 27 : 34} fontWeight="medium" lineLimit={1} minScaleFactor={0.7}>{m.range}</Text>
    <Text font={small ? 11 : 12} foregroundStyle={color("secondary")}>km</Text>
    <Text font={small ? 11 : 12} foregroundStyle={color("quiet")}>/</Text>
    <Text font={small ? 11 : 12} foregroundStyle={color("secondary")} lineLimit={1}>{m.energy}</Text>
  </HStack>
}

async function main() {
  let snapshot = loadRuntimeMode() === "connected" ? loadWidgetSnapshot() : atelierDemo()
  let offline = false
  let needsLogin = false
  if (loadRuntimeMode() === "connected") {
    // A lost connected projection must not silently become an unlabelled demo.
    if (snapshot.source !== "network") snapshot = emptySnapshot()
    const age = Date.now() - Date.parse(snapshot.cachedAt)
    if (snapshot.source !== "network" || age >= (loadSettings().refreshIntervalMinutes ?? 30) * 60_000) {
      try { snapshot = await refreshConnectedSnapshot() } catch (error) { needsLogin = isSessionExpiredError(error); offline = !needsLogin }
    }
  }
  let car = loadCachedCarImage(snapshot)
  if (!car && snapshot.source === "network") car = await fetchOfficialCarImage(snapshot)
  if (Widget.family === "accessoryRectangular") {
    const m = widgetModel(snapshot, loadSettings(), { offline, needsLogin })
    Widget.present(<VStack alignment="leading" spacing={2} widgetURL={Script.createRunURLScheme(Script.name, { route: "overview" })}>
      <Text font={11} fontWeight="bold" lineLimit={1} minScaleFactor={0.7}>{m.title}</Text>
      <Text font={12} fontWeight="medium" lineLimit={1}>{`${m.range} km / ${m.energy}`}</Text>
      <Text font={9} lineLimit={1}>{`${m.lock} · ${m.notice || m.sync}`}</Text>
    </VStack>)
    return
  }
  const small = Widget.family === "systemSmall"
  Widget.present(<AtelierWidget snapshot={snapshot} car={car} small={small} offline={offline} needsLogin={needsLogin} unavailable={snapshot.localVehicleId === "not-connected"} />, {
    reloadPolicy: { policy: "after", date: new Date(Date.now() + (loadSettings().refreshIntervalMinutes ?? 30) * 60_000) },
  })
}

void main().catch(() => {
  Widget.present(<AtelierWidget snapshot={emptySnapshot()} car={null} unavailable small={Widget.family === "systemSmall"} />)
}).finally(() => Script.exit())

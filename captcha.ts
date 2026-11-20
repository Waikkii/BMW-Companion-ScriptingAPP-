// Native Scripting pixel loader. Scriptable uses its WebView adapter at build time.
function randomCaptchaX(): string { return (0.05 + Math.random() * 0.8).toFixed(2) }

export function findCaptchaPosition(base64: string): string {
  if (base64.length > 2_000_000) throw new Error("CAPTCHA_IMAGE_TOO_LARGE")
  const image = UIImage.fromBase64String(base64)
  if (!image) throw new Error("CAPTCHA_IMAGE_INVALID")
  if (typeof (image as any).getPixelData === "function") {
    return findCaptchaPositionFromPixels(image)
  }
  if (typeof (image as any).pixelColor === "function") {
    return findCaptchaPositionBySampling(image)
  }
  return randomCaptchaX()
}

const CAPTCHA_BLOCK_WIDTH = 15
const CAPTCHA_BLOCK_HEIGHT = 75
const CAPTCHA_TARGET = [220, 230, 221]
const CAPTCHA_TOLERANCE = 15

function captchaColorMatches(r: number, g: number, b: number): boolean {
  return Math.abs(r - CAPTCHA_TARGET[0]) <= CAPTCHA_TOLERANCE &&
    Math.abs(g - CAPTCHA_TARGET[1]) <= CAPTCHA_TOLERANCE &&
    Math.abs(b - CAPTCHA_TARGET[2]) <= CAPTCHA_TOLERANCE
}

// 策略一：getPixelData 全量像素（Scripting 3.3.0）
function findCaptchaPositionFromPixels(image: UIImage): string {
  const pixelData = image.getPixelData()
  const bytes = pixelData?.data.toUint8Array()
  if (!pixelData || !bytes) throw new Error("CAPTCHA_IMAGE_INVALID")

  const { width, height } = pixelData
  if (width < 50 || height < 75 || width > 2_000 || height > 2_000 || bytes.length !== width * height * 4) {
    throw new Error("CAPTCHA_IMAGE_DIMENSIONS_INVALID")
  }
  const matchesTarget = (x: number, y: number): boolean => {
    const offset = (y * width + x) * 4
    return captchaColorMatches(bytes[offset], bytes[offset + 1], bytes[offset + 2])
  }

  // Fixed bounds only. Use five cheap probes before the full 15×75 check so
  // arbitrary images cannot force the expensive inner scan at every pixel.
  for (let y = 0; y < height - CAPTCHA_BLOCK_HEIGHT; y += 1) {
    for (let x = 0; x < width - CAPTCHA_BLOCK_WIDTH; x += 1) {
      if (!matchesTarget(x, y) ||
          !matchesTarget(x + CAPTCHA_BLOCK_WIDTH - 1, y) ||
          !matchesTarget(x, y + CAPTCHA_BLOCK_HEIGHT - 1) ||
          !matchesTarget(x + CAPTCHA_BLOCK_WIDTH - 1, y + CAPTCHA_BLOCK_HEIGHT - 1) ||
          !matchesTarget(x + Math.floor(CAPTCHA_BLOCK_WIDTH / 2), y + Math.floor(CAPTCHA_BLOCK_HEIGHT / 2))) {
        continue
      }
      let found = true
      for (let dy = 0; dy < CAPTCHA_BLOCK_HEIGHT && found; dy += 1) {
        for (let dx = 0; dx < CAPTCHA_BLOCK_WIDTH; dx += 1) {
          if (!matchesTarget(x + dx, y + dy)) {
            found = false
            break
          }
        }
      }
      if (found) return ((x - 26) / width).toFixed(2)
    }
  }
  throw new Error("CAPTCHA_POSITION_NOT_FOUND")
}

// 策略二：pixelColor 单像素稀疏采样（Scripting 3.2.0 若支持该 API；速度稍慢但精确）
function findCaptchaPositionBySampling(image: UIImage): string {
  const width = image.width
  const height = image.height
  if (width < 50 || height < 75 || width > 2_000 || height > 2_000) {
    throw new Error("CAPTCHA_IMAGE_DIMENSIONS_INVALID")
  }
  const matches = (x: number, y: number): boolean => {
    const c = image.pixelColor(x, y)
    if (!c) return false
    return captchaColorMatches(Math.round((c as any).r * 255), Math.round((c as any).g * 255), Math.round((c as any).b * 255))
  }
  // 步长 4 粗扫，命中后向左/上找块左上角，再五点初验 + 全块精验（与 getPixelData 同标准）
  for (let y = 0; y <= height - CAPTCHA_BLOCK_HEIGHT; y += 4) {
    for (let x = 0; x <= width - CAPTCHA_BLOCK_WIDTH; x += 4) {
      if (!matches(x, y)) continue
      let ox = x
      while (ox > 0 && ox > x - 20 && matches(ox - 1, y)) ox--
      let oy = y
      while (oy > 0 && oy > y - 80 && matches(ox, oy - 1)) oy--
      if (!matches(ox + CAPTCHA_BLOCK_WIDTH - 1, oy) ||
          !matches(ox, oy + CAPTCHA_BLOCK_HEIGHT - 1) ||
          !matches(ox + CAPTCHA_BLOCK_WIDTH - 1, oy + CAPTCHA_BLOCK_HEIGHT - 1) ||
          !matches(ox + Math.floor(CAPTCHA_BLOCK_WIDTH / 2), oy + Math.floor(CAPTCHA_BLOCK_HEIGHT / 2))) {
        continue
      }
      // 全块精验：15×75 每个像素都匹配才确认，避免误判导致服务端 422
      let full = true
      for (let dy = 0; dy < CAPTCHA_BLOCK_HEIGHT && full; dy += 1) {
        for (let dx = 0; dx < CAPTCHA_BLOCK_WIDTH; dx += 1) {
          if (!matches(ox + dx, oy + dy)) {
            full = false
            break
          }
        }
      }
      if (full) return ((ox - 26) / width).toFixed(2)
    }
  }
  throw new Error("CAPTCHA_POSITION_NOT_FOUND")
}

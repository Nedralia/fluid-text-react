/**
 * Takes a color and shifts it towards another color by a given amount
 *
 * @param color The color to shift
 * @param other The color to shift towards
 * @param shift The amount to shift
 * @returns The shifted color
 */
export const shiftColorToOther = (color: string, other: string, shift: number): string => {
  const red = parseInt(color.slice(1, 3), 16)
  const green = parseInt(color.slice(3, 5), 16)
  const blue = parseInt(color.slice(5, 7), 16)
  const otherRed = parseInt(other.slice(1, 3), 16)
  const otherGreen = parseInt(other.slice(3, 5), 16)
  const otherBlue = parseInt(other.slice(5, 7), 16)

  const redShift = (otherRed - red) / 100
  const greenShift = (otherGreen - green) / 100
  const blueShift = (otherBlue - blue) / 100

  const newRed = Math.round(red + (redShift * shift))
  const newGreen = Math.round(green + (greenShift * shift))
  const newBlue = Math.round(blue + (blueShift * shift))

  const cappedRed = Math.min(Math.max(newRed, 0), 255)
  const cappedGreen = Math.min(Math.max(newGreen, 0), 255)
  const cappedBlue = Math.min(Math.max(newBlue, 0), 255)

  return `#${cappedRed.toString(16)}${cappedGreen.toString(16)}${cappedBlue.toString(16)}`
}

const toHue = (r: number, g: number, b: number): [number, number, number] => {
  const red = r / 255
  const green = g / 255
  const blue = b / 255
  const max = Math.max(red, green, blue)
  const min = Math.min(red, green, blue)
  let h = 0
  let s = 0
  const l = (max + min) / 2
  if (max === min) {
    h = 0
    s = 0
  } else {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case red:
        h = (green - blue) / d + (green < blue ? 6 : 0)
        break
      case green:
        h = (blue - red) / d + 2
        break
      case blue:
        h = (red - green) / d + 4
        break
    }
    h *= 60
  }
  return [h, s, l]
}

const fromHue = (h: number, s: number, l: number): [number, number, number] => {
  const c = (1 - Math.abs(2 * l - 1)) * s
  const x = c * (1 - Math.abs(h / 60 % 2 - 1))
  const m = l - c / 2
  let r = 0
  let g = 0
  let b = 0
  if (h < 60) {
    r = c
    g = x
  } else if (h < 120) {
    r = x
    g = c
  } else if (h < 180) {
    g = c
    b = x
  } else if (h < 240) {
    g = x
    b = c
  } else if (h < 300) {
    r = x
    b = c
  } else {
    r = c
    b = x
  }
  return [Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255)]
}

export const colorloop = (color: string): string => {
  // Will shift the color slightly towards the next color in the loop.
  // There will always be a next color, as the loop is a circle.

  const red = parseInt(color.slice(1, 3), 16)
  const green = parseInt(color.slice(3, 5), 16)
  const blue = parseInt(color.slice(5, 7), 16)

  const hue = toHue(red, green, blue)
  const newHue = (hue[0] + 10) % 360
  const newColor = fromHue(newHue, hue[1], hue[2])

  // Parse the new values to 2 digit hex
  const newRedHex = newColor[0].toString(16).padStart(2, '0')
  const newGreenHex = newColor[1].toString(16).padStart(2, '0')
  const newBlueHex = newColor[2].toString(16).padStart(2, '0')

  return `#${newRedHex}${newGreenHex}${newBlueHex}`
}

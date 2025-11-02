import { Font } from '@react-pdf/renderer'

// Register fonts once - shared across all PDFs
let fontsRegistered = false

export const registerPDFFonts = () => {
  if (fontsRegistered) return

  Font.register({
    family: 'CourierPrime',
    fonts: [
      {
        src: '/fonts/CourierPrime-Regular.ttf',
        fontWeight: 'normal',
      },
      {
        src: '/fonts/CourierPrime-Bold.ttf',
        fontWeight: 'bold',
      },
    ],
  })

  fontsRegistered = true
}

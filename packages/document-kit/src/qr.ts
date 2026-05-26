import QRCode from 'qrcode';
import type { QRCodeGeneratorOptions } from './types';

export async function generateQRCodeDataUrl(
  payload: string,
  options: QRCodeGeneratorOptions = {}
): Promise<string> {
  return QRCode.toDataURL(payload, {
    width: options.width ?? 150,
    margin: options.margin ?? 2,
    color: {
      dark: options.color?.dark ?? '#000000',
      light: options.color?.light ?? '#ffffff',
    },
    errorCorrectionLevel: options.errorCorrectionLevel ?? 'H',
  });
}

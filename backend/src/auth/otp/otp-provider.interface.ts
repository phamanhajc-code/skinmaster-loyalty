export const OTP_PROVIDER = 'OTP_PROVIDER';

/**
 * Contract every OTP delivery channel must satisfy — implement this against
 * a real vendor (Zalo ZNS, eSMS, SpeedSMS, Twilio...) and wire it up in
 * auth.module.ts once vendor credentials are available. Swapping providers
 * never touches auth.service.ts.
 */
export interface OtpProvider {
  send(phone: string, code: string): Promise<void>;
}

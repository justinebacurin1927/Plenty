import { Platform } from "react-native";
import * as Sharing from "expo-sharing";

/**
 * Share an image file via the system share sheet.
 *
 * @param {string} uri - Local file URI (from ViewShot capture)
 * @param {string} [subject] - Optional subject for email/share dialogs
 * @returns {boolean} Whether sharing was successful
 */
export async function shareImage(uri, subject) {
  if (!uri) return false;

  if (!(await Sharing.isAvailableAsync())) {
    console.warn("⚠️ Sharing is not available on this device");
    return false;
  }

  try {
    await Sharing.shareAsync(uri, {
      mimeType: "image/png",
      dialogTitle: subject || "Share with friends",
      UTI: "public.png",
    });
    return true;
  } catch (e) {
    console.warn("⚠️ Share failed:", e.message);
    return false;
  }
}

/**
 * Helper: capture, then share a view-shot ref.
 *
 * Usage: pass a ref created with React.useRef + ShareCardForwardRef
 *
 *   const cardRef = useRef(null);
 *   // ...
 *   <ShareCardForwardRef ref={cardRef} mode="streak" data={{...}} />
 *   // ...
 *   await captureAndShare(cardRef, "My Streak");
 */
export async function captureAndShare(viewShotRef, subject) {
  if (!viewShotRef?.current) return false;
  const uri = await viewShotRef.current.capture();
  if (!uri) return false;
  return await shareImage(uri, subject);
}

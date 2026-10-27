import { isHttpUrl } from "./postprocess";

/** Only http(s) links reach an href. Seeds and stored guides skip postprocess, so links are checked at render too. */
export function safeHref(url: string | undefined): string | undefined {
  return url && isHttpUrl(url) ? url : undefined;
}

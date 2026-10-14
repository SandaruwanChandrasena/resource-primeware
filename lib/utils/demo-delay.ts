// Demo only: a short wait so loaders are easy to see.
// Set DEMO_DELAY_MS in .env (milliseconds). 0 or missing = no delay.
export const DEMO_DELAY_MS = Math.max(0, Number(process.env.DEMO_DELAY_MS) || 0);

export async function demoDelay() {
  if (DEMO_DELAY_MS > 0) await new Promise((resolve) => setTimeout(resolve, DEMO_DELAY_MS));
}
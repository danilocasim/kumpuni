import { redirect } from "next/navigation";

/**
 * T059: Worker profile edit — reuses setup flow.
 * Redirect to setup where worker can edit profile, portfolio, rates, service area.
 */
export default async function WorkerProfilePage() {
  redirect("/worker/setup");
}

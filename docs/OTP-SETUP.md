# OTP / SMS not received — setup guide

The app sends the OTP **via Supabase Auth**, which uses **Twilio**. If you don’t receive the SMS, work through this list.

---

## 1. Supabase: enable Phone and set Twilio

1. Open **[Supabase Dashboard](https://supabase.com/dashboard)** → your project.
2. Go to **Authentication** → **Providers**.
3. Click **Phone**.
4. Turn **Enable Phone Sign-in** **ON**.
5. In the same form, set:
   - **Twilio Account SID** — from [Twilio Console](https://console.twilio.com) (Account Info on the right).
   - **Twilio Auth Token** — same place, click “Show” and copy.
   - **Twilio Phone Number** — a number you bought in Twilio (e.g. +1xxxxxxxxxx). This is the “from” number that sends the SMS.
6. Click **Save**.

If any of these is missing or wrong, Supabase will not send the OTP.

---

## 2. Twilio: trial account and verified numbers

If your Twilio account is a **trial**, you can only send SMS to **verified** numbers.

1. Go to **[Twilio Console](https://console.twilio.com)**.
2. Open **Phone Numbers** → **Manage** → **Verified Caller IDs** (or **Verify** → **Caller IDs**).
3. Click **Add a new Caller ID**.
4. Enter the number you use to log in, in E.164: **+639765544667** (replace with your real digits).
5. Complete verification (Twilio will send a code or call that number).
6. After it’s verified, try OTP again from the app.

---

## 3. Number format in the app

Use your full number. The app normalizes:

- `639765544667` → `+639765544667`
- `09765544667` → `+639765544667`

So you can enter either format; the SMS is sent to the normalized E.164 number.

---

## 4. Check Twilio logs

To see if Twilio is receiving the request and why delivery might fail:

1. [Twilio Console](https://console.twilio.com) → **Monitor** → **Logs** → **Messaging**.
2. Trigger “Padalhan ng code” in the app.
3. See if a new message appears and its status (e.g. sent, failed, unverified).

---

## 5. Supabase docs

- [Supabase Phone Login](https://supabase.com/docs/guides/auth/phone-login) — official setup with Twilio.

---

**Summary:** OTP is sent by **Supabase** using **Twilio**. Enable Phone in Supabase and add Twilio SID, Auth Token, and Twilio number there. If you’re on a Twilio trial, add your login number to Verified Caller IDs. Then try again.

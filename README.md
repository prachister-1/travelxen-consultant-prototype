# TravelXen consultant prototype

Clickable prototype of a Navan-style omnichannel consultant console. Genesys inbound is scored by an AI Supervisor, Ava contains in-policy work, and consultants take judgment, exceptions, and specialist routes.

**Product prototype only.** Local mock data. No authentication, databases, live booking/GDS/NDC, Genesys, Ava, or model calls. Integration fields are labelled demo data.

## Live demo

https://prachister-1.github.io/travelxen-consultant-prototype/

## Run locally

```bash
npm install
npm run dev
```

Opens at http://localhost:5173/

## Demo script (presenter)

1. **Inbox.** Click **Ava GDS path** (Jordan Hale). Replay the six GDS facts, then **Let Ava ticket AA 177**. Do not type GDS.
2. **Agents.** Pick Jordan, Maya, or Daniel. Replay helpers. Open the trip.
3. **Daniel Kim.** Refresh inventory, then **Hand UA 15 back to Ava**.
4. **Maya Patel.** She asked for a person. Attest the 19:30 ET meeting, then **Hand EI 60 back to Ava**.
5. **Sofia Rossi.** Ava is blocked. Route to a documents specialist — do not give immigration advice.
6. **Quality.** Capture the learning signal. Use **Reset demo** in the header to start over.

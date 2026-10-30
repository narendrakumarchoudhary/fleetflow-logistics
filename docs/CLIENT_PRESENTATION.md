# FleetFlow — Client Walkthrough

## One-line introduction

FleetFlow is a logistics operations workspace for managing consignments, fleet assets, drivers, delivery milestones, operating costs and billing from one authenticated application.

## Suggested 7-minute walkthrough

1. **Overview:** explain that the dashboard summarises shipment status, delivery completion, active fleet and exceptions from the connected records.
2. **Shipments:** create a consignment with customer, origin, destination, priority and registered vehicle/driver. Open it to show its event timeline and valid status changes.
3. **Tracking:** explain the difference between operational event tracking and GPS telemetry. The public customer URL is `/track/{trackingNumber}`; it exposes only the fields selected by the public tracking API.
4. **Fleet:** register a vehicle, maintain its status, fuel indicator and statutory document register. A vehicle attached to an active load cannot be archived.
5. **Drivers:** maintain licence and contact records, availability and vehicle assignment. A driver already attached to an active load cannot be archived.
6. **Operations centre:** show preventive maintenance, fuel ledger, driver attendance, GST invoice generation, payment receipts, proof-of-delivery metadata, notifications and audit history.
7. **Access and accountability:** demonstrate role-based access, account creation, password changes and administrative password reset. Explain that sensitive actions are recorded in the audit log.

## How a shipment moves through the system

- An authorised user creates the shipment. The API validates the request and checks the selected vehicle and driver.
- A resource already assigned to another active shipment is rejected by the API.
- Each tracking event is appended to the shipment history. The server validates the state transition and calculates progress consistently.
- Delivered or cancelled loads release vehicle and driver availability when no other active load uses them.
- Proof of delivery records receiver details and a document/signature URL, changes the shipment to Delivered and adds a timeline event.
- A public tracking page can be shared with a customer using the tracking number.

## What the application does not pretend to do

- The route/event timeline is not a live GPS feed. Live coordinates require a telematics provider, device/API credentials and a location map integration.
- POD document and signature fields store URLs. Actual file upload requires an object-storage account (for example S3 or Cloudinary), credentials, access policy and retention rules.
- In-app notifications are stored in MongoDB. Email, SMS and WhatsApp delivery require an approved provider account, sender identity, templates and credentials.
- The demo seed data is fictional and must not be presented as customer or fleet history.

## Suggested client closing

“The core operations workflow is implemented as a React client backed by protected Express APIs and MongoDB persistence. The system validates shipment transitions, driver/vehicle allocation and financial calculations on the server. External telematics, messaging and file storage are adapter integrations that can be enabled once the client selects providers and supplies credentials.”

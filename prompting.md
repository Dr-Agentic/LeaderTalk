Write module code using the handler/controller architecture.

Handler module file names must end with Handler.ts (e.g., PaymentProviderHandler.ts).

Controller module file names must end with Controller.ts (e.g., dbStorageController.ts).

Handlers may only interact with entities within their responsibility. (e.g., PaymentProviderHandler must not access OpenAIHandler).

Each function must be modular, reusable, and well-commented.

Functions implementation must fit within one smartphone screen (roughly 30 lines). If longer, refactor into smaller, reusable units.

Private (non-exported) functions must be prefixed with _, e.g., _retrieveUserFromDatabase().

Exported functions follow standard naming conventions.

Place all exported functions at the top, and all private ones at the bottom of the module file.

Always reuse existing functions and modules where applicable. Avoid duplicating logic.

Avoid hacks and quick fixes. Always implement clean, idiomatic, production-grade code unless otherwise instructed.

Prefer to implement logic in the backend, avoiding complex code in the client side. Before adding any new api, examine all available existing apis to see if they can deliver the functionality you are looking for.

Export all functions via a default object.

Import using a namespace, with a 3–5 letter lowercase alias based on the module name (e.g., import pph from './PaymentProviderHandler').

Do not implement default values and fake data. Prefer to have the code fail so that we can fix it effetively as opposed to working with fake data.

Use strong typing throughout. Avoid any unless absolutely necessary, and prefer interfaces for complex objects.

Do not implement or change code without being 95% sure of the change. If there is doubt, ask questions.
Do not start changing code with a clear instruction of what to do. 

Always be extra brief in your chats. Avoid repetition. Mention only the main facts.
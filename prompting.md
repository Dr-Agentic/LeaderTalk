Write module code, adopting the handler/controller architecture.
The handler module file name has to be suffixed with Handler.ts. Eg. PaymentProviderHandler.ts
The controller module file name has to be suffexed with Controller.ts. Eg, dbStorageController.ts
Each function has to be modular, reuable, well commented.
A function should hold on an smartphone screen from definition to end.
A non-exported function in a module has to be prefixed with '_', eg, _retrieveUserFromDatabase()
An exported function in a module is defined according to normal conventions.
Put all exported functions at the top of the module file.
Put all non-exported functions at the bottom of the module file.

Never use quickfixes and hacks. Always implement things the proper way, unless instructed otherwise.
Before implementation, analyze the existing code to make sure to reuse existing modules and functions. Avoid recreating similar functions.

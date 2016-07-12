Store Key **BETA**
===================


Store Key is a Key Store Server socket.io based memory cache server still in **BETA**. So don't use it in a production environment yet!

About
--------
 * Much like memcached or reddis, storekey saves data by key into json & memory.
 * Objects are stored in ram with an expiration time. If no time is defined an object will store indefinitely or until ram is maxed out.
 * When the storekey server reaches the defined memory value limit (currently 32mb) it will begin to pop memory objects off of the end of the keystore server data array.

----------


Running
-------------

```bash
npm start
```

> **Note:**

> - Store Key is accessible to all ip's once online.
> - Store Key has no security what so ever yet. It is still BETA.
> - Overloading the server will result in blank requests that are missed by the server. This is wanted behavior for now.

#### <i class="icon-file"></i> storekey.json

The storage folder <i class="icon-folder-open"></i> within the module contains the <i class="icon-file"></i> **storekey.json** file. This file contains a periodic saved state of your memory object. It is reloaded when the storekey server is reloaded.

TODO
--------

* Create a bin/storekey to aid in launching the server.
* Delta based JSON diff files (precursor to clustering)
* IP filtering
* NodeJS Client
* Multi-Threading requests

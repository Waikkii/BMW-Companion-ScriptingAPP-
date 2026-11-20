# Attribution

The BMW data client and original Scripting application are based on [BMW MINI Linker](https://github.com/zy5120/BMW-Companion-ScriptingAPP-), by 厦门硬骨头 and its listed contributors. The upstream project permits personal learning use and prohibits commercial use; this repository does not relicense the upstream sources.

The visual direction references [opp100/bmw-scriptable-widgets](https://github.com/opp100/bmw-scriptable-widgets), MIT licensed. Its obsolete authentication implementation is not used.

The inherited client embeds JSEncrypt 3.2.1 (MIT); the Scriptable adapter uses @noble/hashes 2.0.1 (MIT). Full notices are in `third_party_licenses/`.

BMW trademarks belong to their respective owners. The embedded roundel is from the [official public BMW SVG](https://www.bmw.com.cn/etc.clientlibs/ds2-webcomponents/clientlibs/clientlib/resources/img/BMW_Grey_Logo.svg). No vehicle photos or personal screenshots are included. Production vehicle images are retrieved by the authenticated BMW API at runtime and cached on the device.

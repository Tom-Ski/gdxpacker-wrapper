### Installation
`npm i -D gdxpacker-wrapper`

### Usage

```js
const pack = require("gdxpacker-wrapper");

pack.exec().then(r => console.log("Completed")).catch(er => {
console.error(er)
});
```

Create or run the exec function to generate a `packerConfig.json` which contains array of packing configs

```json
{
  "packingConfigs": [
    {
      "name": "Pack 1",
      "rawDirectory": "input",
      "outputDirectory": "output",
      "packName": "packed"
    }
  ]
}
```
Each packing config contains name for debug, the input and output directories and the name for the generated packed atlas.

Follows libgdx packing rules, `pack.json` files are read in packing destinations to override rules for each sub folder
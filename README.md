# CSVToJSON

CSV to JSON Parser :clipboard:. Developed in Node.js

### Directory Structure

```
├── package.json
├── README.md
├── src/
|   ├── index.js
|   ├── input.csv
|   ├── output.json
```

The input file must be in the `src/` directory.

### Run command

- `npm start [inputFileName.csv]`

The `inputFileName.csv` argument is not mandatory. If it isn't given the application will for `src/input.csv`.

The parsed output will be written in `src/output.json`

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

### Run command

- `npm start [inputFileName.csv]`

The `inputFileName.csv` argument is optional. If it isn't given the program will search for `src/input.csv`. If you want to use it, the input file must be in the `src/` directory.

The parsed output will be written in `src/output.json`.

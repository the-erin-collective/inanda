# Security Policy

## Patched Vulnerabilities

### Mongoose Vulnerability: `$where` in `populate()`

- **Package**: `mongoose`
- **Version**: `5.13.23`
- **Issue**: A vulnerability was identified in `mongoose` where the `$where` filter could be used in `populate()` queries, potentially leading to security risks.
- **Patch Applied**: A custom patch was applied using [`patch-package`](https://www.npmjs.com/package/patch-package) to prevent the use of `$where` in `populate()` queries.

#### Details of the Patch

The following changes were made to the `mongoose` source code:

1. **File**: `lib/helpers/populate/assignVals.js`
   - Replaced the `noop` function with a default transform function (`v => v`).

2. **File**: `lib/helpers/populate/getModelsMapForPopulate.js`
   - Added checks to throw an error if `$where` is used in `populate()` match conditions.

3. **Test**: The tests were not patched as they are not in the node modules distribution.

#### How the Patch is Applied

The patch is managed using `patch-package`. It is automatically applied after installing dependencies via the `postinstall` script in `package.json`:

```json
"scripts": {
  "postinstall": "patch-package"
}